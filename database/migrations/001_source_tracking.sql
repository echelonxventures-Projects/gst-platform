
CREATE TABLE IF NOT EXISTS source.document_registry
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_code TEXT,
    document_code TEXT,
    document_url TEXT,
    latest_checksum TEXT,
    last_checked TIMESTAMPTZ,
    last_changed TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE
);

