// Shared reusable components

export function PageHeader({ title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px' }}>{title}</h1>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div>
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function MetricCard({ label, value, sub, color = 'var(--text)', icon }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 24, opacity: 0.6 }}>{icon}</div>}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button' }) {
  const styles = {
    primary: { background: 'var(--accent)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--border)' },
    danger: { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid #fecaca' },
    success: { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid #bbf7d0' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 13 },
    lg: { padding: '12px 24px', fontSize: 15 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], ...sizes[size], borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, name, type = 'text', placeholder, required, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13.5, color: 'var(--text)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

export function Select({ label, value, onChange, name, children, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
      <select name={name} value={value} onChange={onChange}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13.5, color: 'var(--text)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit' }}>
        {children}
      </select>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { background: '#f3f4f6', color: '#374151' },
    success: { background: 'var(--green-bg)', color: 'var(--green)' },
    danger: { background: 'var(--red-bg)', color: 'var(--red)' },
    warning: { background: 'var(--amber-bg)', color: 'var(--amber)' },
    info: { background: 'var(--accent-light)', color: 'var(--accent)' },
  };
  return (
    <span style={{ ...styles[variant], fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: width, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ columns, data, emptyText = 'No data found' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '10px 14px', borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--surface2)', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 14 }}>{emptyText}</td></tr>
          ) : data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '11px 14px', fontSize: 13.5, color: 'var(--text)', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Grid({ cols = 4, gap = 14, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

export function FormRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}
