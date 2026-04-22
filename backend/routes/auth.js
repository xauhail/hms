const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, hotel_name } = req.body;

    if (!email || !password || !full_name || !hotel_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

    // Get starter plan
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', 'starter')
      .single();

    // Create organization
    const { data: org, error: orgError } = await supabase
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
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // Create user profile
    await supabase.from('user_profiles').insert({
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get profile
    const { data: profile } = await supabase
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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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

    const { error } = await supabase.auth.updateUser({ password: new_password });
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

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
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
  await supabase.auth.signOut();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
