import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { MetricCard, Card, Badge, Spinner, Grid } from '../../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const { org } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/hms/dashboard'),
    ]).then(([{ data }]) => {
      setStats(data.stats);
      setBookings(data.recent_bookings || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Simple weekly revenue mock for chart (in real app, fetch from backend)
  const chartData = [
    { day: 'Mon', revenue: 12000 }, { day: 'Tue', revenue: 18500 },
    { day: 'Wed', revenue: 9200 }, { day: 'Thu', revenue: 22000 },
    { day: 'Fri', revenue: 31000 }, { day: 'Sat', revenue: 28500 },
    { day: 'Sun', revenue: 19800 },
  ];

  const statusBadge = (s) => {
    const map = { confirmed: 'info', 'checked-in': 'success', 'checked-out': 'default', cancelled: 'danger', 'no-show': 'warning' };
    return <Badge variant={map[s] || 'default'}>{s}</Badge>;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px' }}>{getGreeting()} 👋</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 14 }}>{today} · {org?.name}</p>
      </div>

      {/* Metrics */}
      <Grid cols={4} gap={14} style={{ marginBottom: 20 }}>
        <MetricCard label="Total Rooms" value={stats?.total_rooms || 0} sub="Property capacity" icon="🏨" />
        <MetricCard label="Occupied" value={stats?.occupied || 0} color="var(--accent)" sub={`${stats?.occupancy_rate || 0}% occupancy`} icon="🔴" />
        <MetricCard label="Available" value={stats?.available || 0} color="var(--green)" sub="Ready to book" icon="🟢" />
        <MetricCard label="Revenue (Month)" value={`₹${(stats?.monthly_revenue || 0).toLocaleString('en-IN')}`} sub="From paid invoices" icon="💰" />
      </Grid>

      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, marginTop: 16 }}>
        {/* Revenue Chart */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Stats */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Today's Overview</h3>
          {[
            { label: "Check-ins Today", value: stats?.checkins_today || 0, icon: '→', color: 'var(--accent)' },
            { label: "Occupancy Rate", value: `${stats?.occupancy_rate || 0}%`, icon: '📊', color: 'var(--green)' },
            { label: "Rooms Available", value: stats?.available || 0, icon: '✓', color: 'var(--green)' },
            { label: "Rooms Occupied", value: stats?.occupied || 0, icon: '●', color: 'var(--red)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: item.color, fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 13.5 }}>{item.label}</span>
              </div>
              <span style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif', color: item.color }}>{item.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Occupancy Bar</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{stats?.occupancy_rate || 0}%</span>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${stats?.occupancy_rate || 0}%`, background: 'var(--accent)', height: '100%', borderRadius: 6, transition: 'width 0.8s ease' }} />
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Recent Bookings</h3>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 14 }}>No bookings yet. Add your first guest from Front Desk.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Guest', 'Room', 'Check-in', 'Check-out', 'Status'].map(h => (
                <th key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 12px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13.5, fontWeight: 500 }}>{b.guests?.full_name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--muted)' }}>Room {b.rooms?.room_number}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{b.checkin_date}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{b.checkout_date}</td>
                  <td style={{ padding: '10px 12px' }}>{statusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
