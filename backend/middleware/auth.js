const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../services/supabase');

// Separate auth client so getUser() never taints the shared DB client
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify Supabase JWT (isolated client so shared DB client isn't tainted)
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile with org
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    req.user = { ...user, profile };
    req.orgId = profile.org_id;
    req.org = profile.organizations;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user?.profile?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const requireActiveSubscription = (req, res, next) => {
  const org = req.org;
  if (!org) return res.status(403).json({ error: 'No organization found' });

  const now = new Date();
  const isTrial = org.subscription_status === 'trial' && new Date(org.trial_ends_at) > now;
  const isActive = org.subscription_status === 'active' && new Date(org.subscription_ends_at) > now;

  if (!isTrial && !isActive) {
    return res.status(402).json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_EXPIRED',
      message: 'Your trial or subscription has expired. Please upgrade to continue.'
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireActiveSubscription };
