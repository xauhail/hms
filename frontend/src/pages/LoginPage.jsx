import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function EyeIcon({ visible }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" sub="Sign in to your SmartHotel account">
      <form onSubmit={submit}>
        <Field label="Email Address" name="email" type="email" value={form.email} onChange={handle} placeholder="you@hotel.com" />
        <PasswordField label="Password" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)' }}>Forgot password?</Link>
        </div>
        <Btn loading={loading}>Sign In</Btn>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Start free trial</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({ title, sub, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--text)' }}>Smart<span style={{ color: 'var(--accent)' }}>Hotel</span></span>
        </Link>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>{title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, name, type = 'text', value, onChange, placeholder, required = true }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

export function PasswordField({ label, name, value, onChange, placeholder, required = true }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input name={name} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} required={required}
          style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button type="button" onClick={() => setVisible(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center' }} aria-label={visible ? 'Hide password' : 'Show password'}>
          <EyeIcon visible={visible} />
        </button>
      </div>
    </div>
  );
}

export function Btn({ children, loading, type = 'submit', onClick, variant = 'primary' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: variant === 'primary' ? 'var(--accent)' : 'var(--surface)', color: variant === 'primary' ? '#fff' : 'var(--text)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Syne, sans-serif' }}>
      {loading ? 'Please wait...' : children}
    </button>
  );
}
