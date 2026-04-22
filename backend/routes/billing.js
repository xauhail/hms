const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../services/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// GET /api/billing/plans
router.get('/plans', async (req, res) => {
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/billing/create-order
// Creates a Razorpay order for plan purchase
router.post('/create-order', authenticate, requireAdmin, async (req, res) => {
  try {
    const { plan_id, billing_period } = req.body; // billing_period: 'monthly' | 'yearly'

    if (!plan_id || !billing_period) {
      return res.status(400).json({ error: 'plan_id and billing_period are required' });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const amount = billing_period === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount, // in paise
      currency: 'INR',
      receipt: `sub_${req.orgId}_${Date.now()}`,
      notes: {
        org_id: req.orgId,
        plan_id,
        billing_period,
        plan_name: plan.name
      }
    });

    // Store pending payment
    await supabase.from('subscription_payments').insert({
      org_id: req.orgId,
      plan_id,
      razorpay_order_id: order.id,
      amount,
      billing_period,
      status: 'pending'
    });

    res.json({
      order_id: order.id,
      amount,
      currency: 'INR',
      plan_name: plan.name,
      razorpay_key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/billing/verify-payment
// Verifies Razorpay signature and activates subscription
router.post('/verify-payment', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
      billing_period
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: Invalid signature' });
    }

    // Get plan
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    // Calculate subscription end date
    const now = new Date();
    const endsAt = new Date(now);
    if (billing_period === 'yearly') {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }

    // Update organization subscription
    await supabase.from('organizations').update({
      plan_id,
      subscription_status: 'active',
      subscription_ends_at: endsAt.toISOString()
    }).eq('id', req.orgId);

    // Update payment record
    await supabase.from('subscription_payments').update({
      razorpay_payment_id,
      razorpay_signature,
      status: 'success'
    }).eq('razorpay_order_id', razorpay_order_id);

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name} plan!`,
      subscription_ends_at: endsAt.toISOString()
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// GET /api/billing/subscription
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('*, plans(*)')
      .eq('id', req.orgId)
      .single();

    const { data: payments } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('org_id', req.orgId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({ subscription: org, payment_history: payments });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/billing/cancel
router.post('/cancel', authenticate, requireAdmin, async (req, res) => {
  await supabase.from('organizations').update({
    subscription_status: 'cancelled'
  }).eq('id', req.orgId);

  res.json({ message: 'Subscription cancelled. Access continues until period end.' });
});

module.exports = router;
