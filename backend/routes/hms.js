const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabaseAdmin');
const { authenticate, requireAdmin, requireActiveSubscription } = require('../middleware/auth');

// Use admin client that bypasses RLS for all DB operations
const supabase = supabaseAdmin;

// Apply auth + subscription check to all HMS routes
router.use(authenticate, requireActiveSubscription);

// ============================================
// ROOMS
// ============================================

router.get('/rooms', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, room_types(name, base_rate)')
      .eq('org_id', req.orgId)
      .order('room_number');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ rooms: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/rooms', requireAdmin, async (req, res) => {
  try {
    const { room_number, room_type_id, floor, status, notes } = req.body;
    if (!room_number) return res.status(400).json({ error: 'Room number is required' });

    // Check plan room limit
    const { data: org } = await supabase
      .from('organizations')
      .select('*, plans(*)')
      .eq('id', req.orgId)
      .single();

    const { count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', req.orgId);

    if (count >= (org?.plans?.max_rooms || 10)) {
      return res.status(403).json({ error: `Room limit reached for your plan (${org?.plans?.max_rooms} rooms). Please upgrade.` });
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({ org_id: req.orgId, room_number, room_type_id, floor: floor || 1, status: status || 'available', notes })
      .select('*, room_types(name, base_rate)')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Room number already exists' });
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ room: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.patch('/rooms/:id', requireAdmin, async (req, res) => {
  try {
    const { status, notes, room_type_id, floor } = req.body;
    const { data, error } = await supabase
      .from('rooms')
      .update({ status, notes, room_type_id, floor })
      .eq('id', req.params.id)
      .eq('org_id', req.orgId)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ room: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/rooms/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('rooms').delete()
      .eq('id', req.params.id).eq('org_id', req.orgId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Room deleted' });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/rooms/availability', async (req, res) => {
  try {
    const { checkin, checkout } = req.query;
    if (!checkin || !checkout) return res.status(400).json({ error: 'checkin and checkout dates required' });

    const { data: rooms } = await supabase
      .from('rooms')
      .select('*, room_types(name, base_rate)')
      .eq('org_id', req.orgId)
      .eq('status', 'available');

    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('room_id')
      .eq('org_id', req.orgId)
      .not('status', 'in', '("cancelled","checked-out","no-show")')
      .lt('checkin_date', checkout)
      .gt('checkout_date', checkin);

    const bookedRoomIds = new Set(conflictingBookings?.map(b => b.room_id) || []);
    const available = rooms?.map(r => ({ ...r, is_available: !bookedRoomIds.has(r.id) }));

    res.json({ rooms: available });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ============================================
// ROOM TYPES
// ============================================

router.get('/room-types', async (req, res) => {
  const { data, error } = await supabase.from('room_types').select('*').eq('org_id', req.orgId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ room_types: data });
});

router.post('/room-types', requireAdmin, async (req, res) => {
  const { name, base_rate, description, amenities } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { data, error } = await supabase.from('room_types')
    .insert({ org_id: req.orgId, name, base_rate: base_rate || 0, description, amenities: amenities || [] })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ room_type: data });
});

router.patch('/room-types/:id', requireAdmin, async (req, res) => {
  const { name, base_rate, description, amenities } = req.body;
  const { data, error } = await supabase.from('room_types')
    .update({ name, base_rate, description, amenities })
    .eq('id', req.params.id)
    .eq('org_id', req.orgId)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Room type not found' });
  res.json({ room_type: data });
});

router.delete('/room-types/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('room_types')
    .delete()
    .eq('id', req.params.id)
    .eq('org_id', req.orgId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ============================================
// GUESTS
// ============================================

router.get('/guests', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = supabase.from('guests').select('*', { count: 'exact' })
      .eq('org_id', req.orgId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ guests: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/guests', async (req, res) => {
  try {
    const { full_name, phone, email, id_type, id_number, address, nationality, notes } = req.body;
    if (!full_name) return res.status(400).json({ error: 'Guest name is required' });

    const { data, error } = await supabase.from('guests')
      .insert({ org_id: req.orgId, full_name, phone, email, id_type, id_number, address, nationality, notes })
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ guest: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/guests/:id', async (req, res) => {
  const { data, error } = await supabase.from('guests').select('*').eq('id', req.params.id).eq('org_id', req.orgId).single();
  if (error) return res.status(404).json({ error: 'Guest not found' });
  const { data: bookings } = await supabase.from('bookings').select('*, rooms(room_number), invoices(*)').eq('guest_id', req.params.id);
  res.json({ guest: data, bookings });
});

// ============================================
// BOOKINGS
// ============================================

router.get('/bookings', async (req, res) => {
  try {
    const { status, from_date, to_date, page = 1, limit = 20 } = req.query;
    let query = supabase.from('bookings')
      .select('*, guests(full_name, phone, email), rooms(room_number, room_types(name))', { count: 'exact' })
      .eq('org_id', req.orgId)
      .order('checkin_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (from_date) query = query.gte('checkin_date', from_date);
    if (to_date) query = query.lte('checkout_date', to_date);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ bookings: data, total: count });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/bookings', async (req, res) => {
  try {
    const { guest_id, room_id, checkin_date, checkout_date, num_guests, meal_plan, room_rate, source, special_requests, extra_mattress, referral_name } = req.body;

    if (!guest_id || !room_id || !checkin_date || !checkout_date) {
      return res.status(400).json({ error: 'guest_id, room_id, checkin_date, checkout_date are required' });
    }
    
    // Validate referral_name if source is referral
    if (source === 'referral' && !referral_name) {
      return res.status(400).json({ error: 'Referral name is required when source is referral' });
    }

    if (new Date(checkout_date) <= new Date(checkin_date)) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    // Check availability
    const { data: avail } = await supabase.rpc('check_room_available', {
      p_room_id: room_id, p_checkin: checkin_date, p_checkout: checkout_date
    });

    if (!avail) {
      return res.status(409).json({ error: 'Room is not available for the selected dates' });
    }

    const { data, error } = await supabase.from('bookings')
      .insert({
        org_id: req.orgId, guest_id, room_id, checkin_date, checkout_date,
        num_guests: num_guests || 1, meal_plan: meal_plan || 'EP',
        room_rate: room_rate || 0, source: source || 'walk-in',
        extra_mattress: extra_mattress || 0, referral_name: referral_name || null,
        special_requests, status: 'confirmed', created_by: req.user.id
      })
      .select('*, guests(full_name, phone), rooms(room_number)')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ booking: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.patch('/bookings/:id', async (req, res) => {
  try {
    const { status, checkin_time, checkout_time, special_requests, num_guests, meal_plan } = req.body;

    const { data, error } = await supabase.from('bookings')
      .update({ status, checkin_time, checkout_time, special_requests, num_guests, meal_plan })
      .eq('id', req.params.id).eq('org_id', req.orgId)
      .select('*, guests(full_name), rooms(room_number)').single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ booking: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/bookings/calendar', async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase.from('bookings')
      .select('*, guests(full_name), rooms(room_number, room_types(name))')
      .eq('org_id', req.orgId)
      .not('status', 'in', '("cancelled","no-show")')
      .lte('checkin_date', endDate)
      .gte('checkout_date', startDate);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ bookings: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ============================================
// INVOICES
// ============================================

router.get('/invoices', async (req, res) => {
  const { data, error } = await supabase.from('invoices')
    .select('*, guests(full_name), bookings(checkin_date, checkout_date, rooms(room_number))')
    .eq('org_id', req.orgId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ invoices: data });
});

router.post('/invoices', async (req, res) => {
  try {
    const { booking_id, guest_id, room_charges, food_charges, service_charges, other_charges, discount, gst_rate, payment_mode, notes } = req.body;

    const sub = (room_charges || 0) + (food_charges || 0) + (service_charges || 0) + (other_charges || 0) - (discount || 0);
    const gst = sub * ((gst_rate || 12) / 100);
    const total = sub + gst;

    // Auto-generate invoice number
    const { data: invNum } = await supabase.rpc('generate_invoice_number', { p_org_id: req.orgId });

    const { data, error } = await supabase.from('invoices')
      .insert({
        org_id: req.orgId, booking_id, guest_id,
        invoice_number: invNum,
        room_charges: room_charges || 0, food_charges: food_charges || 0,
        service_charges: service_charges || 0, other_charges: other_charges || 0,
        discount: discount || 0, subtotal: sub,
        gst_rate: gst_rate || 12, gst_amount: gst, total,
        payment_mode: payment_mode || 'cash', payment_status: 'paid', notes,
        created_by: req.user.id
      })
      .select('*, guests(full_name), bookings(checkin_date, checkout_date)').single();

    if (error) return res.status(500).json({ error: error.message });

    // Update booking status to checked-out if invoice generated
    if (booking_id) {
      await supabase.from('bookings').update({ status: 'checked-out' }).eq('id', booking_id);
    }

    res.status(201).json({ invoice: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ============================================
// INVENTORY
// ============================================

router.get('/inventory', async (req, res) => {
  const { mode, from_date, to_date } = req.query;
  let query = supabase.from('inventory_purchases').select('*').eq('org_id', req.orgId).order('purchase_date', { ascending: false });
  if (mode) query = query.eq('mode', mode);
  if (from_date) query = query.gte('purchase_date', from_date);
  if (to_date) query = query.lte('purchase_date', to_date);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ purchases: data });
});

router.post('/inventory', async (req, res) => {
  try {
    const { item_name, quantity, unit, rate, amount_paid, purchase_date, vendor, mode } = req.body;
    if (!item_name || !quantity || !rate) return res.status(400).json({ error: 'item_name, quantity, rate required' });

    const amountPaidVal = amount_paid === '' ? null : amount_paid;
    const { data, error } = await supabase.from('inventory_purchases')
      .insert({ org_id: req.orgId, item_name, quantity, unit: unit || 'pcs', rate, amount_paid: amountPaidVal, purchase_date: purchase_date || new Date().toISOString().split('T')[0], vendor, mode: mode || 'monthly', created_by: req.user.id })
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ purchase: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/inventory/:id', requireAdmin, async (req, res) => {
  await supabase.from('inventory_purchases').delete().eq('id', req.params.id).eq('org_id', req.orgId);
  res.json({ message: 'Deleted' });
});

// ============================================
// STAFF
// ============================================

router.get('/staff', async (req, res) => {
  const { data, error } = await supabase.from('staff_members').select('*').eq('org_id', req.orgId).eq('is_active', true).order('full_name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ staff: data });
});

router.post('/staff', requireAdmin, async (req, res) => {
  try {
    const { full_name, phone, role, id_number, salary, join_date } = req.body;
    if (!full_name) return res.status(400).json({ error: 'Name required' });

    const { data: org } = await supabase.from('organizations').select('*, plans(*)').eq('id', req.orgId).single();
    const { count } = await supabase.from('staff_members').select('*', { count: 'exact', head: true }).eq('org_id', req.orgId).eq('is_active', true);

    if (count >= (org?.plans?.max_staff || 5)) {
      return res.status(403).json({ error: `Staff limit reached for your plan. Please upgrade.` });
    }

    const salaryVal = salary === '' ? null : salary;
    const { data, error } = await supabase.from('staff_members')
      .insert({ org_id: req.orgId, full_name, phone, role: role || 'front-desk', id_number, salary: salaryVal, join_date })
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ staff: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

router.patch('/staff/:id', requireAdmin, async (req, res) => {
  const { full_name, phone, role, salary, is_active, join_date } = req.body;
  const salaryVal = salary === '' ? null : salary;
  const { data, error } = await supabase.from('staff_members').update({ full_name, phone, role, salary: salaryVal, is_active, join_date })
    .eq('id', req.params.id).eq('org_id', req.orgId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ staff: data });
});

router.delete('/staff/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('staff_members').delete().eq('id', req.params.id).eq('org_id', req.orgId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ============================================
// ATTENDANCE
// ============================================

router.get('/attendance', async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('attendance')
    .select('*, staff_members(full_name, role)')
    .eq('org_id', req.orgId).eq('date', targetDate);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ attendance: data, date: targetDate });
});

router.post('/attendance', async (req, res) => {
  try {
    const { staff_id, status, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('attendance')
      .upsert({
        org_id: req.orgId, staff_id, date: targetDate,
        status: status || 'present', check_in: new Date().toISOString()
      }, { onConflict: 'staff_id,date' })
      .select('*, staff_members(full_name)').single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ attendance: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const [rooms, bookingsToday, checkinsToday, monthlyRevenue, recentBookings] = await Promise.all([
      supabase.from('rooms').select('status').eq('org_id', req.orgId),
      supabase.from('bookings').select('id, status').eq('org_id', req.orgId)
        .not('status', 'in', '("cancelled","no-show")')
        .lte('checkin_date', today).gte('checkout_date', today),
      supabase.from('bookings').select('id').eq('org_id', req.orgId).eq('checkin_date', today),
      supabase.from('invoices').select('total').eq('org_id', req.orgId).eq('payment_status', 'paid').gte('created_at', monthStart),
      supabase.from('bookings').select('*, guests(full_name), rooms(room_number)').eq('org_id', req.orgId)
        .order('created_at', { ascending: false }).limit(5)
    ]);

    const totalRooms = rooms.data?.length || 0;
    const occupiedRooms = bookingsToday.data?.length || 0;
    const revenue = monthlyRevenue.data?.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0) || 0;

    res.json({
      stats: {
        total_rooms: totalRooms,
        occupied: occupiedRooms,
        available: totalRooms - occupiedRooms,
        occupancy_rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        checkins_today: checkinsToday.data?.length || 0,
        monthly_revenue: revenue
      },
      recent_bookings: recentBookings.data || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// SETTINGS
// ============================================

router.get('/settings', async (req, res) => {
  const { data, error } = await supabase.from('organizations').select('*').eq('id', req.orgId).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ settings: data });
});

router.patch('/settings', requireAdmin, async (req, res) => {
  try {
    const { name, settings } = req.body;
    const { data, error } = await supabase.from('organizations')
      .update({ name, settings }).eq('id', req.orgId).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ settings: data });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
