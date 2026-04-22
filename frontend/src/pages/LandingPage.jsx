import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const S = {
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(247,245,240,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--text)', letterSpacing: '-0.5px' },
  logoSpan: { color: 'var(--accent)' },
  navLinks: { display: 'flex', gap: 32, alignItems: 'center' },
  navLink: { fontSize: 14, fontWeight: 500, color: 'var(--muted)', cursor: 'pointer' },
  btnOutline: { padding: '8px 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--text)' },
  btnPrimary: { padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  hero: { paddingTop: 140, paddingBottom: 100, textAlign: 'center', maxWidth: 760, margin: '0 auto', padding: '140px 20px 100px' },
  heroTag: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 100, marginBottom: 24, border: '1px solid #b8d4ec', letterSpacing: '0.5px', textTransform: 'uppercase' },
  h1: { fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 },
  heroSub: { fontSize: 18, color: 'var(--muted)', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  btnLg: { padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600 },
  stats: { display: 'flex', justifyContent: 'center', gap: 48, marginTop: 72, flexWrap: 'wrap' },
  stat: { textAlign: 'center' },
  statNum: { fontSize: 32, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)' },
  statLabel: { fontSize: 13, color: 'var(--muted)', marginTop: 2 },
  section: { padding: '80px 40px', maxWidth: 1120, margin: '0 auto' },
  sectionTag: { fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 },
  sectionTitle: { fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 },
  sectionSub: { color: 'var(--muted)', fontSize: 16, maxWidth: 480, lineHeight: 1.6 },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 48 },
  featCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28 },
  featIcon: { width: 44, height: 44, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 },
  featTitle: { fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 8 },
  featDesc: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 },
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 48 },
  planCard: { background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 32, position: 'relative' },
  planCardPro: { border: '2px solid var(--accent)', background: 'linear-gradient(135deg, #f0f6ff 0%, var(--surface) 100%)' },
  planBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 100, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  planName: { fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif' },
  planPrice: { fontSize: 44, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--accent)', marginTop: 12, lineHeight: 1 },
  planPeriod: { fontSize: 14, color: 'var(--muted)', marginTop: 4 },
  planFeatures: { listStyle: 'none', margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 10 },
  planFeature: { fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start' },
  check: { color: 'var(--accent)', fontWeight: 700, flexShrink: 0 },
  footer: { background: 'var(--text)', color: 'rgba(255,255,255,0.7)', padding: '48px 40px', textAlign: 'center' }
};

const features = [
  { icon: '🏨', title: 'Smart Front Desk', desc: 'Lightning-fast check-ins, guest profiles, and room assignments in seconds.' },
  { icon: '📅', title: 'Booking Calendar', desc: 'Visual calendar with conflict detection. Never double-book again.' },
  { icon: '📊', title: 'Revenue Dashboard', desc: 'Real-time occupancy rates, revenue tracking, and monthly reports.' },
  { icon: '🧾', title: 'GST Invoicing', desc: 'Auto-calculate GST, generate professional invoices, track payments.' },
  { icon: '📦', title: 'Inventory Control', desc: 'Track supplies weekly or monthly. Get alerts before you run out.' },
  { icon: '👥', title: 'Staff & Attendance', desc: 'Manage staff, mark daily attendance, track roles and schedules.' },
  { icon: '🔒', title: 'Role-based Access', desc: 'Admin, Manager, and Staff roles with granular permissions.' },
  { icon: '📱', title: 'Mobile Responsive', desc: 'Works perfectly on any device. Manage your hotel from anywhere.' },
];

export default function LandingPage() {
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState('monthly');

  useEffect(() => {
    api.get('/billing/plans').then(({ data }) => setPlans(data.plans || [])).catch(() => {});
  }, []);

  const fmt = (paise) => '₹' + (paise / 100).toLocaleString('en-IN');

  return (
    <div>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.logo}>Smart<span style={S.logoSpan}>Hotel</span></div>
        <div style={S.navLinks}>
          <a href="#features" style={S.navLink}>Features</a>
          <a href="#pricing" style={S.navLink}>Pricing</a>
          <Link to="/login"><button style={S.btnOutline}>Sign In</button></Link>
          <Link to="/register"><button style={S.btnPrimary}>Start Free Trial</button></Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={S.hero}>
        <div style={S.heroTag}>⚡ 14-Day Free Trial • No Credit Card</div>
        <h1 style={S.h1}>Hotel Management,<br /><span style={{ color: 'var(--accent)' }}>Simplified.</span></h1>
        <p style={S.heroSub}>The all-in-one HMS for independent hotels. Bookings, billing, inventory, and staff — all in one elegant platform.</p>
        <div style={S.heroBtns}>
          <Link to="/register">
            <button style={{ ...S.btnPrimary, ...S.btnLg }}>Start Free Trial →</button>
          </Link>
          <a href="#features">
            <button style={{ ...S.btnOutline, ...S.btnLg }}>See Features</button>
          </a>
        </div>
        <div style={S.stats}>
          {[['500+', 'Hotels Using SmartHotel'], ['₹10Cr+', 'Revenue Managed'], ['99.9%', 'Uptime SLA'], ['14 days', 'Free Trial']].map(([n, l]) => (
            <div key={l} style={S.stat}>
              <div style={S.statNum}>{n}</div>
              <div style={S.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={S.section}>
          <div style={S.sectionTag}>Features</div>
          <h2 style={S.sectionTitle}>Everything your hotel needs</h2>
          <p style={S.sectionSub}>From check-in to checkout, we've got every corner of hotel management covered.</p>
          <div style={S.featGrid}>
            {features.map(f => (
              <div key={f.title} style={S.featCard}>
                <div style={S.featIcon}>{f.icon}</div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ background: 'var(--bg)' }}>
        <div style={{ ...S.section, textAlign: 'center' }}>
          <div style={S.sectionTag}>Pricing</div>
          <h2 style={{ ...S.sectionTitle, maxWidth: 480, margin: '0 auto 12px' }}>Simple, honest pricing</h2>
          <p style={{ ...S.sectionSub, margin: '0 auto 32px' }}>Start with a 14-day free trial. No credit card required.</p>

          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
            <button onClick={() => setBilling('monthly')} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: billing === 'monthly' ? 'var(--accent)' : 'transparent', color: billing === 'monthly' ? '#fff' : 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Monthly</button>
            <button onClick={() => setBilling('yearly')} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: billing === 'yearly' ? 'var(--accent)' : 'transparent', color: billing === 'yearly' ? '#fff' : 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Yearly <span style={{ fontSize: 11, opacity: 0.8 }}>Save 17%</span></button>
          </div>

          <div style={S.pricingGrid}>
            {plans.length === 0 ? (
              // Fallback static pricing
              [
                { name: 'Starter', price_monthly: 99900, price_yearly: 999900, max_rooms: 10, max_staff: 5, features: ['Front Desk', 'Booking Calendar', 'Basic Reports', 'Invoice Generation'], slug: 'starter' },
                { name: 'Professional', price_monthly: 249900, price_yearly: 2499900, max_rooms: 50, max_staff: 20, features: ['Everything in Starter', 'Inventory Management', 'Staff Attendance', 'Advanced Reports', 'Priority Support'], slug: 'professional' },
                { name: 'Enterprise', price_monthly: 499900, price_yearly: 4999900, max_rooms: 999, max_staff: 999, features: ['Everything in Pro', 'Unlimited Rooms & Staff', 'Custom Branding', 'API Access', 'Dedicated Support'], slug: 'enterprise' }
              ].map(plan => renderPlanCard(plan, billing, fmt))
            ) : (
              plans.map(plan => renderPlanCard(plan, billing, fmt))
            )}
          </div>
          <p style={{ marginTop: 24, color: 'var(--muted)', fontSize: 13 }}>All plans include 14-day free trial • Cancel anytime • GST invoice provided</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--accent)', padding: '72px 40px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Ready to modernize your hotel?</h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 32, fontSize: 16 }}>Join hundreds of hotels already running on SmartHotel HMS.</p>
        <Link to="/register">
          <button style={{ background: '#fff', color: 'var(--accent)', border: 'none', padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Start Free Trial — 14 Days Free</button>
        </Link>
      </div>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 8 }}>SmartHotel</div>
        <p style={{ fontSize: 13 }}>© {new Date().getFullYear()} SmartHotel HMS. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, fontSize: 13 }}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}

function renderPlanCard(plan, billing, fmt) {
  const isPro = plan.slug === 'professional';
  const price = billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');

  return (
    <div key={plan.slug} style={isPro ? S.planCardPro : S.planCard}>
      {isPro && <div style={S.planBadge}>Most Popular</div>}
      <div style={S.planName}>{plan.name}</div>
      <div style={S.planPrice}>{fmt(price)}</div>
      <div style={S.planPeriod}>per {billing === 'yearly' ? 'year' : 'month'} • Up to {plan.max_rooms >= 999 ? 'Unlimited' : plan.max_rooms} rooms</div>
      <ul style={S.planFeatures}>
        {features.map(f => (
          <li key={f} style={S.planFeature}>
            <span style={S.check}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/register">
        <button style={{ ...S.btnPrimary, width: '100%', padding: '12px', fontSize: 14, borderRadius: 8, background: isPro ? 'var(--accent)' : 'transparent', color: isPro ? '#fff' : 'var(--accent)', border: isPro ? 'none' : '1.5px solid var(--accent)' }}>
          Start Free Trial
        </button>
      </Link>
    </div>
  );
}
