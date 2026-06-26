import express from 'express';
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
      'SELECT id, key_prefix, name, status, rate_limit, created_at, last_used_at FROM billing.api_keys WHERE customer_id = $1',
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

const PORT = parseInt(process.env.ADMIN_PORT) || 3001;

app.listen(PORT, () => {
  console.log(`GST Platform Admin running on http://localhost:${PORT}`);
});
