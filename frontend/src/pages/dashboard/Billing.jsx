import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Btn, Badge, Spinner } from '../../components/UI';

export default function BillingPage() {
  const { org, setOrg } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/billing/plans'),
      api.get('/billing/subscription')
    ]).then(([{ data: pd }, { data: sd }]) => {
      setPlans(pd.plans || []);
      setSubscription(sd.subscription);
      setHistory(sd.payment_history || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (paise) => '₹' + (paise / 100).toLocaleString('en-IN');

  const handleUpgrade = async (plan) => {
    setPaying(plan.id);
    try {
      const { data: order } = await api.post('/billing/create-order', {
        plan_id: plan.id,
        billing_period: billing
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || order.razorpay_key,
        amount: order.amount,
        currency: 'INR',
        name: 'SmartHotel HMS',
        description: `${plan.name} Plan — ${billing === 'yearly' ? 'Annual' : 'Monthly'}`,
        order_id: order.order_id,
        prefill: { name: org?.name, email: '' },
        theme: { color: '#1d4e89' },
        handler: async (response) => {
          try {
            const { data } = await api.post('/billing/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
              billing_period: billing
            });
            toast.success(data.message || 'Subscription activated!');
            // Refresh subscription
            const { data: sd } = await api.get('/billing/subscription');
            setSubscription(sd.subscription);
            setHistory(sd.payment_history || []);
            if (setOrg) setOrg(sd.subscription);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setPaying(null) }
      };

      if (typeof window.Razorpay === 'undefined') {
        toast.error('Razorpay not loaded. Please refresh the page.');
        setPaying(null);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error('Payment failed. Please try again.'); setPaying(null); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate payment');
      setPaying(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = { active: 'success', trial: 'info', cancelled: 'danger', expired: 'danger' };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  };

  if (loading) return <Spinner />;

  const features = (f) => Array.isArray(f) ? f : JSON.parse(f || '[]');
  const isCurrentPlan = (planId) => subscription?.plan_id === planId && subscription?.subscription_status === 'active';

  return (
    <div>
      <PageHeader title="Billing & Plans" />

      {/* Current subscription status */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Current Subscription</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>
              {subscription?.plans?.name || 'Trial'} {getStatusBadge(subscription?.subscription_status)}
            </div>
            {subscription?.subscription_status === 'trial' && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Trial ends: <strong>{new Date(subscription?.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
            )}
            {subscription?.subscription_status === 'active' && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Renews: <strong>{new Date(subscription?.subscription_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
            )}
          </div>
          {subscription?.subscription_status === 'active' && (
            <Btn variant="danger" onClick={async () => {
              if (!confirm('Cancel subscription? Access continues until period ends.')) return;
              await api.post('/billing/cancel');
              toast.success('Subscription cancelled');
              const { data } = await api.get('/billing/subscription');
              setSubscription(data.subscription);
            }}>Cancel Subscription</Btn>
          )}
        </div>
      </Card>

      {/* Billing period toggle */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, gap: 4 }}>
          {['monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setBilling(p)}
              style={{ padding: '8px 22px', borderRadius: 7, border: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: billing === p ? 'var(--accent)' : 'transparent', color: billing === p ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}>
              {p === 'monthly' ? 'Monthly' : 'Yearly'}{p === 'yearly' && <span style={{ fontSize: 10, opacity: 0.85, marginLeft: 4 }}>Save 17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
        {plans.map(plan => {
          const isPro = plan.slug === 'professional';
          const price = billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <div key={plan.id} style={{ background: 'var(--surface)', border: `${isPro ? '2px' : '1.5px'} solid ${isPro ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: 28, position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              {isPro && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '1px', textTransform: 'uppercase' }}>Most Popular</div>}
              {isCurrent && <div style={{ position: 'absolute', top: 12, right: 12 }}><Badge variant="success">Current</Badge></div>}

              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>{plan.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Up to {plan.max_rooms >= 999 ? 'Unlimited' : plan.max_rooms} rooms · {plan.max_staff >= 999 ? 'Unlimited' : plan.max_staff} staff</div>
              <div style={{ marginTop: 16, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: 'var(--accent)' }}>{fmt(price)}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>/{billing === 'yearly' ? 'year' : 'month'}</span>
              </div>
              {billing === 'yearly' && <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 16 }}>= {fmt(Math.round(price / 12))}/month</div>}

              <ul style={{ listStyle: 'none', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {features(plan.features).map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => !isCurrent && handleUpgrade(plan)} disabled={isCurrent || paying === plan.id}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: isCurrent ? '1.5px solid var(--border)' : 'none', background: isCurrent ? 'transparent' : isPro ? 'var(--accent)' : 'var(--text)', color: isCurrent ? 'var(--muted)' : '#fff', fontSize: 14, fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer', fontFamily: 'Syne, sans-serif', opacity: (isCurrent || paying) ? 0.7 : 1 }}>
                {paying === plan.id ? 'Opening payment...' : isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      {history.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Payment History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Date', 'Plan', 'Amount', 'Period', 'Status'].map(h => (
                <th key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 14px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {history.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{p.plans?.name || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>₹{(p.amount / 100).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textTransform: 'capitalize' }}>{p.billing_period}</td>
                  <td style={{ padding: '10px 14px' }}><Badge variant={p.status === 'success' ? 'success' : 'danger'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 13 }}>
        All payments processed securely via Razorpay · GST invoice issued for all plans · Cancel anytime
      </p>
    </div>
  );
}
