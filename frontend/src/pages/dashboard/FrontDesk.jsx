import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { PageHeader, Card, Btn, Badge, Modal, Input, Select, FormRow, Table, Spinner } from '../../components/UI';

const statusBadge = (s) => {
  const map = { confirmed: 'info', 'checked-in': 'success', 'checked-out': 'default', cancelled: 'danger' };
  return <Badge variant={map[s] || 'default'}>{s}</Badge>;
};

export default function FrontDesk() {
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', id_type: 'aadhaar', id_number: '',
    checkin_date: new Date().toISOString().split('T')[0],
    checkout_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    num_guests: 1, meal_plan: 'EP', source: 'walk-in', room_rate: '', special_requests: ''
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes] = await Promise.all([api.get('/hms/bookings?limit=50')]);
      setBookings(bRes.data.bookings || []);
    } catch (e) { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const checkAvailability = async () => {
    if (!form.checkin_date || !form.checkout_date) return;
    setCheckingAvail(true);
    try {
      const { data } = await api.get(`/hms/rooms/availability?checkin=${form.checkin_date}&checkout=${form.checkout_date}`);
      setAvailableRooms(data.rooms || []);
    } catch { toast.error('Failed to check availability'); }
    setCheckingAvail(false);
  };

  useEffect(() => {
    if (showModal) checkAvailability();
  }, [form.checkin_date, form.checkout_date, showModal]);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) { toast.error('Please select a room'); return; }
    try {
      // Create or find guest
      const { data: gData } = await api.post('/hms/guests', {
        full_name: form.full_name, phone: form.phone, email: form.email,
        id_type: form.id_type, id_number: form.id_number
      });
      // Create booking
      await api.post('/hms/bookings', {
        guest_id: gData.guest.id, room_id: selectedRoom,
        checkin_date: form.checkin_date, checkout_date: form.checkout_date,
        num_guests: parseInt(form.num_guests), meal_plan: form.meal_plan,
        room_rate: parseFloat(form.room_rate) || 0, source: form.source,
        special_requests: form.special_requests
      });
      // Update booking to checked-in
      toast.success('Guest checked in successfully!');
      setShowModal(false);
      setSelectedRoom(null);
      setForm(p => ({ ...p, full_name: '', phone: '', email: '', id_number: '' }));
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const checkOut = async (bookingId) => {
    try {
      await api.patch(`/hms/bookings/${bookingId}`, { status: 'checked-out' });
      toast.success('Guest checked out');
      fetchAll();
    } catch { toast.error('Failed to check out'); }
  };

  const filtered = bookings.filter(b =>
    !search || b.guests?.full_name?.toLowerCase().includes(search.toLowerCase()) || b.guests?.phone?.includes(search)
  );

  const cols = [
    { key: 'guest', label: 'Guest', render: (_, r) => <div><div style={{ fontWeight: 600 }}>{r.guests?.full_name}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.guests?.phone}</div></div> },
    { key: 'room', label: 'Room', render: (_, r) => `Room ${r.rooms?.room_number}` },
    { key: 'checkin_date', label: 'Check-in' },
    { key: 'checkout_date', label: 'Check-out' },
    { key: 'meal_plan', label: 'Meal' },
    { key: 'source', label: 'Source', render: (v) => <Badge>{v}</Badge> },
    { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
    {
      key: 'actions', label: 'Actions', render: (_, r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {r.status === 'confirmed' && <Btn size="sm" variant="success" onClick={() => checkOut(r.id)}>Check-out</Btn>}
          {r.status !== 'cancelled' && r.status !== 'checked-out' &&
            <Btn size="sm" variant="danger" onClick={async () => { await api.patch(`/hms/bookings/${r.id}`, { status: 'cancelled' }); toast.success('Cancelled'); fetchAll(); }}>Cancel</Btn>}
        </div>
      )
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Front Desk">
        <Btn onClick={() => setShowModal(true)}>+ New Check-in</Btn>
      </PageHeader>

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests by name or phone..."
            style={{ flex: 1, maxWidth: 320, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <Table columns={cols} data={filtered} emptyText="No bookings yet. Add your first guest!" />
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Guest Check-in" width={600}>
        <form onSubmit={submit}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Guest Details</div>
          <FormRow>
            <Input label="Full Name *" name="full_name" value={form.full_name} onChange={handle} placeholder="Rahul Sharma" required />
            <Input label="Phone *" name="phone" value={form.phone} onChange={handle} placeholder="9876543210" required />
          </FormRow>
          <FormRow>
            <Input label="Email" name="email" type="email" value={form.email} onChange={handle} placeholder="guest@email.com" />
            <Select label="ID Type" name="id_type" value={form.id_type} onChange={handle}>
              <option value="aadhaar">Aadhaar</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </Select>
          </FormRow>
          <Input label="ID Number" name="id_number" value={form.id_number} onChange={handle} placeholder="XXXX XXXX XXXX" />

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Booking Details</div>
          <FormRow>
            <Input label="Check-in Date *" name="checkin_date" type="date" value={form.checkin_date} onChange={handle} required />
            <Input label="Check-out Date *" name="checkout_date" type="date" value={form.checkout_date} onChange={handle} required />
          </FormRow>
          <FormRow>
            <Input label="No. of Guests" name="num_guests" type="number" value={form.num_guests} onChange={handle} />
            <Select label="Meal Plan" name="meal_plan" value={form.meal_plan} onChange={handle}>
              <option value="EP">EP (Room Only)</option>
              <option value="CP">CP (+ Breakfast)</option>
              <option value="MAP">MAP (+ Breakfast & Dinner)</option>
              <option value="AP">AP (All Meals)</option>
            </Select>
          </FormRow>
          <FormRow>
            <Select label="Source" name="source" value={form.source} onChange={handle}>
              <option value="walk-in">Walk-in</option>
              <option value="booking.com">Booking.com</option>
              <option value="mmt">MakeMyTrip</option>
              <option value="airbnb">Airbnb</option>
              <option value="referral">Referral</option>
              <option value="direct">Direct Call</option>
            </Select>
            <Input label="Room Rate (₹/night)" name="room_rate" type="number" value={form.room_rate} onChange={handle} placeholder="2500" />
          </FormRow>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
            Select Room {checkingAvail && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>— checking...</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, maxHeight: 160, overflowY: 'auto', marginBottom: 16 }}>
            {availableRooms.map(room => (
              <div key={room.id} onClick={() => room.is_available && setSelectedRoom(room.id)}
                style={{ textAlign: 'center', padding: '10px 6px', border: `2px solid ${selectedRoom === room.id ? 'var(--accent)' : room.is_available ? '#86efac' : '#fca5a5'}`, borderRadius: 8, cursor: room.is_available ? 'pointer' : 'not-allowed', background: selectedRoom === room.id ? 'var(--accent-light)' : room.is_available ? '#f0fdf4' : '#fff5f5', opacity: room.is_available ? 1 : 0.6 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{room.room_number}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{room.room_types?.name || 'Standard'}</div>
                <div style={{ fontSize: 10, color: room.is_available ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{room.is_available ? 'Free' : 'Taken'}</div>
              </div>
            ))}
            {availableRooms.length === 0 && !checkingAvail && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No rooms configured yet. Add rooms in Settings.</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn type="submit">Complete Check-in</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
