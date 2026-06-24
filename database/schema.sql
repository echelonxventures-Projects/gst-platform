
CREATE TABLE registry.modules
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source.sources
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    priority INTEGER DEFAULT 100,
    enabled BOOLEAN DEFAULT TRUE,
    configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source.fetch_history
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID,
    checksum TEXT,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE gst.hsn_master
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code TEXT NOT NULL,
    description TEXT NOT NULL,

    cgst NUMERIC(8,2),
    sgst NUMERIC(8,2),
    igst NUMERIC(8,2),

    effective_date DATE,
    notification_no TEXT,

    source_id UUID,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hsn_code
ON gst.hsn_master(hsn_code);

CREATE TABLE gst.hsn_history
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code TEXT NOT NULL,
    old_record JSONB,
    new_record JSONB,
    change_type TEXT,
    detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gst.state_rules
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code TEXT,
    state_name TEXT,
    rule_type TEXT,
    rule_data JSONB,
    effective_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event.event_store
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type TEXT,
    aggregate_id TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

