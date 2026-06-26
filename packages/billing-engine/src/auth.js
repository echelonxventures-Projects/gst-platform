import crypto from 'crypto';
import { db } from '@gst-platform/core/db';

export class APIKeyAuth {
  generateKey() {
    const key = `gst_${crypto.randomBytes(32).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 12);
    return { key, hash, prefix };
  }

  async createKey(customerId, name, planId, expiresInDays = null, customLimits = null) {
    const { key, hash, prefix } = this.generateKey();
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await db.query(
      `INSERT INTO billing.api_keys 
       (customer_id, key_hash, key_prefix, plan_id, name, expires_at, custom_limits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, key_prefix, status, created_at`,
      [customerId, hash, prefix, planId, name, expiresAt, customLimits ? JSON.stringify(customLimits) : null]
    );

    return { ...result.rows[0], key };
  }

  async validateKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('gst_')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = await db.query(
      `SELECT 
         k.id, k.customer_id, k.status, k.expires_at, k.custom_limits,
         c.status as customer_status, c.company_name,
         s.custom_limits as subscription_limits,
         p.limits as plan_limits, p.code as plan_code, p.features
       FROM billing.api_keys k
       JOIN billing.customers c ON k.customer_id = c.id
       LEFT JOIN billing.subscriptions s ON k.customer_id = s.customer_id AND s.status = 'active'
       LEFT JOIN billing.plans p ON COALESCE(s.plan_id, k.plan_id) = p.id
       WHERE k.key_hash = $1`,
      [hash]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'API key not found' };
    }

    const keyData = result.rows[0];

    if (keyData.status !== 'active') {
      return { valid: false, error: 'API key is not active' };
    }

    if (keyData.customer_status !== 'active') {
      return { valid: false, error: 'Customer account is not active' };
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    await db.query(
      'UPDATE billing.api_keys SET last_used_at = now() WHERE id = $1',
      [keyData.id]
    );

    // Merge limits: custom_limits > subscription_limits > plan_limits
    const effectiveLimits = {
      ...keyData.plan_limits,
      ...keyData.subscription_limits,
      ...keyData.custom_limits
    };

    return {
      valid: true,
      keyId: keyData.id,
      customerId: keyData.customer_id,
      companyName: keyData.company_name,
      limits: effectiveLimits,
      features: keyData.features,
      planCode: keyData.plan_code
    };
  }

  async checkRateLimit(keyId, customerId, limits) {
    const hourlyLimit = limits.requests_per_hour || 1000;
    const burstLimit = limits.burst_limit || hourlyLimit * 1.2;
    const window = limits.rate_limit_window || 3600;

    // Check hourly limit
    const hourlyResult = await db.query(
      `SELECT COUNT(*) as count
       FROM billing.api_usage
       WHERE api_key_id = $1 
         AND timestamp > now() - interval '1 hour'`,
      [keyId]
    );

    const hourlyCount = parseInt(hourlyResult.rows[0].count);

    if (hourlyCount >= hourlyLimit) {
      return {
        allowed: false,
        current: hourlyCount,
        limit: hourlyLimit,
        remaining: 0,
        resetIn: 3600,
        limitType: 'hourly'
      };
    }

    // Check burst limit (last 5 minutes)
    const burstResult = await db.query(
      `SELECT COUNT(*) as count
       FROM billing.api_usage
       WHERE api_key_id = $1 
         AND timestamp > now() - interval '5 minutes'`,
      [keyId]
    );

    const burstCount = parseInt(burstResult.rows[0].count);
    const burstLimitFor5Min = Math.floor(burstLimit / 12);

    if (burstCount >= burstLimitFor5Min) {
      return {
        allowed: false,
        current: burstCount,
        limit: burstLimitFor5Min,
        remaining: 0,
        resetIn: 300,
        limitType: 'burst'
      };
    }

    // Check daily limit if set
    if (limits.requests_per_day && limits.requests_per_day > 0) {
      const dailyResult = await db.query(
        `SELECT COUNT(*) as count
         FROM billing.api_usage
         WHERE customer_id = $1 
           AND timestamp >= date_trunc('day', CURRENT_TIMESTAMP)`,
        [customerId]
      );

      const dailyCount = parseInt(dailyResult.rows[0].count);

      if (dailyCount >= limits.requests_per_day) {
        return {
          allowed: false,
          current: dailyCount,
          limit: limits.requests_per_day,
          remaining: 0,
          resetIn: 86400,
          limitType: 'daily'
        };
      }
    }

    // Check monthly limit if set
    if (limits.requests_per_month && limits.requests_per_month > 0) {
      const monthlyResult = await db.query(
        `SELECT COUNT(*) as count
         FROM billing.api_usage
         WHERE customer_id = $1 
           AND timestamp >= date_trunc('month', CURRENT_TIMESTAMP)`,
        [customerId]
      );

      const monthlyCount = parseInt(monthlyResult.rows[0].count);

      if (monthlyCount >= limits.requests_per_month) {
        return {
          allowed: false,
          current: monthlyCount,
          limit: limits.requests_per_month,
          remaining: 0,
          resetIn: null,
          limitType: 'monthly'
        };
      }
    }

    return {
      allowed: true,
      current: hourlyCount,
      limit: hourlyLimit,
      remaining: Math.max(0, hourlyLimit - hourlyCount),
      resetIn: 3600
    };
  }

  async revokeKey(keyId) {
    await db.query(
      'UPDATE billing.api_keys SET status = $1 WHERE id = $2',
      ['revoked', keyId]
    );
  }
}

export const apiKeyAuth = new APIKeyAuth();
