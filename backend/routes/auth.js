const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../services/supabaseAdmin');
const { authenticate } = require('../middleware/auth');
const { register, login } = require('../middleware/validate');

// Separate auth client for auth operations (never used for DB)
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/auth/register
router.post('/register', register, async (req, res) => {
  try {
    const { email, password, full_name, hotel_name } = req.body;

    // Create Supabase auth user (using isolated auth client)
    const { data: authData, error: authError } = await authClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm for MVP; set false to require email verification
      user_metadata: { full_name }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Create organization slug
    const slug = hotel_name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6);

    // Get starter plan (using admin client for DB)
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', 'starter')
      .single();

    // Create organization (using admin client for DB)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: hotel_name,
        slug,
        owner_id: userId,
        plan_id: plan?.id,
        subscription_status: 'trial'
      })
      .select()
      .single();

    if (orgError) {
      await authClient.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // Create user profile (using admin client for DB)
    await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      org_id: org.id,
      full_name,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: userId, email, full_name },
      org: { id: org.id, name: hotel_name, slug }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', login, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use isolated auth client for sign in
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get profile using admin client (bypasses RLS)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*, organizations(*)')
      .eq('id', data.user.id)
      .single();

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name,
        role: profile?.role
      },
      org: profile?.organizations
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { new_password, access_token } = req.body;
    if (!new_password || !access_token) {
      return res.status(400).json({ error: 'New password and token are required' });
    }

    const { error } = await authClient.auth.updateUser({ password: new_password });
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const { data, error } = await authClient.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Invalid refresh token' });

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.profile.full_name,
      role: req.user.profile.role
    },
    org: req.org
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await authClient.auth.signOut();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
