// ============================================================
// NewBooking.jsx - Comprehensive Booking Form
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { PageHeader, Card, Badge, Spinner } from '../../components/UI';

export function NewBooking() {
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchGuest, setSearchGuest] = useState('');
  const [showGuestSearch, setShowGuestSearch] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    // Guest Info
    guest_id: '',
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    isNewGuest: false,
    
    // Booking Details
    checkin_date: new Date().toISOString().split('T')[0],
    checkout_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    room_type_id: '',
    room_id: '',
    adults: 1,
    children: 0,
    
    // Payment & Source
    payment_mode: 'cash',
    booking_source: 'direct',
    referral_name: '',
    booking_status: 'confirmed',
    payment_status: 'pending',
    special_requests: '',
    room_rate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gRes, rRes, tRes] = await Promise.all([
        api.get('/hms/guests?limit=500'),
        api.get('/hms/rooms'),
        api.get('/hms/room-types')
      ]);
      setGuests(gRes.data.guests || []);
      setRooms(rRes.data.rooms || []);
      setRoomTypes(tRes.data.room_types || []);
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  // Filter available rooms when room type changes
  const availableRooms = useMemo(() => {
    if (!form.room_type_id) return [];
    return rooms.filter(r => 
      r.room_type_id === form.room_type_id && 
      r.status === 'available'
    );
  }, [form.room_type_id, rooms]);

  // Calculate nights and estimated total
  const nights = useMemo(() => {
    const checkin = new Date(form.checkin_date);
    const checkout = new Date(form.checkout_date);
    const diff = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [form.checkin_date, form.checkout_date]);

  const estimatedTotal = useMemo(() => {
    const rate = parseFloat(form.room_rate) || 0;
    return nights * rate;
  }, [nights, form.room_rate]);

  // Auto-fill room rate when room is selected
  useEffect(() => {
    if (form.room_id) {
      const room = rooms.find(r => r.id === form.room_id);
      if (room) {
        setForm(p => ({ ...p, room_rate: room.rate_per_night || room.room_types?.base_rate || '' }));
      }
    }
  }, [form.room_id, rooms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // Guest search and selection
  const filteredGuests = useMemo(() => {
    if (!searchGuest.trim()) return [];
    const term = searchGuest.toLowerCase();
    return guests.filter(g => 
      g.full_name?.toLowerCase().includes(term) || 
      g.phone?.includes(term) ||
      g.email?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [searchGuest, guests]);

  const selectGuest = (guest) => {
    setForm(p => ({
      ...p,
      guest_id: guest.id,
      full_name: guest.full_name,
      email: guest.email || '',
      phone: guest.phone || '',
      id_number: guest.id_number || '',
      isNewGuest: false
    }));
    setSearchGuest('');
    setShowGuestSearch(false);
  };

  const setNewGuest = () => {
    setForm(p => ({
      ...p,
      guest_id: '',
      full_name: '',
      email: '',
      phone: '',
      id_number: '',
      isNewGuest: true
    }));
    setShowGuestSearch(false);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.full_name.trim()) { toast.error('Guest name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    if (!form.room_id) { toast.error('Please select a room'); return; }
    if (!form.checkin_date || !form.checkout_date) { toast.error('Check-in and check-out dates are required'); return; }
    if (form.booking_source === 'referral' && !form.referral_name.trim()) {
      toast.error('Referral name is required'); return;
    }

    try {
      let guestId = form.guest_id;
      
      // Create new guest if needed
      if (form.isNewGuest || !guestId) {
        const { data: guestData } = await api.post('/hms/guests', {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          id_number: form.id_number
        });
        guestId = guestData.guest.id;
      }

      // Create booking
      const bookingPayload = {
        guest_id: guestId,
        room_id: form.room_id,
        checkin_date: form.checkin_date,
        checkout_date: form.checkout_date,
        num_guests: parseInt(form.adults) + parseInt(form.children),
        room_rate: parseFloat(form.room_rate) || 0,
        source: form.booking_source,
        referral_name: form.booking_source === 'referral' ? form.referral_name : null,
        status: form.booking_status,
        special_requests: form.special_requests
      };

      const { data: bookingData } = await api.post('/hms/bookings', bookingPayload);

      // If payment status is paid, create invoice
      if (form.payment_status === 'paid') {
        await api.post('/hms/invoices', {
          booking_id: bookingData.booking.id,
          guest_id: guestId,
          line_items: [{
            description: `Room ${nights} night(s)`,
            quantity: nights,
            rate: parseFloat(form.room_rate) || 0
          }],
          discount: 0,
          gst_rate: 12,
          payment_mode: form.payment_mode,
          payment_status: 'paid'
        });
      }

      toast.success('Booking created successfully!');
      
      // Reset form
      setForm({
        guest_id: '',
        full_name: '',
        email: '',
        phone: '',
        id_number: '',
        isNewGuest: false,
        checkin_date: new Date().toISOString().split('T')[0],
        checkout_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        room_type_id: '',
        room_id: '',
        adults: 1,
        children: 0,
        payment_mode: 'cash',
        booking_source: 'direct',
        referral_name: '',
        booking_status: 'confirmed',
        payment_status: 'pending',
        special_requests: '',
        room_rate: ''
      });
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create booking');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="New Booking" 
        subtitle="Create a new room reservation. Search for an existing guest or register a new one."
      />

      <form onSubmit={submitBooking}>
        {/* Guest Information Section */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--accent-light)' }}>
            Guest Information
          </div>

          {/* Guest Search */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
              Search Existing Guest
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                type="text" 
                value={searchGuest} 
                onChange={e => setSearchGuest(e.target.value)}
                onFocus={() => setShowGuestSearch(true)}
                placeholder="Search by name, phone, or email..."
                style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
              <button 
                type="button"
                onClick={setNewGuest}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                + New Guest
              </button>
            </div>
            
            {/* Guest Search Results */}
            {showGuestSearch && searchGuest.trim() && (
              <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', background: 'var(--surface)' }}>
                {filteredGuests.length > 0 ? (
                  filteredGuests.map(guest => (
                    <div 
                      key={guest.id}
                      onClick={() => selectGuest(guest)}
                      style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', hover: { background: 'var(--surface2)' } }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{guest.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{guest.phone} · {guest.email}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 12, color: 'var(--muted)', fontSize: 13 }}>No guests found</div>
                )}
              </div>
            )}
          </div>

          {/* Guest Details Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Full Name *
              </label>
              <input 
                name="full_name" 
                type="text" 
                value={form.full_name} 
                onChange={handleChange}
                placeholder="Guest full name"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Email *
              </label>
              <input 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange}
                placeholder="guest@email.com"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Phone Number *
              </label>
              <input 
                name="phone" 
                type="tel" 
                value={form.phone} 
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                ID/Passport Number
              </label>
              <input 
                name="id_number" 
                type="text" 
                value={form.id_number} 
                onChange={handleChange}
                placeholder="ID number"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </Card>

        {/* Booking Details Section */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--accent-light)' }}>
            Booking Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Check-in Date *
              </label>
              <input 
                name="checkin_date" 
                type="date" 
                value={form.checkin_date} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Check-out Date *
              </label>
              <input 
                name="checkout_date" 
                type="date" 
                value={form.checkout_date} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Room Type *
              </label>
              <select 
                name="room_type_id" 
                value={form.room_type_id} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">Select room type</option>
                {roomTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Room Number *
              </label>
              <select 
                name="room_id" 
                value={form.room_id} 
                onChange={handleChange}
                required
                disabled={!form.room_type_id}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', opacity: !form.room_type_id ? 0.6 : 1 }}
              >
                <option value="">{form.room_type_id ? 'Select room' : 'Select room type first'}</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} (₹{r.rate_per_night || r.room_types?.base_rate || 0}/night, max {r.capacity || 2} guests)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Adults * (max 4)
              </label>
              <input 
                name="adults" 
                type="number" 
                value={form.adults} 
                onChange={handleChange}
                min="1" 
                max="4"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Children
              </label>
              <input 
                name="children" 
                type="number" 
                value={form.children} 
                onChange={handleChange}
                min="0" 
                max="4"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </Card>

        {/* Payment & Source Section */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--accent-light)' }}>
            Payment & Source
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Payment Method
              </label>
              <select 
                name="payment_mode" 
                value={form.payment_mode} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online Transfer</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Booking Source
              </label>
              <select 
                name="booking_source" 
                value={form.booking_source} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="direct">Direct</option>
                <option value="referral">Referral</option>
                <option value="booking.com">Booking.com</option>
                <option value="mmt">MakeMyTrip</option>
                <option value="airbnb">Airbnb</option>
                <option value="walk-in">Walk-in</option>
              </select>
            </div>
            
            {/* Conditional Referral Name */}
            {form.booking_source === 'referral' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                  Referral Name *
                </label>
                <input 
                  name="referral_name" 
                  type="text" 
                  value={form.referral_name} 
                  onChange={handleChange}
                  placeholder="Who referred this guest?"
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--accent)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            )}
            
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Booking Status
              </label>
              <select 
                name="booking_status" 
                value={form.booking_status} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="confirmed">Confirmed</option>
                <option value="checked-in">Checked-in</option>
                <option value="checked-out">Checked-out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Payment Status
              </label>
              <select 
                name="payment_status" 
                value={form.payment_status} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                Room Rate (₹/night)
              </label>
              <input 
                name="room_rate" 
                type="number" 
                value={form.room_rate} 
                onChange={handleChange}
                min="0"
                placeholder="Auto-filled from room"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Estimated Total */}
          <div style={{ marginTop: 16, padding: 16, background: 'var(--surface2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {nights} night(s) × ₹{form.room_rate || 0}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Estimated Total (excl. GST)
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
              ₹{estimatedTotal.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Special Requests */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
              Special Requests
            </label>
            <textarea 
              name="special_requests" 
              value={form.special_requests} 
              onChange={handleChange}
              placeholder="Any special requests or notes..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </Card>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button 
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Reset
          </button>
          <button 
            type="submit"
            style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Create Booking
          </button>
        </div>
      </form>
    </div>
  );
}
