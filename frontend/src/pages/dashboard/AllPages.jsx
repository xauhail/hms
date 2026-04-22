// ============================================================
// Bookings.jsx
// ============================================================
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Badge, Spinner, Table, Input, Select, Grid, MetricCard } from '../../components/UI';

export function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calData, setCalData] = useState([]);

  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { fetchCalendar(); }, [calYear, calMonth]);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/hms/bookings?limit=100');
      setBookings(data.bookings || []);
    } catch { toast.error('Failed to load bookings'); }
    setLoading(false);
  };

  const fetchCalendar = async () => {
    try {
      const { data } = await api.get(`/hms/bookings/calendar?year=${calYear}&month=${calMonth}`);
      setCalData(data.bookings || []);
    } catch {}
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  const getBookingsForDay = (d) => {
    const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return calData.filter(b => b.checkin_date <= dateStr && b.checkout_date > dateStr);
  };

  const statusBadge = (s) => {
    const map = { confirmed:'info','checked-in':'success','checked-out':'default', cancelled:'danger','no-show':'warning'};
    return <Badge variant={map[s]||'default'}>{s}</Badge>;
  };

  const cols = [
    { key: 'guest', label: 'Guest', render: (_,r) => <div><div style={{fontWeight:600}}>{r.guests?.full_name}</div><div style={{fontSize:12,color:'var(--muted)'}}>{r.guests?.email}</div></div> },
    { key: 'room', label: 'Room', render:(_,r) => `Room ${r.rooms?.room_number}` },
    { key: 'checkin_date', label: 'Check-in' },
    { key: 'checkout_date', label: 'Check-out' },
    { key: 'num_guests', label: 'Guests' },
    { key: 'meal_plan', label: 'Meal' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render:(v)=>statusBadge(v) },
    { key: 'actions', label: '', render:(_,r) => r.status==='confirmed' && (
      <button onClick={async()=>{await api.patch(`/hms/bookings/${r.id}`,{status:'cancelled'});toast.success('Cancelled');fetchBookings();}}
        style={{fontSize:12,padding:'4px 10px',borderRadius:6,border:'1px solid #fca5a5',background:'var(--red-bg)',color:'var(--red)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
    )}
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Bookings & Calendar" />
      <Card style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <button onClick={()=>{let m=calMonth-1;let y=calYear;if(m<1){m=12;y--;}setCalMonth(m);setCalYear(y);}} style={{padding:'6px 14px',border:'1.5px solid var(--border)',borderRadius:7,background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>‹ Prev</button>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16}}>{months[calMonth-1]} {calYear}</span>
          <button onClick={()=>{let m=calMonth+1;let y=calYear;if(m>12){m=1;y++;}setCalMonth(m);setCalYear(y);}} style={{padding:'6px 14px',border:'1.5px solid var(--border)',borderRadius:7,background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>Next ›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:2}}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
            <div key={d} style={{textAlign:'center',fontSize:10,fontWeight:600,color:'var(--muted)',padding:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{d}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{minHeight:52,background:'var(--surface2)',borderRadius:6,opacity:0.3}}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const d=i+1;
            const dateStr=`${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dayBookings=getBookingsForDay(d);
            const isToday=dateStr===today;
            return (
              <div key={d} style={{minHeight:52,background:'var(--surface)',border:`${isToday?'2':'1'}px solid ${isToday?'var(--accent)':'var(--border)'}`,borderRadius:6,padding:'4px 5px'}}>
                <div style={{fontSize:11,fontWeight:isToday?700:400,color:isToday?'var(--accent)':'var(--text)',marginBottom:2}}>{d}</div>
                {dayBookings.slice(0,2).map(b=>(
                  <div key={b.id} style={{background:'var(--accent)',color:'#fff',borderRadius:3,fontSize:9,padding:'1px 4px',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {b.rooms?.room_number}: {b.guests?.full_name?.split(' ')[0]}
                  </div>
                ))}
                {dayBookings.length>2&&<div style={{fontSize:9,color:'var(--accent)'}}>+{dayBookings.length-2}</div>}
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h3 style={{fontSize:15,fontWeight:700,fontFamily:'Syne,sans-serif',marginBottom:16}}>All Bookings</h3>
        <Table columns={cols} data={bookings} emptyText="No bookings yet" />
      </Card>
    </div>
  );
}

// ============================================================
// Rooms.jsx
// ============================================================
export function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({room_number:'',room_type_id:'',floor:1});

  useEffect(()=>{fetchRooms();},[]);
  const fetchRooms = async () => {
    try {
      const [rRes,tRes] = await Promise.all([api.get('/hms/rooms'),api.get('/hms/room-types')]);
      setRooms(rRes.data.rooms||[]); setRoomTypes(tRes.data.room_types||[]);
    } catch { toast.error('Failed to load rooms'); }
    setLoading(false);
  };

  const addRoom = async (e) => {
    e.preventDefault();
    try { await api.post('/hms/rooms',form); toast.success('Room added'); setShowAdd(false); setForm({room_number:'',room_type_id:'',floor:1}); fetchRooms(); }
    catch(err){ toast.error(err.response?.data?.error||'Failed to add room'); }
  };

  const toggleStatus = async (room) => {
    const next = room.status==='maintenance'?'available':'maintenance';
    await api.patch(`/hms/rooms/${room.id}`,{status:next});
    fetchRooms();
  };

  const deleteRoom = async (id) => {
    if(!confirm('Delete this room?'))return;
    await api.delete(`/hms/rooms/${id}`);
    toast.success('Room deleted'); fetchRooms();
  };

  if(loading) return <Spinner />;

  const statusColor = {available:'#f0fdf4',booked:'#fff5f5',maintenance:'#fffbeb'};
  const borderColor = {available:'#86efac',booked:'#fca5a5',maintenance:'#fcd34d'};
  const dotColor = {available:'#22c55e',booked:'#ef4444',maintenance:'#f59e0b'};

  return (
    <div>
      <PageHeader title="Room Management">
        <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Add Room</button>
      </PageHeader>
      {showAdd && (
        <Card style={{marginBottom:16}}>
          <form onSubmit={addRoom} style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
            <div><label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Room Number *</label>
              <input value={form.room_number} onChange={e=>setForm(p=>({...p,room_number:e.target.value}))} placeholder="101" required style={{padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,width:120,outline:'none',fontFamily:'inherit'}}/>
            </div>
            <div><label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Room Type</label>
              <select value={form.room_type_id} onChange={e=>setForm(p=>({...p,room_type_id:e.target.value}))} style={{padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,minWidth:140,outline:'none',fontFamily:'inherit'}}>
                <option value="">Select type</option>
                {roomTypes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Floor</label>
              <input type="number" value={form.floor} onChange={e=>setForm(p=>({...p,floor:e.target.value}))} min="1" style={{padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,width:80,outline:'none',fontFamily:'inherit'}}/>
            </div>
            <button type="submit" style={{padding:'9px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Add Room</button>
            <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'9px 16px',borderRadius:8,border:'1.5px solid var(--border)',background:'transparent',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          </form>
        </Card>
      )}
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        {[{label:'Available',v:'available'},{label:'Occupied',v:'booked'},{label:'Maintenance',v:'maintenance'}].map(s=>(
          <div key={s.v} style={{display:'flex',alignItems:'center',gap:6,fontSize:13}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:dotColor[s.v]}}/>
            {s.label}: <strong>{rooms.filter(r=>r.status===s.v).length}</strong>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:12}}>
        {rooms.map(room=>(
          <div key={room.id} style={{background:statusColor[room.status]||'#f9f9f9',border:`2px solid ${borderColor[room.status]||'var(--border)'}`,borderRadius:12,padding:'14px 12px',textAlign:'center',position:'relative'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:dotColor[room.status],margin:'0 auto 8px'}}/>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20}}>{room.room_number}</div>
            <div style={{fontSize:11,color:'var(--muted)',margin:'2px 0'}}>{room.room_types?.name||'Standard'}</div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:8}}>Floor {room.floor}</div>
            <div style={{display:'flex',gap:4,justifyContent:'center'}}>
              <button onClick={()=>toggleStatus(room)} style={{fontSize:10,padding:'3px 6px',borderRadius:4,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontFamily:'inherit'}}>
                {room.status==='maintenance'?'✓ Fix':'⚠ Maint'}
              </button>
              <button onClick={()=>deleteRoom(room.id)} style={{fontSize:10,padding:'3px 6px',borderRadius:4,border:'1px solid #fca5a5',background:'var(--red-bg)',color:'var(--red)',cursor:'pointer',fontFamily:'inherit'}}>×</button>
            </div>
          </div>
        ))}
        {rooms.length===0 && <div style={{gridColumn:'1/-1',textAlign:'center',padding:48,color:'var(--muted)'}}>No rooms added yet. Click "+ Add Room" above.</div>}
      </div>
    </div>
  );
}

// ============================================================
// Invoices.jsx
// ============================================================
export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({guest_id:'',booking_id:'',room_charges:0,food_charges:0,service_charges:0,other_charges:0,discount:0,payment_mode:'cash',notes:''});

  useEffect(()=>{fetchAll();},[]);
  const fetchAll = async () => {
    try {
      const [iRes,bRes,gRes]=await Promise.all([api.get('/hms/invoices'),api.get('/hms/bookings?limit=100'),api.get('/hms/guests?limit=100')]);
      setInvoices(iRes.data.invoices||[]); setBookings(bRes.data.bookings||[]); setGuests(gRes.data.guests||[]);
    } catch {}
    setLoading(false);
  };

  const h = (e) => setForm(p=>({...p,[e.target.name]:e.target.value}));
  const sub = parseFloat(form.room_charges||0)+parseFloat(form.food_charges||0)+parseFloat(form.service_charges||0)+parseFloat(form.other_charges||0)-parseFloat(form.discount||0);
  const gst = Math.round(sub*0.12);
  const total = sub+gst;

  const createInvoice = async (e) => {
    e.preventDefault();
    if(!form.guest_id){toast.error('Select a guest');return;}
    try {
      await api.post('/hms/invoices',{...form,gst_rate:12});
      toast.success('Invoice created!'); setShowModal(false); fetchAll();
    } catch(err){toast.error(err.response?.data?.error||'Failed');}
  };

  const cols=[
    {key:'invoice_number',label:'Invoice #',render:v=><strong>{v}</strong>},
    {key:'guest',label:'Guest',render:(_,r)=>r.guests?.full_name},
    {key:'subtotal',label:'Subtotal',render:v=>`₹${parseFloat(v).toLocaleString('en-IN')}`},
    {key:'gst_amount',label:'GST',render:v=>`₹${parseFloat(v).toLocaleString('en-IN')}`},
    {key:'total',label:'Total',render:v=><strong>₹{parseFloat(v).toLocaleString('en-IN')}</strong>},
    {key:'payment_mode',label:'Mode',render:v=><Badge>{v}</Badge>},
    {key:'payment_status',label:'Status',render:v=><Badge variant={v==='paid'?'success':'warning'}>{v}</Badge>},
    {key:'created_at',label:'Date',render:v=>new Date(v).toLocaleDateString('en-IN')},
  ];

  if(loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Invoices & Billing">
        <button onClick={()=>setShowModal(true)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Generate Invoice</button>
      </PageHeader>
      <Card><Table columns={cols} data={invoices} emptyText="No invoices yet"/></Card>

      {showModal && (
        <div onClick={()=>setShowModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:16,padding:28,width:'100%',maxWidth:540,maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18}}>Generate Invoice</h3>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'var(--muted)'}}>×</button>
            </div>
            <form onSubmit={createInvoice}>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase'}}>Guest *</label>
                <select name="guest_id" value={form.guest_id} onChange={h} required style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,outline:'none',fontFamily:'inherit'}}>
                  <option value="">Select guest</option>
                  {guests.map(g=><option key={g.id} value={g.id}>{g.full_name} — {g.phone}</option>)}
                </select>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase'}}>Booking (optional)</label>
                <select name="booking_id" value={form.booking_id} onChange={h} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,outline:'none',fontFamily:'inherit'}}>
                  <option value="">No booking</option>
                  {bookings.filter(b=>b.guest_id===form.guest_id||!form.guest_id).map(b=><option key={b.id} value={b.id}>Room {b.rooms?.room_number} · {b.checkin_date} to {b.checkout_date}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                {[['room_charges','Room Charges (₹)'],['food_charges','Food Charges (₹)'],['service_charges','Service Charges (₹)'],['other_charges','Other Charges (₹)'],['discount','Discount (₹)']].map(([n,l])=>(
                  <div key={n}>
                    <label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase'}}>{l}</label>
                    <input name={n} type="number" value={form[n]} onChange={h} min="0" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,outline:'none',fontFamily:'inherit'}}/>
                  </div>
                ))}
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:5,textTransform:'uppercase'}}>Payment Mode</label>
                  <select name="payment_mode" value={form.payment_mode} onChange={h} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13.5,outline:'none',fontFamily:'inherit'}}>
                    <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="online">Online</option>
                  </select>
                </div>
              </div>
              <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:16,marginBottom:16}}>
                {[['Subtotal',`₹${sub.toLocaleString('en-IN')}`],['GST (12%)',`₹${gst.toLocaleString('en-IN')}`]].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13.5,padding:'4px 0',color:'var(--muted)'}}><span>{l}</span><span>{v}</span></div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,padding:'10px 0 0',borderTop:'2px solid var(--text)',marginTop:6}}><span>Total</span><span style={{color:'var(--accent)'}}>₹{total.toLocaleString('en-IN')}</span></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowModal(false)} style={{padding:'9px 18px',borderRadius:8,border:'1.5px solid var(--border)',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
                <button type="submit" style={{padding:'9px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Inventory.jsx
// ============================================================
export function Inventory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('monthly');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({item_name:'',quantity:1,unit:'pcs',rate:0,vendor:'',purchase_date:new Date().toISOString().split('T')[0]});

  useEffect(()=>{fetchInv();},[mode]);
  const fetchInv = async () => {
    try { const {data}=await api.get(`/hms/inventory?mode=${mode}`); setRows(data.purchases||[]); }
    catch {} setLoading(false);
  };
  const h=(e)=>setForm(p=>({...p,[e.target.name]:e.target.value}));
  const addRow=async(e)=>{
    e.preventDefault();
    try{await api.post('/hms/inventory',{...form,mode});toast.success('Item added');setShowAdd(false);setForm({item_name:'',quantity:1,unit:'pcs',rate:0,vendor:'',purchase_date:new Date().toISOString().split('T')[0]});fetchInv();}
    catch(err){toast.error(err.response?.data?.error||'Failed');}
  };
  const del=async(id)=>{await api.delete(`/hms/inventory/${id}`);fetchInv();};
  const total=rows.reduce((a,r)=>a+parseFloat(r.amount||0),0);

  if(loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Inventory Management">
        <div style={{display:'flex',gap:8}}>
          <select value={mode} onChange={e=>setMode(e.target.value)} style={{padding:'7px 12px',border:'1.5px solid var(--border)',borderRadius:7,fontSize:13,outline:'none',fontFamily:'inherit'}}>
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
          <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Add Item</button>
        </div>
      </PageHeader>
      {showAdd&&(
        <Card style={{marginBottom:16}}>
          <form onSubmit={addRow} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12,alignItems:'flex-end'}}>
            {[['item_name','Item Name','text','Tomatoes',true],['quantity','Quantity','number','10'],['unit','Unit','select'],['rate','Rate (₹)','number','50'],['vendor','Vendor','text','Vendor name'],['purchase_date','Date','date']].map(([n,l,t,ph,req])=>(
              <div key={n}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--muted)',display:'block',marginBottom:4,textTransform:'uppercase'}}>{l}</label>
                {t==='select'?(
                  <select name={n} value={form[n]} onChange={h} style={{width:'100%',padding:'9px 10px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit'}}>
                    {['pcs','kg','ltr','box','dozen','pack'].map(u=><option key={u}>{u}</option>)}
                  </select>
                ):(
                  <input name={n} type={t} value={form[n]} onChange={h} placeholder={ph} required={req} style={{width:'100%',padding:'9px 10px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
                )}
              </div>
            ))}
            <div style={{display:'flex',gap:8,gridColumn:'1/-1'}}>
              <button type="submit" style={{padding:'9px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Add</button>
              <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'9px 16px',borderRadius:8,border:'1.5px solid var(--border)',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['#','Item','Qty','Unit','Rate','Amount','Vendor','Date',''].map(h=>(
            <th key={h} style={{fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.8px',padding:'10px 12px',borderBottom:'1px solid var(--border)',textAlign:'left',background:'var(--surface2)'}}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={{padding:'10px 12px',color:'var(--muted)',fontSize:13}}>{i+1}</td>
                <td style={{padding:'10px 12px',fontWeight:500}}>{r.item_name}</td>
                <td style={{padding:'10px 12px'}}>{r.quantity}</td>
                <td style={{padding:'10px 12px',color:'var(--muted)'}}>{r.unit}</td>
                <td style={{padding:'10px 12px'}}>₹{r.rate}</td>
                <td style={{padding:'10px 12px',fontWeight:600}}>₹{parseFloat(r.amount).toLocaleString('en-IN')}</td>
                <td style={{padding:'10px 12px',color:'var(--muted)',fontSize:13}}>{r.vendor||'—'}</td>
                <td style={{padding:'10px 12px',fontSize:13}}>{r.purchase_date}</td>
                <td style={{padding:'10px 12px'}}><button onClick={()=>del(r.id)} style={{fontSize:12,padding:'3px 8px',borderRadius:5,border:'1px solid #fca5a5',background:'var(--red-bg)',color:'var(--red)',cursor:'pointer',fontFamily:'inherit'}}>×</button></td>
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>No inventory items yet</td></tr>}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:16,paddingTop:16,borderTop:'1px solid var(--border)'}}>
          <div style={{textAlign:'right'}}><div style={{fontSize:12,color:'var(--muted)',marginBottom:3}}>Total ({mode})</div><div style={{fontSize:24,fontWeight:800,fontFamily:'Syne,sans-serif'}}>₹{total.toLocaleString('en-IN')}</div></div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Staff.jsx
// ============================================================
export function Staff() {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({full_name:'',phone:'',role:'front-desk',id_number:'',salary:'',join_date:''});
  const [editForm, setEditForm] = useState(null);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(()=>{fetchStaff();fetchAttendance();},[]);
  useEffect(()=>{fetchAttendance();},[attDate]);

  const fetchStaff=async()=>{try{const {data}=await api.get('/hms/staff');setStaff(data.staff||[]);}catch{}setLoading(false);};
  const fetchAttendance=async()=>{try{const {data}=await api.get(`/hms/attendance?date=${attDate}`);setAttendance(data.attendance||[]);}catch{}};

  const h=(e)=>setForm(p=>({...p,[e.target.name]:e.target.value}));
  const addStaff=async(e)=>{
    e.preventDefault();
    try{await api.post('/hms/staff',form);toast.success('Staff added');setShowAdd(false);setForm({full_name:'',phone:'',role:'front-desk',id_number:'',salary:'',join_date:''});fetchStaff();fetchAttendance();}
    catch(err){toast.error(err.response?.data?.error||'Failed');}
  };

  const updateStaff=async(id)=>{
    try{await api.patch(`/hms/staff/${id}`,editForm);toast.success('Staff updated');setEditForm(null);fetchStaff();fetchAttendance();}
    catch(err){toast.error(err.response?.data?.error||'Update failed');}
  };

  const deleteStaff=async(id)=>{
    if(!window.confirm('Remove this staff member? This will also delete their attendance records.'))return;
    try{await api.delete(`/hms/staff/${id}`);toast.success('Staff removed');fetchStaff();fetchAttendance();}
    catch(err){toast.error(err.response?.data?.error||'Failed');}
  };

  const markAtt=async(staffId,status='present')=>{
    try{await api.post('/hms/attendance',{staff_id:staffId,status,date:attDate});toast.success('Attendance updated');fetchAttendance();}
    catch{toast.error('Attendance failed');}
  };

  const isPresent=(staffId)=>attendance.some(a=>a.staff_id===staffId&&a.status==='present');
  const isAbsent=(staffId)=>attendance.some(a=>a.staff_id===staffId&&a.status==='absent');
  const getCheckIn=(staffId)=>{const a=attendance.find(a=>a.staff_id===staffId);return a?.check_in?new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—';};

  const presentCount=staff.filter(s=>isPresent(s.id)).length;
  const absentCount=staff.filter(s=>isAbsent(s.id)).length;
  const attRate=staff.length?Math.round((presentCount/staff.length)*100):0;

  const thStyle={fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.8px',padding:'10px 14px',borderBottom:'1px solid var(--border)',textAlign:'left',background:'var(--surface2)'};
  const btnPrimary={padding:'8px 18px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};
  const btnGhost={padding:'6px 12px',borderRadius:7,border:'1.5px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};
  const btnDanger={padding:'6px 12px',borderRadius:7,border:'none',background:'var(--red)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};
  const btnSuccess={padding:'6px 12px',borderRadius:7,border:'none',background:'var(--green)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};
  const inputBase={width:'100%',padding:'8px 10px',border:'1.5px solid var(--border)',borderRadius:7,fontSize:13,outline:'none',fontFamily:'inherit',background:'var(--surface)',color:'var(--text)'};

  if(loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Staff Management">
        <button onClick={()=>setShowAdd(!showAdd)} style={btnPrimary}>+ Add Staff</button>
      </PageHeader>

      <Grid cols={4} gap={14} style={{marginBottom:20}}>
        <MetricCard label="Total Staff" value={staff.length} icon="👥" />
        <MetricCard label="Present" value={presentCount} color="var(--green)" icon="✅" />
        <MetricCard label="Absent" value={absentCount} color="var(--red)" icon="❌" />
        <MetricCard label="Attendance Rate" value={`${attRate}%`} color="var(--accent)" icon="📊" />
      </Grid>

      {showAdd&&(
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,fontFamily:'Syne,sans-serif',marginBottom:16}}>Add New Staff</h3>
          <form onSubmit={addStaff} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,alignItems:'flex-end'}}>
            <Input label="Full Name" name="full_name" value={form.full_name} onChange={h} placeholder="Name" required />
            <Input label="Phone" name="phone" value={form.phone} onChange={h} placeholder="9876543210" />
            <Input label="Aadhaar No" name="id_number" value={form.id_number} onChange={h} placeholder="XXXX XXXX XXXX" />
            <Input label="Salary (₹)" name="salary" type="number" value={form.salary} onChange={h} placeholder="15000" />
            <Input label="Join Date" name="join_date" type="date" value={form.join_date} onChange={h} />
            <Select label="Role" name="role" value={form.role} onChange={h}>
              {['front-desk','housekeeping','f&b','security','manager','maintenance'].map(r=><option key={r} value={r}>{r}</option>)}
            </Select>
            <div style={{display:'flex',gap:8,paddingBottom:14}}>
              <button type="submit" style={btnPrimary}>Add</button>
              <button type="button" onClick={()=>setShowAdd(false)} style={{...btnGhost,padding:'8px 14px'}}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{marginBottom:16, marginTop:16}}>
        <h3 style={{fontSize:15,fontWeight:700,fontFamily:'Syne,sans-serif',marginBottom:16}}>Staff List</h3>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Staff Member','Role','Aadhaar','Salary','Join Date','Actions'].map(h=>(<th key={h} style={thStyle}>{h}</th>))}</tr></thead>
          <tbody>
            {staff.map(s=>{
              if(editForm?.id===s.id) return (
                <tr key={s.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td colSpan={6} style={{padding:'10px 14px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10,alignItems:'flex-end'}}>
                      <input value={editForm.full_name} onChange={e=>setEditForm(p=>({...p,full_name:e.target.value}))} placeholder="Name" style={inputBase} />
                      <input value={editForm.phone} onChange={e=>setEditForm(p=>({...p,phone:e.target.value}))} placeholder="Phone" style={inputBase} />
                      <input value={editForm.id_number} onChange={e=>setEditForm(p=>({...p,id_number:e.target.value}))} placeholder="Aadhaar" style={inputBase} />
                      <input value={editForm.salary} onChange={e=>setEditForm(p=>({...p,salary:e.target.value}))} placeholder="Salary" type="number" style={inputBase} />
                      <input value={editForm.join_date?.split('T')[0]||''} onChange={e=>setEditForm(p=>({...p,join_date:e.target.value}))} type="date" style={inputBase} />
                      <select value={editForm.role} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))} style={inputBase}>
                        {['front-desk','housekeeping','f&b','security','manager','maintenance'].map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                      <div style={{display:'flex',gap:8,paddingBottom:2}}>
                        <button onClick={()=>updateStaff(s.id)} style={btnSuccess}>Save</button>
                        <button onClick={()=>setEditForm(null)} style={btnGhost}>Cancel</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
              return (
                <tr key={s.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'11px 14px'}}><div style={{fontWeight:600}}>{s.full_name}</div><div style={{fontSize:12,color:'var(--muted)'}}>{s.phone}</div></td>
                  <td style={{padding:'11px 14px'}}><Badge>{s.role}</Badge></td>
                  <td style={{padding:'11px 14px',fontSize:13,color:'var(--muted)'}}>{s.id_number||'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:13}}>{s.salary?`₹${parseInt(s.salary).toLocaleString('en-IN')}`:'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:13,color:'var(--muted)'}}>{s.join_date?new Date(s.join_date).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>setEditForm({...s,join_date:s.join_date?.split('T')[0]||''})} style={btnGhost}>Edit</button>
                      <button onClick={()=>deleteStaff(s.id)} style={btnDanger}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {staff.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>No staff added yet</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,fontFamily:'Syne,sans-serif'}}>Daily Attendance — {new Date(attDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</h3>
          <input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} style={{padding:'8px 12px',border:'1.5px solid var(--border)',borderRadius:8,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--text)'}} />
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Staff Member','Role','Status','Check-in Time','Action'].map(h=>(<th key={h} style={thStyle}>{h}</th>))}</tr></thead>
          <tbody>
            {staff.map(s=>{
              const present=isPresent(s.id);
              const absent=isAbsent(s.id);
              return (
                <tr key={s.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'11px 14px'}}><div style={{fontWeight:600}}>{s.full_name}</div><div style={{fontSize:12,color:'var(--muted)'}}>{s.phone}</div></td>
                  <td style={{padding:'11px 14px'}}><Badge>{s.role}</Badge></td>
                  <td style={{padding:'11px 14px'}}>
                    {present ? <Badge variant="success">Present</Badge> : absent ? <Badge variant="danger">Absent</Badge> : <Badge>Not Marked</Badge>}
                  </td>
                  <td style={{padding:'11px 14px',fontSize:13}}>{getCheckIn(s.id)}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:8}}>
                      {!present&&<button onClick={()=>markAtt(s.id,'present')} style={btnSuccess}>Present</button>}
                      {!absent&&<button onClick={()=>markAtt(s.id,'absent')} style={btnDanger}>Absent</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {staff.length===0&&<tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>No staff added yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// Settings.jsx
// ============================================================
export function Settings() {
  const { org, setOrg } = useAuth?.()??{};
  const [form, setForm] = useState({ name: '', settings: { currency: '₹', checkin_time: '12:00', checkout_time: '11:00', gst_rate: 12, timezone: 'Asia/Kolkata' } });
  const [roomTypes, setRoomTypes] = useState([]);
  const [newType, setNewType] = useState({ name: '', base_rate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState({ name: '', base_rate: '' });

  const fetchRoomTypes = async () => {
    try {
      const { data } = await api.get('/hms/room-types');
      setRoomTypes(data.room_types || []);
    } catch (err) { toast.error('Failed to load room types'); }
  };

  useEffect(() => {
    Promise.all([api.get('/hms/settings'), api.get('/hms/room-types')])
      .then(([{ data: s }, { data: t }]) => {
        setForm({ name: s.settings?.name || '', settings: { ...form.settings, ...s.settings?.settings } });
        setRoomTypes(t.room_types || []);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/hms/settings', form); toast.success('Settings saved!'); } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const addType = async () => {
    if (!newType.name) return;
    try {
      await api.post('/hms/room-types', { name: newType.name, base_rate: parseFloat(newType.base_rate) || 0 });
      toast.success('Room type added');
      setNewType({ name: '', base_rate: '' });
      await fetchRoomTypes();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditType({ name: t.name, base_rate: String(t.base_rate) });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditType({ name: '', base_rate: '' });
  };

  const updateType = async (id) => {
    try {
      await api.patch(`/hms/room-types/${id}`, { name: editType.name, base_rate: parseFloat(editType.base_rate) || 0 });
      toast.success('Room type updated');
      setEditingId(null);
      await fetchRoomTypes();
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
  };

  const deleteType = async (id) => {
    if (!window.confirm('Delete this room type? Rooms using it will have their type set to none.')) return;
    try {
      await api.delete(`/hms/room-types/${id}`);
      toast.success('Room type deleted');
      await fetchRoomTypes();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const h = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const hs = (e) => setForm(p => ({ ...p, settings: { ...p.settings, [e.target.name]: e.target.value } }));

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Settings" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne,sans-serif', marginBottom: 20 }}>Property Settings</h3>
          <form onSubmit={save}>
            <Input label="Property Name" name="name" value={form.name} onChange={h} placeholder="Grand Palace Hotel" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Check-in Time" name="checkin_time" type="time" value={form.settings.checkin_time} onChange={hs} />
              <Input label="Check-out Time" name="checkout_time" type="time" value={form.settings.checkout_time} onChange={hs} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Currency" name="currency" value={form.settings.currency} onChange={hs}>
                <option value="₹">₹ INR</option><option value="$">$ USD</option><option value="€">€ EUR</option>
              </Select>
              <Input label="GST Rate (%)" name="gst_rate" type="number" value={form.settings.gst_rate} onChange={hs} />
            </div>
            <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </Card>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne,sans-serif', marginBottom: 16 }}>Room Types</h3>
          {roomTypes.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>No room types yet.</div>
          )}
          {roomTypes.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              {editingId === t.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                  <input value={editType.name} onChange={e => setEditType(p => ({ ...p, name: e.target.value }))} placeholder="Type name" style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <input value={editType.base_rate} onChange={e => setEditType(p => ({ ...p, base_rate: e.target.value }))} placeholder="Rate ₹" type="number" style={{ width: 80, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={() => updateType(t.id)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                  <button onClick={cancelEdit} style={{ padding: '6px 12px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              ) : (
                <>
                  <div><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Base rate: ₹{t.base_rate}/night</div></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(t)} style={{ padding: '6px 12px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => deleteType(t.id)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input value={newType.name} onChange={e => setNewType(p => ({ ...p, name: e.target.value }))} placeholder="Type name" style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <input value={newType.base_rate} onChange={e => setNewType(p => ({ ...p, base_rate: e.target.value }))} placeholder="Rate ₹" type="number" style={{ width: 80, padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={addType} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

