import { db } from '@gst-platform/core/db';
import crypto from 'crypto';

export class PromoEngine {
  async validatePromoCode(code, customerId, planCode = null) {
    const result = await db.query(
      `SELECT pc.*, 
              COUNT(pr.id) FILTER (WHERE pr.customer_id = $2) as customer_redemptions
       FROM billing.promo_codes pc
       LEFT JOIN billing.promo_redemptions pr ON pc.id = pr.promo_code_id
       WHERE pc.code = $1 AND pc.status = 'active'
       GROUP BY pc.id`,
      [code.toUpperCase(), customerId]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'Invalid promo code' };
    }

    const promo = result.rows[0];
    const now = new Date();

    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return { valid: false, error: 'Promo code not yet valid' };
    }

    if (promo.valid_until && new Date(promo.valid_until) < now) {
      await this.updatePromoStatus(promo.id, 'expired');
      return { valid: false, error: 'Promo code expired' };
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      await this.updatePromoStatus(promo.id, 'depleted');
      return { valid: false, error: 'Promo code fully redeemed' };
    }

    if (promo.customer_redemptions >= promo.max_uses_per_customer) {
      return { valid: false, error: 'You have already used this promo code' };
    }

    if (promo.new_customers_only) {
      const existingCustomer = await db.query(
        'SELECT id FROM billing.subscriptions WHERE customer_id = $1 LIMIT 1',
        [customerId]
      );
      if (existingCustomer.rows.length > 0) {
        return { valid: false, error: 'Promo code for new customers only' };
      }
    }

    if (promo.plans_applicable && planCode) {
      if (!promo.plans_applicable.includes(planCode)) {
        return { valid: false, error: 'Promo code not applicable to this plan' };
      }
    }

    return { valid: true, promo };
  }

  async redeemPromoCode(code, customerId, subscriptionId = null) {
    const validation = await this.validatePromoCode(code, customerId);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const promo = validation.promo;

    return await db.transaction(async (client) => {
      // Increment usage count
      await client.query(
        'UPDATE billing.promo_codes SET used_count = used_count + 1 WHERE id = $1',
        [promo.id]
      );

      let benefits = {};
      let discountAmount = 0;
      let creditsApplied = 0;
      let expiresAt = null;

      switch (promo.type) {
        case 'percentage':
          benefits.discount_percent = promo.value;
          benefits.duration_months = promo.config.duration_months || 1;
          discountAmount = promo.value;
          expiresAt = promo.config.duration_months 
            ? new Date(Date.now() + promo.config.duration_months * 30 * 24 * 60 * 60 * 1000)
            : null;
          break;

        case 'fixed_amount':
          benefits.discount_amount = promo.value;
          benefits.duration_months = promo.config.duration_months || 1;
          discountAmount = promo.value;
          expiresAt = promo.config.duration_months
            ? new Date(Date.now() + promo.config.duration_months * 30 * 24 * 60 * 60 * 1000)
            : null;
          break;

        case 'credit':
          creditsApplied = promo.value;
          await this.addCredit(customerId, promo.value, 'promo_code', promo.id, client);
          expiresAt = promo.config.credit_expiry_months
            ? new Date(Date.now() + promo.config.credit_expiry_months * 30 * 24 * 60 * 60 * 1000)
            : null;
          break;

        case 'trial_extension':
          benefits.trial_days = promo.value;
          if (subscriptionId) {
            await client.query(
              `UPDATE billing.subscriptions 
               SET trial_end = COALESCE(trial_end, CURRENT_DATE) + $1 * interval '1 day'
               WHERE id = $2`,
              [promo.value, subscriptionId]
            );
          }
          break;

        case 'feature_unlock':
          benefits.features = promo.config.features || [];
          benefits.duration_months = promo.config.duration_months;
          expiresAt = promo.config.duration_months
            ? new Date(Date.now() + promo.config.duration_months * 30 * 24 * 60 * 60 * 1000)
            : null;
          break;

        case 'plan_upgrade':
          benefits.upgrade_to_plan = promo.config.target_plan;
          benefits.duration_months = promo.config.duration_months || 1;
          expiresAt = promo.config.duration_months
            ? new Date(Date.now() + promo.config.duration_months * 30 * 24 * 60 * 60 * 1000)
            : null;
          break;
      }

      // Record redemption
      const redemption = await client.query(
        `INSERT INTO billing.promo_redemptions 
         (promo_code_id, customer_id, subscription_id, discount_amount, credits_applied, benefits, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [promo.id, customerId, subscriptionId, discountAmount, creditsApplied, JSON.stringify(benefits), expiresAt]
      );

      return {
        success: true,
        redemption: redemption.rows[0],
        benefits
      };
    });
  }

  async addCredit(customerId, amount, source, sourceId = null, client = db) {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    await client.query(
      `INSERT INTO billing.customer_credits (customer_id, amount, source, source_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [customerId, amount, source, sourceId, expiresAt]
    );
  }

  async getCustomerCredits(customerId) {
    const result = await db.query(
      `SELECT SUM(remaining_amount) as total_credits
       FROM billing.customer_credits
       WHERE customer_id = $1 AND status = 'active' 
         AND (expires_at IS NULL OR expires_at > now())`,
      [customerId]
    );
    return parseFloat(result.rows[0].total_credits) || 0;
  }

  async useCredits(customerId, amount) {
    return await db.transaction(async (client) => {
      const credits = await client.query(
        `SELECT * FROM billing.customer_credits
         WHERE customer_id = $1 AND status = 'active' 
           AND remaining_amount > 0
           AND (expires_at IS NULL OR expires_at > now())
         ORDER BY expires_at ASC NULLS LAST, created_at ASC
         FOR UPDATE`,
        [customerId]
      );

      let remaining = amount;
      const used = [];

      for (const credit of credits.rows) {
        if (remaining <= 0) break;

        const useAmount = Math.min(credit.remaining_amount, remaining);
        
        await client.query(
          `UPDATE billing.customer_credits 
           SET used_amount = used_amount + $1,
               status = CASE WHEN used_amount + $1 >= amount THEN 'consumed' ELSE status END
           WHERE id = $2`,
          [useAmount, credit.id]
        );

        used.push({ credit_id: credit.id, amount: useAmount });
        remaining -= useAmount;
      }

      return { used_amount: amount - remaining, remaining, credits_used: used };
    });
  }

  async checkOffers(customerId, context = {}) {
    const result = await db.query(
      `SELECT * FROM billing.offers
       WHERE active = true
         AND (valid_from IS NULL OR valid_from <= now())
         AND (valid_until IS NULL OR valid_until > now())
         AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
       ORDER BY priority DESC, created_at ASC`
    );

    const applicable = [];

    for (const offer of result.rows) {
      if (await this.checkOfferConditions(offer.conditions, customerId, context)) {
        applicable.push(offer);
      }
    }

    return applicable;
  }

  async checkOfferConditions(conditions, customerId, context) {
    if (conditions.new_customer) {
      const existing = await db.query(
        'SELECT id FROM billing.subscriptions WHERE customer_id = $1 LIMIT 1',
        [customerId]
      );
      if (existing.rows.length > 0) return false;
    }

    if (conditions.plan_type && context.plan_type !== conditions.plan_type) {
      return false;
    }

    if (conditions.billing_cycle && context.billing_cycle !== conditions.billing_cycle) {
      return false;
    }

    if (conditions.date_range) {
      const now = new Date();
      const start = new Date(conditions.date_range.start);
      const end = new Date(conditions.date_range.end);
      if (now < start || now > end) return false;
    }

    return true;
  }

  async applyOffer(offerId, customerId) {
    const offer = await db.query(
      'SELECT * FROM billing.offers WHERE id = $1 AND active = true',
      [offerId]
    );

    if (offer.rows.length === 0) {
      return { success: false, error: 'Offer not found' };
    }

    return await db.transaction(async (client) => {
      await client.query(
        'UPDATE billing.offers SET redemption_count = redemption_count + 1 WHERE id = $1',
        [offerId]
      );

      const benefits = offer.rows[0].benefits;

      if (benefits.discount_percent || benefits.discount_amount) {
        await client.query(
          `UPDATE billing.subscriptions 
           SET discount_percent = COALESCE($1, discount_percent),
               metadata = jsonb_set(
                 COALESCE(metadata, '{}'::jsonb),
                 '{applied_offers}',
                 COALESCE(metadata->'applied_offers', '[]'::jsonb) || $2::jsonb
               )
           WHERE customer_id = $3 AND status = 'active'`,
          [benefits.discount_percent, JSON.stringify([offerId]), customerId]
        );
      }

      if (benefits.referrer_credit) {
        await this.addCredit(customerId, benefits.referrer_credit, 'offer', offerId, client);
      }

      await client.query(
        'INSERT INTO billing.offer_redemptions (offer_id, customer_id, benefits_applied) VALUES ($1, $2, $3)',
        [offerId, customerId, JSON.stringify(benefits)]
      );

      return { success: true, benefits };
    });
  }

  async createReferralCode(customerId) {
    const code = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    await db.query(
      `INSERT INTO billing.referrals (referrer_id, referral_code, referrer_reward, referred_reward, referred_email)
       VALUES ($1, $2, $3, $4, '')`,
      [
        customerId,
        code,
        JSON.stringify({ credit: 2000 }),
        JSON.stringify({ discount_percent: 20, duration_months: 3 })
      ]
    );

    return code;
  }

  async updatePromoStatus(promoId, status) {
    await db.query(
      'UPDATE billing.promo_codes SET status = $1 WHERE id = $2',
      [status, promoId]
    );
  }

  async listPromoCodes(activeOnly = true) {
    const query = activeOnly
      ? 'SELECT * FROM billing.promo_codes WHERE status = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM billing.promo_codes ORDER BY created_at DESC';
    
    const result = await db.query(
      query,
      activeOnly ? ['active'] : []
    );
    return result.rows;
  }

  async createPromoCode(data) {
    const result = await db.query(
      `INSERT INTO billing.promo_codes 
       (code, name, description, type, value, max_uses, max_uses_per_customer, 
        valid_from, valid_until, plans_applicable, new_customers_only, config, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.code.toUpperCase(),
        data.name,
        data.description,
        data.type,
        data.value,
        data.max_uses,
        data.max_uses_per_customer || 1,
        data.valid_from || new Date(),
        data.valid_until,
        data.plans_applicable,
        data.new_customers_only || false,
        JSON.stringify(data.config || {}),
        data.created_by
      ]
    );
    return result.rows[0];
  }
}

export const promoEngine = new PromoEngine();
