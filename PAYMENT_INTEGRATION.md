# Payment Integration Guide

## Current Status

The platform has:
- ✅ Plans with pricing defined
- ✅ Subscriptions table for tracking customer plans
- ✅ Invoices table for billing records
- ❌ **No payment gateway integration** (Stripe, Razorpay, etc.)

## Payment Flow Options

### Option 1: Manual/Invoice-Based (Current Default)

**How it works:**
1. Admin assigns a plan to customer
2. System generates invoice monthly
3. Customer pays via bank transfer/manual methods
4. Admin manually marks invoice as "paid"

**Use case:** B2B clients, enterprise customers, Indian market with offline payments

---

### Option 2: Razorpay Integration (Recommended for India)

**Setup Steps:**

#### 1. Install Razorpay SDK
```bash
npm install razorpay
```

#### 2. Add Environment Variables
```bash
# .env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

#### 3. Create Payment Service

**File:** `packages/billing-engine/src/payment.js`

```javascript
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@gst-platform/core/db';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export class PaymentService {
  // Create subscription
  async createSubscription(customerId, planId) {
    const customer = await db.query('SELECT * FROM billing.customers WHERE id = $1', [customerId]);
    const plan = await db.query('SELECT * FROM billing.plans WHERE id = $1', [planId]);
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.rows[0].razorpay_plan_id, // Store this when creating plan
      customer_notify: 1,
      total_count: plan.rows[0].billing_cycle === 'monthly' ? 12 : 1,
      notes: {
        customer_id: customerId,
        company: customer.rows[0].company_name
      }
    });

    await db.query(
      `INSERT INTO billing.subscriptions 
       (customer_id, plan_id, status, current_period_start, current_period_end, metadata)
       VALUES ($1, $2, 'trialing', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', $3)
       RETURNING *`,
      [customerId, planId, JSON.stringify({ razorpay_subscription_id: subscription.id })]
    );

    return subscription;
  }

  // Create one-time payment order
  async createPaymentOrder(customerId, amount, description) {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { customer_id: customerId, description }
    });
    return order;
  }

  // Verify payment signature
  verifyPayment(orderId, paymentId, signature) {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    return generated === signature;
  }

  // Handle webhook
  async handleWebhook(event, signature) {
    const isValid = this.verifyWebhookSignature(JSON.stringify(event), signature);
    if (!isValid) throw new Error('Invalid signature');

    switch (event.event) {
      case 'payment.captured':
        await this.handlePaymentSuccess(event.payload.payment.entity);
        break;
      case 'subscription.charged':
        await this.handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
    }
  }

  verifyWebhookSignature(body, signature) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    return expected === signature;
  }

  async handlePaymentSuccess(payment) {
    await db.query(
      `UPDATE billing.invoices 
       SET status = 'paid', paid_at = now(), 
           metadata = metadata || $1
       WHERE invoice_number = $2`,
      [JSON.stringify({ razorpay_payment_id: payment.id }), payment.notes.invoice_number]
    );
  }
}

export const paymentService = new PaymentService();
```

#### 4. Add Admin API Endpoints

**File:** `apps/admin/src/index.js`

```javascript
import { paymentService } from '@gst-platform/billing-engine/payment';

// Create subscription with payment
app.post('/api/customers/:id/subscribe', async (req, res) => {
  try {
    const { plan_id } = req.body;
    const subscription = await paymentService.createSubscription(req.params.id, plan_id);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate invoice
app.post('/api/customers/:id/invoice', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const order = await paymentService.createPaymentOrder(req.params.id, amount, description);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Razorpay webhook
app.post('/webhooks/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    await paymentService.handleWebhook(req.body, signature);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Manual payment confirmation
app.post('/api/invoices/:id/mark-paid', async (req, res) => {
  try {
    const { payment_method, transaction_ref } = req.body;
    await db.query(
      `UPDATE billing.invoices 
       SET status = 'paid', paid_at = now(), 
           metadata = metadata || $1
       WHERE id = $2`,
      [JSON.stringify({ payment_method, transaction_ref }), req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 5. Frontend Payment Button

Add to admin panel customer detail:

```javascript
async function createSubscription(customerId, planId) {
  const res = await authFetch(`/api/customers/${customerId}/subscribe`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan_id: planId })
  });
  const sub = await res.json();
  alert('Subscription created! Razorpay Subscription ID: ' + sub.id);
}
```

---

### Option 3: Stripe Integration (International)

**Setup Steps:**

#### 1. Install Stripe SDK
```bash
npm install stripe
```

#### 2. Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 3. Payment Service

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripePaymentService {
  async createCustomer(email, name) {
    return await stripe.customers.create({ email, name });
  }

  async createSubscription(stripeCustomerId, planId) {
    return await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: planId }], // Use Stripe Price ID
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });
  }

  async createPaymentIntent(amount, customerId) {
    return await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'inr',
      customer: customerId,
      automatic_payment_methods: { enabled: true }
    });
  }

  async handleWebhook(body, signature) {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object);
        break;
    }
  }
}
```

---

## Implementation Recommendation

### For Indian Market:
**Use Razorpay** - Better UX for UPI, Cards, NetBanking, Wallets

### For International:
**Use Stripe** - Better global payment support

### For Enterprise B2B:
**Use Manual Invoice System** with bank transfer

---

## Immediate Implementation (Minimal)

### 1. Add Subscription Management to Admin

**File:** `apps/admin/public/index.html`

Add to customer detail section:

```html
<div id="customer-tab-subscription" style="display:none">
  <h4>Current Subscription</h4>
  <div id="current-subscription"></div>
  <button onclick="showModal('assign-plan-modal')">Assign Plan</button>
</div>

<!-- Modal -->
<div class="modal" id="assign-plan-modal">
  <div class="modal-content">
    <h3>Assign Plan</h3>
    <div class="form-group">
      <label>Select Plan</label>
      <select id="assign-plan-select"></select>
    </div>
    <div class="form-group">
      <label>Payment Method</label>
      <select id="payment-method">
        <option value="razorpay">Razorpay (Auto)</option>
        <option value="manual">Manual/Invoice</option>
        <option value="trial">Free Trial</option>
      </select>
    </div>
    <button class="success" onclick="assignPlan()">Assign Plan</button>
    <button onclick="hideModal('assign-plan-modal')">Cancel</button>
  </div>
</div>
```

### 2. Add Subscription Creation Endpoint

```javascript
app.post('/api/customers/:id/subscription', async (req, res) => {
  try {
    const { plan_id, payment_method } = req.body;
    
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    const result = await db.query(
      `INSERT INTO billing.subscriptions 
       (customer_id, plan_id, status, current_period_start, current_period_end, metadata)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
       RETURNING *`,
      [
        req.params.id,
        plan_id,
        payment_method === 'trial' ? 'trialing' : 'active',
        periodEnd,
        JSON.stringify({ payment_method })
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. JavaScript Function

```javascript
async function assignPlan() {
  const planId = document.getElementById('assign-plan-select').value;
  const paymentMethod = document.getElementById('payment-method').value;
  
  const res = await authFetch(`/api/customers/${selectedCustomerId}/subscription`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod })
  });
  
  if (res.ok) {
    alert('Plan assigned successfully!');
    hideModal('assign-plan-modal');
    loadSubscription();
  }
}
```

---

## Next Steps

1. **Choose payment gateway** based on target market
2. **Install SDK** and configure credentials
3. **Implement payment service** using examples above
4. **Add webhook endpoint** for automatic payment updates
5. **Test with sandbox/test mode** before going live
6. **Add invoice generation** for payment records

---

## Cost Breakdown

| Payment Gateway | Transaction Fee | Setup Cost | Best For |
|----------------|----------------|------------|----------|
| Razorpay | 2% + GST | Free | Indian customers |
| Stripe | 2.9% + ₹2 | Free | International |
| Manual/Invoice | ₹0 | Free | B2B Enterprise |

---

## Security Checklist

- ✅ Store webhook secrets securely
- ✅ Verify all payment signatures
- ✅ Never expose secret keys in frontend
- ✅ Use HTTPS for all payment endpoints
- ✅ Log all payment transactions
- ✅ Implement retry logic for failed payments
