# Security Policy

## Security Fixes Implemented

### 1. Exposed Secrets (CRITICAL - Fixed)
- **Issue**: Supabase Service Role JWT exposed in GitHub commits
- **Fix**: 
  - Added `.env` to `.gitignore`
  - Removed `.env` from git history
  - Created `.env.example` with placeholder values
  - **ACTION REQUIRED**: Rotate your Supabase service role key immediately!

### 2. OWASP Top 10 Protection

#### A01: Broken Access Control
- ✅ JWT-based authentication with middleware
- ✅ Role-based access control (`requireAdmin`)
- ✅ Organization isolation via `org_id` checks
- ✅ Rate limiting on auth endpoints

#### A02: Cryptographic Failures
- ✅ JWT tokens for session management
- ✅ Service role key for backend database access
- ✅ HTTPS enforcement via HSTS headers
- ✅ **ACTION REQUIRED**: Use strong JWT_SECRET in production

#### A03: Injection
- ✅ Supabase parameterized queries (prevents SQL injection)
- ✅ `express-mongo-sanitize` for NoSQL injection protection
- ✅ `xss-clean` for XSS protection
- ✅ `hpp` for HTTP Parameter Pollution prevention

#### A04: Insecure Design
- ✅ Rate limiting on all endpoints
- ✅ Input validation on all user inputs
- ✅ Secure CORS configuration
- ✅ Request body size limits (10kb)

#### A05: Security Misconfiguration
- ✅ `helmet()` for security headers
- ✅ Error handling that doesn't expose stack traces
- ✅ Disabled `x-powered-by` header
- ✅ Content Security Policy headers

#### A06: Vulnerable Components
- ✅ Regular dependency updates required
- ✅ npm audit recommended before deployment

#### A07: Authentication Failures
- ✅ Secure session management via JWT
- ✅ Password length requirements (min 8 chars)
- ✅ Rate limiting on login attempts
- ✅ Secure password reset flow

#### A08: Data Integrity Failures
- ✅ RLS policies in Supabase
- ✅ Input validation before database operations

#### A09: Security Logging Failures
- ✅ Error logging in middleware
- ✅ Request tracking via rate limiting

#### A10: Server-Side Request Forgery
- ✅ URL validation on external requests
- ✅ CORS origin whitelist

## Immediate Actions Required

### 1. Rotate Exposed Secrets (URGENT)
1. Go to https://app.supabase.com
2. Select your project
3. Go to Project Settings → API
4. Click "Reveal" next to Service Role Key
5. Click "Generate new secret" or contact Supabase support
6. Update your `.env` file with the new key
7. Never commit `.env` to git

### 2. Generate Strong Secrets
Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Environment Variables
Copy `.env.example` to `.env` and fill in real values:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual secrets
```

## Security Checklist

- [ ] Rotate Supabase Service Role Key
- [ ] Generate strong JWT_SECRET
- [ ] Configure Razorpay test keys
- [ ] Set correct FRONTEND_URL for CORS
- [ ] Enable RLS policies in Supabase
- [ ] Review Supabase RLS policies
- [ ] Enable 2FA on Supabase account
- [ ] Enable 2FA on GitHub account
- [ ] Run `npm audit` regularly
- [ ] Keep dependencies updated

## Reporting Security Issues

If you discover a security vulnerability, please:
1. DO NOT create a public issue
2. Email security@yourdomain.com (replace with actual)
3. Allow 48 hours for response before public disclosure

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Supabase Security](https://supabase.com/docs/guides/security)
