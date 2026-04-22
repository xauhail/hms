import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AuthLayout, Field, Btn, PasswordField } from './LoginPage';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', hotel_name: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Start your free trial" sub="14 days free • No credit card required">
      <form onSubmit={submit}>
        <Field label="Your Full Name" name="full_name" value={form.full_name} onChange={handle} placeholder="John Sharma" />
        <Field label="Hotel / Property Name" name="hotel_name" value={form.hotel_name} onChange={handle} placeholder="Grand Palace Hotel" />
        <Field label="Email Address" name="email" type="email" value={form.email} onChange={handle} placeholder="you@hotel.com" />
        <PasswordField label="Password (min 8 chars)" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
        <div style={{ background: 'var(--accent-light)', border: '1px solid #b8d4ec', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent)', marginBottom: 20 }}>
          ✓ 14-day free trial with all Professional features included
        </div>
        <Btn loading={loading}>Create Account →</Btn>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
