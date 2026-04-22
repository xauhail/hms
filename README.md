# 🏨 SmartHotel HMS — Full-Stack SaaS

**Hotel Management System SaaS** built with React + Node.js + Supabase + Razorpay

---

## 📁 Project Structure

```
smarthotel-saas/
├── backend/                  # Node.js Express API
│   ├── middleware/auth.js     # JWT auth + subscription checks
│   ├── routes/
│   │   ├── auth.js            # Register, Login, Forgot Password
│   │   ├── billing.js         # Razorpay + subscription management
│   │   └── hms.js             # All HMS features (rooms, bookings, etc.)
│   ├── services/supabase.js   # Supabase client
│   ├── server.js              # Express entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/api.js          # Axios client with auto-refresh
│   │   ├── components/UI.jsx   # Reusable components
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx  # Public marketing page
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── dashboard/
│   │   │       ├── DashboardHome.jsx
│   │   │       ├── FrontDesk.jsx
│   │   │       ├── Bookings.jsx
│   │   │       ├── Rooms.jsx
│   │   │       ├── Invoices.jsx
│   │   │       ├── Inventory.jsx
│   │   │       ├── Staff.jsx
│   │   │       ├── Billing.jsx   # Razorpay payment UI
│   │   │       └── Settings.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── supabase/
    └── schema.sql             # Complete DB schema with RLS
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → Paste the entire contents of `supabase/schema.sql` → Run
3. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(keep this secret!)*

4. Go to **Authentication → Settings**:
   - Set **Site URL** to your frontend URL (e.g., `http://localhost:5173`)
   - Add `http://localhost:5173/reset-password` to Redirect URLs

---

### Step 2 — Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** → Generate test keys
3. Copy `Key ID` → `RAZORPAY_KEY_ID`
4. Copy `Key Secret` → `RAZORPAY_KEY_SECRET`

> For production: Complete Razorpay KYC and switch to live keys

---

### Step 3 — Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
# API runs on http://localhost:5000
```

**Backend `.env` file:**
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

JWT_SECRET=your-random-secret-min-32-chars

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

FRONTEND_URL=http://localhost:5173
```

---

### Step 4 — Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in values
npm install
npm run dev
# App runs on http://localhost:5173
```

**Frontend `.env` file:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

---

### Step 5 — Test the Flow

1. Open `http://localhost:5173`
2. Click **Start Free Trial**
3. Register with hotel name, email, password
4. Log in → You're on the dashboard with **14-day trial**
5. Add rooms in **Settings** → then **Room Management**
6. Create a booking in **Front Desk**
7. Generate an invoice in **Invoices**
8. Test Razorpay upgrade in **Billing & Plans**

---

## 🔐 Authentication Flow

```
Register → Supabase Auth User created
         → Organization row created
         → UserProfile created
         → 14-day trial started

Login → Supabase returns JWT access_token + refresh_token
      → Stored in localStorage
      → Auto-refresh on 401

Forgot Password → Supabase sends email with reset link
               → User clicks link → /reset-password page

Protected Routes → authenticate middleware validates JWT
                → requireActiveSubscription checks trial/plan status
                → Returns 402 if expired
```

---

## 💳 Razorpay Payment Flow

```
User clicks "Upgrade" on Billing page
  → POST /api/billing/create-order
  → Razorpay order created (amount in paise)
  → Razorpay checkout modal opens
  → User pays
  → Razorpay calls handler with payment ID + signature
  → POST /api/billing/verify-payment
  → Signature verified with HMAC SHA256
  → Organization subscription_status = 'active'
  → subscription_ends_at set to +1 month or +1 year
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `plans` | Subscription plans (Starter/Pro/Enterprise) |
| `organizations` | Hotels using the SaaS |
| `user_profiles` | User data linked to org |
| `room_types` | Room categories per hotel |
| `rooms` | Individual rooms |
| `guests` | Guest records |
| `bookings` | Reservation records |
| `invoices` | Billing records |
| `inventory_purchases` | Inventory tracking |
| `staff_members` | Hotel staff |
| `attendance` | Daily attendance log |
| `subscription_payments` | Payment history |

---

## 🧩 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account + org |
| POST | `/api/auth/login` | Get JWT tokens |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh JWT |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/plans` | List all plans |
| POST | `/api/billing/create-order` | Create Razorpay order |
| POST | `/api/billing/verify-payment` | Verify + activate |
| GET | `/api/billing/subscription` | Current subscription |
| POST | `/api/billing/cancel` | Cancel subscription |

### HMS (all require auth + active subscription)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hms/dashboard` | Dashboard stats |
| GET/POST | `/api/hms/rooms` | Room management |
| GET | `/api/hms/rooms/availability` | Available rooms by date |
| GET/POST | `/api/hms/guests` | Guest management |
| GET/POST | `/api/hms/bookings` | Booking management |
| GET | `/api/hms/bookings/calendar` | Calendar view data |
| GET/POST | `/api/hms/invoices` | Invoice management |
| GET/POST | `/api/hms/inventory` | Inventory tracking |
| GET/POST | `/api/hms/staff` | Staff management |
| GET/POST | `/api/hms/attendance` | Attendance marking |
| GET/PATCH | `/api/hms/settings` | Property settings |

---

## 🚢 Production Deployment

### Backend (Railway / Render / EC2)
```bash
# Set all env vars in your hosting platform
npm start
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the dist/ folder
# Set VITE_API_URL to your backend URL
```

### Environment Checklist for Production
- [ ] `NODE_ENV=production`
- [ ] Use live Razorpay keys (not test)
- [ ] Set `FRONTEND_URL` to actual domain
- [ ] Enable Supabase email confirmation
- [ ] Configure custom SMTP in Supabase for emails
- [ ] Set secure `JWT_SECRET` (32+ random chars)

---

## 🔑 User Roles

| Role | Dashboard | Bookings | Invoices | Staff | Settings | Billing |
|------|-----------|----------|----------|-------|----------|---------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Staff | ✅ | View | ❌ | View | ❌ | ❌ |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Pure CSS-in-JS (no framework) |
| Charts | Recharts |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Payments | Razorpay |
| HTTP Client | Axios (with interceptors) |

---

## 🆘 Common Issues

**"Invalid token" on login**
→ Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in backend `.env`

**Razorpay modal doesn't open**
→ Check `VITE_RAZORPAY_KEY_ID` in frontend `.env`
→ Ensure `checkout.razorpay.com` script is loaded in `index.html`

**Payment verification fails**
→ Verify `RAZORPAY_KEY_SECRET` matches the key pair

**CORS errors**
→ Set `FRONTEND_URL` in backend `.env` to exact frontend URL

**"Subscription required" 402 error**
→ Trial expired. Upgrade via Billing page or extend trial in Supabase directly

---

*Built for production. Scale confidently.*
