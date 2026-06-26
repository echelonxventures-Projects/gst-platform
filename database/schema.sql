-- Registry Schema
CREATE TABLE registry.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE registry.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    configuration JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Source Schema
CREATE TABLE source.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    priority INTEGER DEFAULT 100,
    enabled BOOLEAN DEFAULT TRUE,
    configuration JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source.document_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_code TEXT NOT NULL,
    document_code TEXT UNIQUE NOT NULL,
    document_url TEXT NOT NULL,
    latest_checksum TEXT,
    last_checked TIMESTAMPTZ,
    last_changed TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE source.fetch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES source.sources(id),
    document_code TEXT,
    checksum TEXT,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- GST Schema
CREATE TABLE gst.hsn_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code TEXT NOT NULL,
    description TEXT NOT NULL,
    cgst NUMERIC(8,2),
    sgst NUMERIC(8,2),
    igst NUMERIC(8,2),
    cess NUMERIC(8,2),
    effective_date DATE,
    notification_no TEXT,
    source_id UUID REFERENCES source.sources(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hsn_code ON gst.hsn_master(hsn_code);
CREATE INDEX idx_hsn_active ON gst.hsn_master(active) WHERE active = TRUE;
CREATE INDEX idx_hsn_description ON gst.hsn_master USING gin(to_tsvector('english', description));

CREATE TABLE gst.hsn_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code TEXT NOT NULL,
    old_record JSONB,
    new_record JSONB,
    change_type TEXT,
    detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gst.sac_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sac_code TEXT NOT NULL,
    description TEXT NOT NULL,
    cgst NUMERIC(8,2),
    sgst NUMERIC(8,2),
    igst NUMERIC(8,2),
    effective_date DATE,
    notification_no TEXT,
    source_id UUID REFERENCES source.sources(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sac_code ON gst.sac_master(sac_code);
CREATE INDEX idx_sac_active ON gst.sac_master(active) WHERE active = TRUE;

CREATE TABLE gst.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_no TEXT UNIQUE NOT NULL,
    notification_date DATE,
    title TEXT,
    content TEXT,
    category TEXT,
    url TEXT,
    effective_date DATE,
    source_id UUID REFERENCES source.sources(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_no ON gst.notifications(notification_no);
CREATE INDEX idx_notification_date ON gst.notifications(notification_date);

CREATE TABLE gst.state_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    rule_data JSONB NOT NULL,
    effective_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_state_code ON gst.state_rules(state_code);

-- Event Schema
CREATE TABLE event.event_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_aggregate ON event.event_store(aggregate_type, aggregate_id);
CREATE INDEX idx_event_type ON event.event_store(event_type);

-- Workflow Schema
CREATE TABLE workflow.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    job_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_job_status ON workflow.jobs(status);

-- Audit Schema
CREATE TABLE audit.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    changes JSONB,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit.audit_log(entity_type, entity_id);
