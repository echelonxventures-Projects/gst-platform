# Promo Codes & Offers System

Complete guide for promotional campaigns, discounts, credits, and referral programs.

## Promo Code Types

### 1. **Percentage Discount**
```javascript
{
  "code": "SAVE30",
  "type": "percentage",
  "value": 30,  // 30% off
  "config": {
    "duration_months": 6,
    "applies_to": "base_price"
  }
}
```

### 2. **Fixed Amount Discount**
```javascript
{
  "code": "FLAT5000",
  "type": "fixed_amount",
  "value": 5000,  // ₹5,000 off
  "config": {
    "duration_months": 3,
    "min_purchase": 10000
  }
}
```

### 3. **Account Credits**
```javascript
{
  "code": "CREDIT10K",
  "type": "credit",
  "value": 10000,  // ₹10,000 credits
  "config": {
    "credit_expiry_months": 12
  }
}
```

### 4. **Trial Extension**
```javascript
{
  "code": "TRIAL30",
  "type": "trial_extension",
  "value": 30,  // 30 extra days
  "config": {}
}
```

### 5. **Feature Unlock**
```javascript
{
  "code": "PREMIUM",
  "type": "feature_unlock",
  "value": 0,
  "config": {
    "features": ["webhooks", "priority_support", "custom_integration"],
    "duration_months": 3
  }
}
```

### 6. **Plan Upgrade**
```javascript
{
  "code": "UPGRADE",
  "type": "plan_upgrade",
  "value": 0,
  "config": {
    "target_plan": "professional",
    "duration_months": 1
  }
}
```

## Creating Promo Codes

### Via API
```bash
curl -X POST http://localhost:3001/api/promo-codes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LAUNCH50",
    "name": "Launch Offer",
    "description": "50% off first 3 months",
    "type": "percentage",
    "value": 50,
    "max_uses": 1000,
    "max_uses_per_customer": 1,
    "valid_from": "2026-06-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "plans_applicable": ["starter", "professional"],
    "new_customers_only": true,
    "config": {
      "duration_months": 3
    }
  }'
```

### Via Code
```javascript
await promoEngine.createPromoCode({
  code: 'BLACKFRIDAY',
  name: 'Black Friday Sale',
  type: 'percentage',
  value: 40,
  max_uses: 5000,
  valid_until: new Date('2026-11-30'),
  config: { duration_months: 12 }
});
```

## Offer Types

### 1. **Signup Offers** (Auto-applied)
```javascript
{
  "name": "Welcome Bonus",
  "offer_type": "signup",
  "conditions": {
    "new_customer": true,
    "plan_type": "paid"
  },
  "benefits": {
    "discount_percent": 20,
    "duration_months": 1
  },
  "auto_apply": true
}
```

### 2. **Upgrade Incentives**
```javascript
{
  "name": "Annual Discount",
  "offer_type": "upgrade",
  "conditions": {
    "billing_cycle": "annual"
  },
  "benefits": {
    "discount_percent": 20,
    "permanent": true
  },
  "auto_apply": true
}
```

### 3. **Seasonal Campaigns**
```javascript
{
  "name": "Summer Sale",
  "offer_type": "seasonal",
  "conditions": {
    "date_range": {
      "start": "2026-06-01",
      "end": "2026-08-31"
    }
  },
  "benefits": {
    "discount_percent": 30,
    "duration_months": 12
  },
  "priority": 10
}
```

### 4. **Flash Sales**
```javascript
{
  "name": "24-Hour Flash Sale",
  "offer_type": "flash",
  "conditions": {
    "date_range": {
      "start": "2026-07-01T00:00:00Z",
      "end": "2026-07-01T23:59:59Z"
    }
  },
  "benefits": {
    "discount_percent": 50,
    "duration_months": 6
  },
  "max_redemptions": 100
}
```

### 5. **Loyalty Rewards**
```javascript
{
  "name": "Long-term Customer",
  "offer_type": "loyalty",
  "conditions": {
    "subscription_months": 12,
    "total_spent": 50000
  },
  "benefits": {
    "discount_percent": 15,
    "permanent": true,
    "feature_unlock": ["priority_support"]
  }
}
```

### 6. **Win-back Campaigns**
```javascript
{
  "name": "Come Back",
  "offer_type": "winback",
  "conditions": {
    "cancelled_subscription": true,
    "days_since_cancel": 30
  },
  "benefits": {
    "discount_percent": 40,
    "duration_months": 3
  }
}
```

### 7. **Bundle Offers**
```javascript
{
  "name": "API + Webhooks Bundle",
  "offer_type": "bundle",
  "conditions": {
    "features_purchased": ["webhooks", "custom_integration"]
  },
  "benefits": {
    "discount_percent": 25,
    "feature_unlock": ["priority_support"]
  }
}
```

## Referral Program

### Generate Referral Code
```javascript
const code = await promoEngine.createReferralCode(customerId);
// Returns: "REF8A4B2C1D"
```

### Referral Rewards Configuration
```javascript
{
  "referrer_reward": {
    "credit": 2000,  // ₹2,000 credits
    "discount_percent": 10,
    "duration_months": 6
  },
  "referred_reward": {
    "discount_percent": 20,
    "duration_months": 3,
    "credit": 1000
  }
}
```

## Customer Credits

### Add Credits
```javascript
// From promo code
await promoEngine.addCredit(customerId, 10000, 'promo_code', promoId);

// Manual credit
await promoEngine.addCredit(customerId, 5000, 'support_compensation');

// Referral reward
await promoEngine.addCredit(customerId, 2000, 'referral', referralId);
```

### Check Balance
```javascript
const credits = await promoEngine.getCustomerCredits(customerId);
// Returns: 17000
```

### Use Credits (Automatic on Invoice)
```javascript
const result = await promoEngine.useCredits(customerId, 4999);
// {
//   used_amount: 4999,
//   remaining: 0,
//   credits_used: [
//     { credit_id: 'uuid', amount: 4999 }
//   ]
// }
```

## Campaign Examples

### Launch Campaign
```javascript
// Create promo code
await promoEngine.createPromoCode({
  code: 'LAUNCH50',
  type: 'percentage',
  value: 50,
  max_uses: 1000,
  new_customers_only: true,
  valid_until: new Date('2026-07-31'),
  config: { duration_months: 3 }
});

// Create auto-apply offer
await db.query(`
  INSERT INTO billing.offers (name, offer_type, conditions, benefits, auto_apply)
  VALUES ($1, $2, $3, $4, $5)
`, [
  'Launch Week Bonus',
  'signup',
  JSON.stringify({ new_customer: true }),
  JSON.stringify({ credit: 5000 }),
  true
]);
```

### Black Friday Campaign
```javascript
// Main sale
await promoEngine.createPromoCode({
  code: 'BLACKFRIDAY',
  type: 'percentage',
  value: 40,
  max_uses: 10000,
  valid_from: new Date('2026-11-25'),
  valid_until: new Date('2026-11-30'),
  config: { duration_months: 12 }
});

// Early bird bonus
await promoEngine.createPromoCode({
  code: 'EARLYBIRD',
  type: 'credit',
  value: 10000,
  max_uses: 500,
  valid_until: new Date('2026-11-26'),
  config: { credit_expiry_months: 12 }
});
```

### Partner Campaign
```javascript
await promoEngine.createPromoCode({
  code: 'PARTNER2026',
  type: 'percentage',
  value: 35,
  max_uses: null,  // Unlimited
  max_uses_per_customer: 1,
  plans_applicable: ['professional', 'enterprise'],
  config: {
    duration_months: 12,
    partner_id: 'acme-corp',
    commission: 20
  }
});
```

## Validation & Redemption

### Validate Promo Code
```javascript
const validation = await promoEngine.validatePromoCode(
  'LAUNCH50',
  customerId,
  'professional'
);

if (validation.valid) {
  // Show discount in checkout
  const promo = validation.promo;
  console.log(`${promo.value}% off for ${promo.config.duration_months} months`);
} else {
  console.error(validation.error);
}
```

### Redeem Promo Code
```javascript
const result = await promoEngine.redeemPromoCode(
  'LAUNCH50',
  customerId,
  subscriptionId
);

if (result.success) {
  console.log('Benefits:', result.benefits);
  // Apply discount to subscription
} else {
  console.error(result.error);
}
```

### Check Available Offers
```javascript
const offers = await promoEngine.checkOffers(customerId, {
  plan_type: 'paid',
  billing_cycle: 'annual'
});

// Auto-apply eligible offers
for (const offer of offers) {
  if (offer.auto_apply) {
    await promoEngine.applyOffer(offer.id, customerId);
  }
}
```

## Promo Code Restrictions

### Usage Limits
- **max_uses**: Total redemptions across all customers
- **max_uses_per_customer**: Redemptions per customer
- **new_customers_only**: Only for first-time subscribers

### Plan Restrictions
```javascript
{
  "plans_applicable": ["professional", "enterprise"],
  // null or omit for all plans
}
```

### Time Restrictions
```javascript
{
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": "2026-12-31T23:59:59Z"
}
```

### Minimum Commitment
```javascript
{
  "minimum_commitment_months": 6,
  "early_termination_fee": 5000
}
```

### Stackable Promos
```javascript
{
  "stackable": true  // Can combine with other offers
}
```

## Analytics & Reporting

### Promo Code Performance
```sql
SELECT 
  pc.code,
  pc.name,
  pc.used_count,
  pc.max_uses,
  COUNT(DISTINCT pr.customer_id) as unique_customers,
  SUM(pr.discount_amount) as total_discount,
  SUM(pr.credits_applied) as total_credits
FROM billing.promo_codes pc
LEFT JOIN billing.promo_redemptions pr ON pc.id = pr.promo_code_id
GROUP BY pc.id
ORDER BY pc.used_count DESC;
```

### Most Effective Offers
```sql
SELECT 
  o.name,
  o.offer_type,
  o.redemption_count,
  COUNT(DISTINCT ors.customer_id) as customers_acquired
FROM billing.offers o
LEFT JOIN billing.offer_redemptions ors ON o.id = ors.offer_id
GROUP BY o.id
ORDER BY o.redemption_count DESC;
```

### Credits Usage
```sql
SELECT 
  customer_id,
  SUM(amount) as total_earned,
  SUM(used_amount) as total_used,
  SUM(remaining_amount) as balance
FROM billing.customer_credits
WHERE status = 'active'
GROUP BY customer_id;
```

## Best Practices

1. **Clear expiration dates** - Always set valid_until
2. **Usage limits** - Prevent abuse with max_uses
3. **Auto-apply offers** - Better UX for customers
4. **Stackable carefully** - Control discount stacking
5. **Track attribution** - Store marketing campaign data
6. **Monitor abuse** - Alert on unusual redemption patterns
7. **Test before launch** - Validate promo logic
8. **Communicate clearly** - Explain terms to customers

## API Endpoints Summary

```
POST   /api/promo-codes                    Create promo code
GET    /api/promo-codes                    List all promos
POST   /api/promo-codes/:code/validate     Validate code
POST   /api/promo-codes/:code/redeem       Redeem code
PATCH  /api/promo-codes/:id/status         Update status

GET    /api/customers/:id/credits          Get credit balance
POST   /api/customers/:id/credits          Add credits

POST   /api/offers                          Create offer
GET    /api/offers                          List offers
GET    /api/customers/:id/offers            Check eligible offers
POST   /api/offers/:id/apply                Apply offer

POST   /api/customers/:id/referral-code    Generate referral
GET    /api/customers/:id/referrals        List referrals
```

## Support

For campaign setup and promo management:
- Email: marketing@gstplatform.in
- Admin Panel: https://admin.gstplatform.in/promos
