# Billing Configuration Guide

Complete guide for custom billing configurations, limits, pricing, and features.

## Overview

The billing system supports fully customizable configurations at multiple levels:
1. **Plan Level** - Default configurations
2. **Subscription Level** - Customer-specific overrides
3. **API Key Level** - Per-key custom limits
4. **Custom Configs** - Arbitrary configuration storage

## Configuration Hierarchy

```
API Key Custom Limits (highest priority)
         ↓
Subscription Custom Limits
         ↓
Plan Default Limits (lowest priority)
```

## Limit Types

### Rate Limits
```json
{
  "requests_per_hour": 1000,
  "requests_per_day": 100000,
  "requests_per_month": 1000000,
  "concurrent_requests": 20,
  "burst_limit": 1500,
  "rate_limit_window": 3600,
  "max_api_keys": 5
}
```

- **requests_per_hour** - Hourly request limit
- **requests_per_day** - Daily request limit
- **requests_per_month** - Monthly limit (-1 = unlimited)
- **concurrent_requests** - Simultaneous connections
- **burst_limit** - Short burst allowance
- **rate_limit_window** - Time window in seconds
- **max_api_keys** - Number of API keys allowed

### Features
```json
{
  "basic_support": true,
  "email_support": true,
  "phone_support": false,
  "webhooks": true,
  "custom_integration": true,
  "sla": "99.5%",
  "data_export": true,
  "analytics_retention_days": 90,
  "priority_support": true,
  "webhook_retry": 3,
  "white_label": false,
  "dedicated_account_manager": false
}
```

### Overage Configuration
```json
{
  "enabled": true,
  "per_request": 0.01,
  "min_charge": 100,
  "free_overage": 10000,
  "negotiable": false
}
```

- **enabled** - Allow overage billing
- **per_request** - Cost per extra request
- **min_charge** - Minimum overage charge
- **free_overage** - Free overage allowance
- **negotiable** - Custom terms available

## Custom Configuration Examples

### 1. Enterprise Customer with Custom Limits

```javascript
// Set custom monthly limit
await billingConfig.setCustomLimits(customerId, {
  requests_per_month: 50000000,  // 50M requests
  requests_per_hour: 50000,
  concurrent_requests: 1000,
  burst_limit: 75000
});

// Set custom pricing
await billingConfig.setCustomPricing(
  customerId, 
  49999,    // ₹49,999/month
  10        // 10% discount
);

// Enable custom features
await billingConfig.setCustomFeatures(customerId, {
  dedicated_account_manager: true,
  white_label: true,
  custom_contract: true,
  sla: "99.99%",
  webhook_retry: 10
});
```

### 2. Trial with Temporary Limits

```javascript
// Create API key with trial limits
await apiKeyAuth.createKey(
  customerId,
  'Trial Key',
  planId,
  14,  // Expires in 14 days
  {
    requests_per_hour: 500,
    requests_per_day: 5000,
    requests_per_month: 50000,
    max_api_keys: 1
  }
);
```

### 3. Partner Integration with Special Rates

```javascript
// Custom overage configuration
await billingConfig.setCustomConfig(customerId, 'overage', {
  enabled: true,
  per_request: 0.0005,  // Discounted rate
  free_overage: 500000,
  min_charge: 0,
  bulk_discount: {
    "1000000": 0.0004,
    "5000000": 0.0003
  }
});
```

### 4. Usage Quotas

```javascript
// Create custom quota
await billingConfig.createQuota(
  customerId,
  'webhook_calls',
  10000,
  'monthly'
);

// Check quota
const quota = await billingConfig.getQuota(customerId, 'webhook_calls');
// { limit_value: 10000, used_value: 2500, remaining: 7500 }

// Increment usage
await billingConfig.incrementQuota(customerId, 'webhook_calls', 1);
```

### 5. API Key with Endpoint-Specific Limits

```javascript
await apiKeyAuth.createKey(
  customerId,
  'Search-Only Key',
  planId,
  null,
  {
    requests_per_hour: 2000,
    allowed_endpoints: ['/api/v1/search', '/api/v1/suggest'],
    endpoint_limits: {
      '/api/v1/search': { requests_per_minute: 100 },
      '/api/v1/suggest': { requests_per_minute: 200 }
    }
  }
);
```

### 6. Custom Billing Cycle

```javascript
// Quarterly billing
await db.query(`
  UPDATE billing.subscriptions 
  SET 
    current_period_start = CURRENT_DATE,
    current_period_end = CURRENT_DATE + interval '3 months',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{billing_cycle}',
      '"quarterly"'
    )
  WHERE customer_id = $1
`, [customerId]);
```

## Admin API Endpoints

### Set Custom Limits
```http
PUT /api/customers/:id/limits
Content-Type: application/json

{
  "requests_per_hour": 10000,
  "requests_per_month": 10000000
}
```

### Set Custom Pricing
```http
PUT /api/customers/:id/pricing
Content-Type: application/json

{
  "custom_pricing": 29999,
  "discount_percent": 15
}
```

### Set Custom Features
```http
PUT /api/customers/:id/features
Content-Type: application/json

{
  "dedicated_account_manager": true,
  "sla": "99.99%"
}
```

### Create Custom Quota
```http
POST /api/customers/:id/quotas
Content-Type: application/json

{
  "quota_type": "data_export",
  "limit_value": 100,
  "reset_period": "monthly"
}
```

### Create API Key with Custom Limits
```http
POST /api/customers/:id/keys
Content-Type: application/json

{
  "name": "Production Key",
  "plan_id": "uuid",
  "expires_in_days": 365,
  "custom_limits": {
    "requests_per_hour": 5000,
    "burst_limit": 7500
  }
}
```

## Overage Calculation

```javascript
// Automatic overage calculation
const overage = await billingConfig.calculateOverage(
  customerId,
  '2026-06-01',
  '2026-06-30'
);

console.log(overage);
// {
//   overage: 150000,
//   cost: 750,
//   chargeableOverage: 150000
// }
```

## Real-Time Limit Enforcement

The system enforces limits in real-time:

1. **Hourly Limit** - Checked every request
2. **Burst Limit** - Checked for last 5 minutes
3. **Daily Limit** - Checked if configured
4. **Monthly Limit** - Checked if configured

Response headers always include:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 3600
```

## Monitoring & Alerts

Set up alerts for customers:

```javascript
// Alert when 80% of monthly limit reached
const usage = await usageTracker.getCurrentMonthUsage(customerId);
const limits = await billingConfig.getEffectiveLimits(customerId);

if (usage.total_requests > limits.requests_per_month * 0.8) {
  // Send alert email
  await sendAlertEmail(customer, {
    type: 'usage_warning',
    usage: usage.total_requests,
    limit: limits.requests_per_month,
    percent: 80
  });
}
```

## Best Practices

1. **Always set burst limits** - Prevent abuse
2. **Use custom limits for trials** - Time-limited access
3. **Set overage caps** - Prevent bill shock
4. **Monitor quota usage** - Track feature consumption
5. **Implement soft limits** - Warn before hard limit
6. **Log all config changes** - Audit trail
7. **Test limits before applying** - Avoid disruption

## Migration Examples

### Move Customer to Higher Plan
```javascript
// Get current usage
const usage = await usageTracker.getCurrentMonthUsage(customerId);

// If exceeding current plan, upgrade
if (usage.total_requests > 100000) {
  await db.query(`
    UPDATE billing.subscriptions
    SET plan_id = (SELECT id FROM billing.plans WHERE code = 'professional')
    WHERE customer_id = $1
  `, [customerId]);
}
```

### Apply Temporary Discount
```javascript
await billingConfig.setCustomPricing(
  customerId,
  null,  // Keep base price
  30     // 30% discount for 3 months
);

// Schedule removal
await workflowOrchestrator.scheduleJob(
  'remove_discount',
  { customerId },
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
);
```

## Support

For custom billing configurations, contact:
- Email: billing@gstplatform.in
- Admin Panel: https://admin.gstplatform.in
