import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AuthLayout, Field, Btn } from './LoginPage';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset your password" sub="Enter your email and we'll send a reset link">
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
            We've sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
          </p>
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>← Back to Sign In</Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email Address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hotel.com" />
          <Btn loading={loading}>Send Reset Link</Btn>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
            <Link to="/login" style={{ color: 'var(--accent)' }}>← Back to Sign In</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
