import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/dashboard/front-desk', label: 'Front Desk', icon: '🏨' },
  { to: '/dashboard/bookings', label: 'Bookings', icon: '📅' },
  { to: '/dashboard/rooms', label: 'Rooms', icon: '🚪' },
  { to: '/dashboard/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/dashboard/inventory', label: 'Inventory', icon: '📦' },
  { to: '/dashboard/staff', label: 'Staff', icon: '👥' },
];

const bottomNav = [
  { to: '/dashboard/billing', label: 'Billing & Plans', icon: '💳' },
  { to: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout() {
  const { user, org, logout, trialDaysLeft, isTrialExpired } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const daysLeft = trialDaysLeft();
  const expired = isTrialExpired();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#12100e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff' }}>Smart<span style={{ color: '#7eb8e8' }}>Hotel</span></div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{org?.name || 'HMS'}</div>
        </div>

        {/* Trial Banner */}
        {org?.subscription_status === 'trial' && (
          <div style={{ margin: '12px 14px', background: expired ? 'rgba(185,28,28,0.2)' : 'rgba(200,169,110,0.15)', border: `1px solid ${expired ? 'rgba(185,28,28,0.3)' : 'rgba(200,169,110,0.3)'}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: expired ? '#fca5a5' : '#c8a96e', marginBottom: 3 }}>{expired ? '⚠ Trial Expired' : `⏱ ${daysLeft} days left`}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{expired ? 'Upgrade to continue' : 'Free trial active'}</div>
          </div>
        )}

        {/* Main Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          <div style={{ padding: '6px 16px 4px', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Operations</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#7eb8e8' : 'transparent'}`,
                fontSize: 13.5, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s'
              })}>
              <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
            </NavLink>
          ))}

          <div style={{ padding: '16px 16px 4px', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 8 }}>Account</div>
          {bottomNav.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#7eb8e8' : 'transparent'}`,
                fontSize: 13.5, fontWeight: 500, textDecoration: 'none'
              })}>
              <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{ padding: '16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Expired subscription banner */}
        {expired && (
          <div style={{ background: 'var(--red)', color: '#fff', padding: '10px 24px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠ Your trial has expired. Some features may be restricted.</span>
            <NavLink to="/dashboard/billing" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Upgrade Now →</NavLink>
          </div>
        )}
        <div style={{ padding: 28, flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
