-- API Key Management Schema

CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE billing.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE billing.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual', 'one_time')),
    limits JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    overage_config JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE billing.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    plan_id UUID REFERENCES billing.plans(id),
    name TEXT,
    custom_limits JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_keys_customer ON billing.api_keys(customer_id);
CREATE INDEX idx_api_keys_hash ON billing.api_keys(key_hash);

CREATE TABLE billing.api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES billing.api_keys(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_usage_key ON billing.api_usage(api_key_id, timestamp);
CREATE INDEX idx_api_usage_customer ON billing.api_usage(customer_id, timestamp);

CREATE TABLE billing.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES billing.plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing', 'past_due')),
    custom_pricing NUMERIC(10,2),
    custom_limits JSONB DEFAULT '{}'::jsonb,
    custom_features JSONB DEFAULT '{}'::jsonb,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    trial_end DATE,
    cancel_at DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE billing.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES billing.subscriptions(id),
    invoice_number TEXT UNIQUE NOT NULL,
    base_amount NUMERIC(10,2) NOT NULL,
    overage_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    line_items JSONB DEFAULT '[]'::jsonb,
    usage_summary JSONB DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    due_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE billing.usage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    quota_type TEXT NOT NULL,
    limit_value INTEGER NOT NULL,
    used_value INTEGER DEFAULT 0,
    reset_period TEXT NOT NULL CHECK (reset_period IN ('hourly', 'daily', 'monthly', 'annual', 'never')),
    last_reset TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(customer_id, quota_type)
);

CREATE INDEX idx_usage_quotas_customer ON billing.usage_quotas(customer_id);

CREATE TABLE billing.overage_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES billing.invoices(id),
    charge_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE billing.custom_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES billing.customers(id) ON DELETE CASCADE,
    config_type TEXT NOT NULL,
    config_data JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(customer_id, config_type)
);

-- Seed default plans with comprehensive limits
INSERT INTO billing.plans (code, name, description, base_price, billing_cycle, limits, features, overage_config) VALUES
(
    'free',
    'Free Tier',
    'For testing and development',
    0,
    'monthly',
    '{
        "requests_per_hour": 100,
        "requests_per_day": 1000,
        "requests_per_month": 10000,
        "concurrent_requests": 5,
        "burst_limit": 120,
        "rate_limit_window": 3600,
        "max_api_keys": 1
    }'::jsonb,
    '{
        "basic_support": true,
        "email_support": false,
        "phone_support": false,
        "webhooks": false,
        "custom_integration": false,
        "sla": null,
        "data_export": false,
        "analytics_retention_days": 7
    }'::jsonb,
    '{
        "enabled": false
    }'::jsonb
),
(
    'starter',
    'Starter',
    'For small businesses',
    999,
    'monthly',
    '{
        "requests_per_hour": 1000,
        "requests_per_day": 100000,
        "requests_per_month": 1000000,
        "concurrent_requests": 20,
        "burst_limit": 1500,
        "rate_limit_window": 3600,
        "max_api_keys": 5
    }'::jsonb,
    '{
        "basic_support": true,
        "email_support": true,
        "phone_support": false,
        "webhooks": false,
        "custom_integration": false,
        "sla": null,
        "data_export": true,
        "analytics_retention_days": 30
    }'::jsonb,
    '{
        "enabled": true,
        "per_request": 0.01,
        "min_charge": 100,
        "free_overage": 10000
    }'::jsonb
),
(
    'professional',
    'Professional',
    'For growing e-commerce',
    4999,
    'monthly',
    '{
        "requests_per_hour": 5000,
        "requests_per_day": 500000,
        "requests_per_month": 10000000,
        "concurrent_requests": 100,
        "burst_limit": 7500,
        "rate_limit_window": 3600,
        "max_api_keys": 20
    }'::jsonb,
    '{
        "basic_support": true,
        "email_support": true,
        "phone_support": true,
        "webhooks": true,
        "custom_integration": true,
        "sla": "99.5%",
        "data_export": true,
        "analytics_retention_days": 90,
        "priority_support": true,
        "webhook_retry": 3
    }'::jsonb,
    '{
        "enabled": true,
        "per_request": 0.005,
        "min_charge": 0,
        "free_overage": 100000
    }'::jsonb
),
(
    'enterprise',
    'Enterprise',
    'For large platforms',
    19999,
    'monthly',
    '{
        "requests_per_hour": 20000,
        "requests_per_day": -1,
        "requests_per_month": -1,
        "concurrent_requests": 500,
        "burst_limit": 30000,
        "rate_limit_window": 3600,
        "max_api_keys": -1
    }'::jsonb,
    '{
        "basic_support": true,
        "email_support": true,
        "phone_support": true,
        "webhooks": true,
        "custom_integration": true,
        "sla": "99.9%",
        "data_export": true,
        "analytics_retention_days": 365,
        "priority_support": true,
        "dedicated_account_manager": true,
        "custom_contract": true,
        "webhook_retry": 5,
        "white_label": true
    }'::jsonb,
    '{
        "enabled": true,
        "per_request": 0.001,
        "min_charge": 0,
        "free_overage": 1000000,
        "negotiable": true
    }'::jsonb
)
ON CONFLICT (code) DO NOTHING;
