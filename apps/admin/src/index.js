import express from 'express';
import crypto from 'crypto';
import { moduleRegistry } from '@gst-platform/registry-engine/modules';
import { sourceRegistry } from '@gst-platform/registry-engine/sources';
import { providerRegistry } from '@gst-platform/registry-engine/providers';
import { workflowOrchestrator } from '@gst-platform/workflow-engine';
import { customerService } from '@gst-platform/billing-engine/customers';
import { apiKeyAuth } from '@gst-platform/billing-engine/auth';
import { usageTracker } from '@gst-platform/billing-engine/usage';
import { promoEngine } from '@gst-platform/billing-engine/promo';
import { db } from '@gst-platform/core/db';

const app = express();
app.use(express.json());

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@gst2024';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Session store (in-memory, sufficient for single-instance admin)
const sessions = new Map();

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { created: Date.now() });
  return token;
}

function validSession(token) {
  const s = sessions.get(token);
  if (!s) return false;
  // 8 hour expiry
  if (Date.now() - s.created > 8 * 60 * 60 * 1000) { sessions.delete(token); return false; }
  return true;
}

// Login endpoint (no auth required)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const token = createSession();
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Serve login page without auth
app.get('/login.html', (req, res, next) => { next(); });

// Auth middleware for all /api/* (except login)
app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next();
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !validSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.use(express.static('public'));

// Modules management
app.get('/api/modules', async (req, res) => {
  try {
    const modules = await moduleRegistry.list();
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/modules/:code/enable', async (req, res) => {
  try {
    await moduleRegistry.enable(req.params.code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/modules/:code/disable', async (req, res) => {
  try {
    await moduleRegistry.disable(req.params.code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/modules/:code/config', async (req, res) => {
  try {
    await moduleRegistry.updateConfig(req.params.code, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sources management
app.get('/api/sources', async (req, res) => {
  try {
    const sources = await sourceRegistry.list();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sources', async (req, res) => {
  try {
    const { code, name, url, type, configuration, priority } = req.body;
    const source = await sourceRegistry.register(code, name, url, type, configuration, priority);
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sources/:code/enable', async (req, res) => {
  try {
    await sourceRegistry.enable(req.params.code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sources/:code/disable', async (req, res) => {
  try {
    await sourceRegistry.disable(req.params.code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Providers management
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await providerRegistry.list();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/providers', async (req, res) => {
  try {
    const { code, name, type, configuration } = req.body;
    const provider = await providerRegistry.register(code, name, type, configuration);
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/providers/:code/enable', async (req, res) => {
  try {
    await providerRegistry.enable(req.params.code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/providers/:code/disable', async (req, res) => {
  try {
    await providerRegistry.disable(req.params.code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workflow triggers
app.post('/api/workflow/run', async (req, res) => {
  try {
    const results = await workflowOrchestrator.executeFullWorkflow();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflow/schedule', async (req, res) => {
  try {
    const { jobType, jobData, scheduledAt } = req.body;
    const job = await workflowOrchestrator.scheduleJob(jobType, jobData, scheduledAt);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer management
app.get('/api/customers', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const customers = await customerService.list(
      parseInt(limit) || 50,
      parseInt(offset) || 0
    );
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { email, company_name, contact_person, phone, address } = req.body;
    const customer = await customerService.create(
      email,
      company_name,
      contact_person,
      phone,
      address
    );
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/:id/suspend', async (req, res) => {
  try {
    await customerService.suspend(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/:id/activate', async (req, res) => {
  try {
    await customerService.activate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Key management
app.get('/api/customers/:id/keys', async (req, res) => {
  try {
    const keys = await db.query(
      'SELECT id, key_prefix, name, plan_id, status, created_at, last_used_at FROM billing.api_keys WHERE customer_id = $1',
      [req.params.id]
    );
    res.json(keys.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/:id/keys', async (req, res) => {
  try {
    const { name, plan_id, expires_in_days } = req.body;
    const keyData = await apiKeyAuth.createKey(
      req.params.id,
      name,
      plan_id,
      expires_in_days
    );
    res.json(keyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/keys/:id', async (req, res) => {
  try {
    await apiKeyAuth.revokeKey(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Usage stats
app.get('/api/customers/:id/usage', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const usage = await usageTracker.getUsage(
      req.params.id,
      start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end_date || new Date()
    );
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id/usage/current', async (req, res) => {
  try {
    const usage = await usageTracker.getCurrentMonthUsage(req.params.id);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plans
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await customerService.getPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plans', async (req, res) => {
  try {
    const { code, name, description, base_price, billing_cycle, limits, features } = req.body;
    const result = await db.query(
      `INSERT INTO billing.plans (code, name, description, base_price, billing_cycle, limits, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code, name, description, base_price || 0, billing_cycle || 'monthly', JSON.stringify(limits || {}), JSON.stringify(features || {})]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscription Management
app.get('/api/customers/:id/subscription', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, p.name as plan_name, p.base_price, p.billing_cycle, p.limits, p.features
       FROM billing.subscriptions s
       JOIN billing.plans p ON s.plan_id = p.id
       WHERE s.customer_id = $1 AND s.status IN ('active', 'trialing')
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.params.id]
    );
    res.json({ subscription: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/:id/subscription', async (req, res) => {
  try {
    const { plan_id, payment_status } = req.body;
    
    // Cancel existing active subscriptions
    await db.query(
      `UPDATE billing.subscriptions 
       SET status = 'cancelled', cancel_at = CURRENT_DATE
       WHERE customer_id = $1 AND status IN ('active', 'trialing')`,
      [req.params.id]
    );
    
    // Calculate period dates
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    // Determine status based on payment
    let status = 'active';
    let trialEnd = null;
    if (payment_status === 'trial') {
      status = 'trialing';
      trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7); // 7 day trial
    } else if (payment_status === 'pending') {
      status = 'past_due';
    }
    
    // Create new subscription
    const result = await db.query(
      `INSERT INTO billing.subscriptions 
       (customer_id, plan_id, status, current_period_start, current_period_end, trial_end, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.params.id,
        plan_id,
        status,
        periodStart,
        periodEnd,
        trialEnd,
        JSON.stringify({ payment_method: payment_status === 'paid' ? 'manual' : payment_status })
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Promo Codes
app.get('/api/promo-codes', async (req, res) => {
  try {
    const { active_only } = req.query;
    const promoCodes = await promoEngine.listPromoCodes(active_only !== 'false');
    res.json(promoCodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/promo-codes', async (req, res) => {
  try {
    const promoCode = await promoEngine.createPromoCode(req.body);
    res.json(promoCode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/promo-codes/:code/validate', async (req, res) => {
  try {
    const { customer_id, plan_code } = req.body;
    const validation = await promoEngine.validatePromoCode(
      req.params.code,
      customer_id,
      plan_code
    );
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/promo-codes/:code/redeem', async (req, res) => {
  try {
    const { customer_id, subscription_id } = req.body;
    const result = await promoEngine.redeemPromoCode(
      req.params.code,
      customer_id,
      subscription_id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/promo-codes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await promoEngine.updatePromoStatus(req.params.id, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Credits
app.get('/api/customers/:id/credits', async (req, res) => {
  try {
    const credits = await promoEngine.getCustomerCredits(req.params.id);
    res.json({ total_credits: credits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/:id/credits', async (req, res) => {
  try {
    const { amount, source } = req.body;
    await promoEngine.addCredit(req.params.id, amount, source);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Offers
app.get('/api/offers', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM billing.offers ORDER BY priority DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id/offers', async (req, res) => {
  try {
    const { plan_type, billing_cycle } = req.query;
    const offers = await promoEngine.checkOffers(req.params.id, {
      plan_type,
      billing_cycle
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/offers', async (req, res) => {
  try {
    const result = await db.query(
      `INSERT INTO billing.offers 
       (name, description, offer_type, conditions, benefits, priority, auto_apply, valid_from, valid_until, max_redemptions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.body.name,
        req.body.description,
        req.body.offer_type,
        JSON.stringify(req.body.conditions),
        JSON.stringify(req.body.benefits),
        req.body.priority || 0,
        req.body.auto_apply || false,
        req.body.valid_from,
        req.body.valid_until,
        req.body.max_redemptions
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/offers/:id/apply', async (req, res) => {
  try {
    const { customer_id } = req.body;
    const result = await promoEngine.applyOffer(req.params.id, customer_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Referrals
app.post('/api/customers/:id/referral-code', async (req, res) => {
  try {
    const code = await promoEngine.createReferralCode(req.params.id);
    res.json({ referral_code: code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id/referrals', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM billing.referrals WHERE referrer_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ success: true });
});

const PORT = parseInt(process.env.ADMIN_PORT) || 3001;

app.listen(PORT, () => {
  console.log(`GST Platform Admin running on http://localhost:${PORT}`);
});
