import { db } from '@gst-platform/core/db';

export class BillingConfig {
  async setCustomConfig(customerId, configType, configData) {
    await db.query(
      `INSERT INTO billing.custom_configs (customer_id, config_type, config_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_id, config_type) 
       DO UPDATE SET config_data = EXCLUDED.config_data, updated_at = now()`,
      [customerId, configType, JSON.stringify(configData)]
    );
  }

  async getCustomConfig(customerId, configType) {
    const result = await db.query(
      `SELECT config_data FROM billing.custom_configs 
       WHERE customer_id = $1 AND config_type = $2 AND active = true`,
      [customerId, configType]
    );
    return result.rows[0]?.config_data;
  }

  async getEffectiveLimits(customerId, keyId) {
    const result = await db.query(
      `SELECT 
         k.custom_limits as key_limits,
         s.custom_limits as subscription_limits,
         p.limits as plan_limits
       FROM billing.api_keys k
       LEFT JOIN billing.subscriptions s ON k.customer_id = s.customer_id AND s.status = 'active'
       LEFT JOIN billing.plans p ON COALESCE(s.plan_id, k.plan_id) = p.id
       WHERE k.id = $1`,
      [keyId]
    );

    if (result.rows.length === 0) return null;

    const { key_limits, subscription_limits, plan_limits } = result.rows[0];
    
    // Merge limits: key > subscription > plan
    return {
      ...plan_limits,
      ...subscription_limits,
      ...key_limits
    };
  }

  async setCustomLimits(customerId, limits) {
    await db.query(
      `UPDATE billing.subscriptions 
       SET custom_limits = $1
       WHERE customer_id = $2 AND status = 'active'`,
      [JSON.stringify(limits), customerId]
    );
  }

  async setCustomPricing(customerId, price, discountPercent = 0) {
    await db.query(
      `UPDATE billing.subscriptions 
       SET custom_pricing = $1, discount_percent = $2
       WHERE customer_id = $3 AND status = 'active'`,
      [price, discountPercent, customerId]
    );
  }

  async setCustomFeatures(customerId, features) {
    await db.query(
      `UPDATE billing.subscriptions 
       SET custom_features = $1
       WHERE customer_id = $2 AND status = 'active'`,
      [JSON.stringify(features), customerId]
    );
  }

  async getQuota(customerId, quotaType) {
    const result = await db.query(
      `SELECT * FROM billing.usage_quotas 
       WHERE customer_id = $1 AND quota_type = $2`,
      [customerId, quotaType]
    );

    if (result.rows.length === 0) return null;

    const quota = result.rows[0];
    
    // Check if reset needed
    const now = new Date();
    const lastReset = new Date(quota.last_reset);
    let needsReset = false;

    switch (quota.reset_period) {
      case 'hourly':
        needsReset = (now - lastReset) >= 3600000;
        break;
      case 'daily':
        needsReset = now.getDate() !== lastReset.getDate();
        break;
      case 'monthly':
        needsReset = now.getMonth() !== lastReset.getMonth();
        break;
      case 'annual':
        needsReset = now.getFullYear() !== lastReset.getFullYear();
        break;
    }

    if (needsReset) {
      await db.query(
        `UPDATE billing.usage_quotas 
         SET used_value = 0, last_reset = now()
         WHERE id = $1`,
        [quota.id]
      );
      quota.used_value = 0;
    }

    return quota;
  }

  async incrementQuota(customerId, quotaType, amount = 1) {
    await db.query(
      `INSERT INTO billing.usage_quotas (customer_id, quota_type, limit_value, used_value, reset_period)
       VALUES ($1, $2, 999999999, $3, 'monthly')
       ON CONFLICT (customer_id, quota_type)
       DO UPDATE SET used_value = billing.usage_quotas.used_value + $3`,
      [customerId, quotaType, amount]
    );
  }

  async createQuota(customerId, quotaType, limitValue, resetPeriod = 'monthly') {
    await db.query(
      `INSERT INTO billing.usage_quotas (customer_id, quota_type, limit_value, reset_period)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (customer_id, quota_type)
       DO UPDATE SET limit_value = EXCLUDED.limit_value, reset_period = EXCLUDED.reset_period`,
      [customerId, quotaType, limitValue, resetPeriod]
    );
  }

  async calculateOverage(customerId, periodStart, periodEnd) {
    const limits = await this.getEffectiveLimits(customerId);
    const monthlyLimit = limits?.requests_per_month || -1;

    if (monthlyLimit === -1) return { overage: 0, cost: 0 };

    const result = await db.query(
      `SELECT COUNT(*) as total_requests
       FROM billing.api_usage
       WHERE customer_id = $1 
         AND timestamp BETWEEN $2 AND $3`,
      [customerId, periodStart, periodEnd]
    );

    const totalRequests = parseInt(result.rows[0].total_requests);
    const overage = Math.max(0, totalRequests - monthlyLimit);

    if (overage === 0) return { overage: 0, cost: 0 };

    const subscription = await db.query(
      `SELECT p.overage_config
       FROM billing.subscriptions s
       JOIN billing.plans p ON s.plan_id = p.id
       WHERE s.customer_id = $1 AND s.status = 'active'`,
      [customerId]
    );

    const overageConfig = subscription.rows[0]?.overage_config || {};
    
    if (!overageConfig.enabled) return { overage, cost: 0 };

    const freeOverage = overageConfig.free_overage || 0;
    const chargeableOverage = Math.max(0, overage - freeOverage);
    const perRequestCost = overageConfig.per_request || 0;
    const minCharge = overageConfig.min_charge || 0;
    
    const cost = Math.max(minCharge, chargeableOverage * perRequestCost);

    return { overage, cost, chargeableOverage };
  }

  async recordOverageCharge(customerId, invoiceId, chargeType, quantity, unitPrice) {
    const totalAmount = quantity * unitPrice;
    
    await db.query(
      `INSERT INTO billing.overage_charges 
       (customer_id, invoice_id, charge_type, quantity, unit_price, total_amount, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6, date_trunc('month', CURRENT_DATE), CURRENT_DATE)`,
      [customerId, invoiceId, chargeType, quantity, unitPrice, totalAmount]
    );

    return totalAmount;
  }
}

export const billingConfig = new BillingConfig();
