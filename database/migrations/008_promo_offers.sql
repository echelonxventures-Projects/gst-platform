-- Promo Codes and Offers System

CREATE TABLE billing.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_tier', 'plan_upgrade', 'credit', 'trial_extension', 'feature_unlock')),
    value NUMERIC(10,2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    max_uses_per_customer INTEGER DEFAULT 1,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    plans_applicable TEXT[], -- null = all plans
    new_customers_only BOOLEAN DEFAULT false,
    minimum_commitment_months INTEGER,
    stackable BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'depleted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT
);

CREATE INDEX idx_promo_codes_code ON billing.promo_codes(code) WHERE status = 'active';
CREATE INDEX idx_promo_codes_valid ON billing.promo_codes(valid_from, valid_until) WHERE status = 'active';

CREATE TABLE billing.promo_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID REFERENCES billing.promo_codes(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES billing.subscriptions(id),
    discount_amount NUMERIC(10,2),
    credits_applied NUMERIC(10,2),
    benefits JSONB DEFAULT '{}'::jsonb,
    redeemed_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'consumed')),
    UNIQUE(promo_code_id, customer_id)
);

CREATE INDEX idx_promo_redemptions_customer ON billing.promo_redemptions(customer_id);

CREATE TABLE billing.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('signup', 'upgrade', 'referral', 'seasonal', 'flash', 'loyalty', 'winback', 'bundle')),
    conditions JSONB NOT NULL,
    benefits JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    auto_apply BOOLEAN DEFAULT false,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    max_redemptions INTEGER,
    redemption_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_offers_type ON billing.offers(offer_type) WHERE active = true;
CREATE INDEX idx_offers_valid ON billing.offers(valid_from, valid_until) WHERE active = true;

CREATE TABLE billing.offer_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES billing.offers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    benefits_applied JSONB,
    redeemed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE billing.customer_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    source TEXT NOT NULL,
    source_id UUID,
    expires_at TIMESTAMPTZ,
    used_amount NUMERIC(10,2) DEFAULT 0,
    remaining_amount NUMERIC(10,2) GENERATED ALWAYS AS (amount - used_amount) STORED,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'consumed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_credits_customer ON billing.customer_credits(customer_id) WHERE status = 'active';

CREATE TABLE billing.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    referred_id UUID REFERENCES billing.customers(id),
    referral_code TEXT UNIQUE NOT NULL,
    referrer_reward JSONB,
    referred_reward JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded', 'expired')),
    converted_at TIMESTAMPTZ,
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON billing.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON billing.referrals(referral_code);

-- Sample promo codes
INSERT INTO billing.promo_codes (code, name, description, type, value, max_uses, valid_until, config) VALUES
(
    'LAUNCH50',
    'Launch Offer',
    '50% off first 3 months',
    'percentage',
    50,
    1000,
    now() + interval '30 days',
    '{"duration_months": 3, "applies_to": "base_price"}'::jsonb
),
(
    'FREEMONTH',
    'Free First Month',
    'Get first month free',
    'fixed_amount',
    4999,
    500,
    now() + interval '60 days',
    '{"duration_months": 1}'::jsonb
),
(
    'STARTUP100',
    'Startup Credit',
    '₹10,000 credits for startups',
    'credit',
    10000,
    100,
    now() + interval '90 days',
    '{"credit_expiry_months": 12}'::jsonb
),
(
    'TRIAL30',
    'Extended Trial',
    '30-day trial extension',
    'trial_extension',
    30,
    null,
    now() + interval '180 days',
    '{}'::jsonb
);

-- Sample offers
INSERT INTO billing.offers (name, description, offer_type, conditions, benefits, auto_apply) VALUES
(
    'First Time Signup Bonus',
    'Get 20% off on any paid plan',
    'signup',
    '{"new_customer": true, "plan_type": "paid"}'::jsonb,
    '{"discount_percent": 20, "duration_months": 1}'::jsonb,
    true
),
(
    'Annual Plan Discount',
    'Save 20% with annual billing',
    'upgrade',
    '{"billing_cycle": "annual"}'::jsonb,
    '{"discount_percent": 20, "permanent": true}'::jsonb,
    true
),
(
    'Black Friday Sale',
    '40% off all plans',
    'seasonal',
    '{"date_range": {"start": "2026-11-25", "end": "2026-11-30"}}'::jsonb,
    '{"discount_percent": 40, "duration_months": 12}'::jsonb,
    false
),
(
    'Referral Reward',
    'Both get ₹2,000 credits',
    'referral',
    '{"referred_signup": true}'::jsonb,
    '{"referrer_credit": 2000, "referred_credit": 2000}'::jsonb,
    true
);