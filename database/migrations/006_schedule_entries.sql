CREATE TABLE IF NOT EXISTS gst.schedule_entries
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    chapter_code TEXT,

    rate NUMERIC(8,2),

    description TEXT,

    source_document TEXT,

    source_checksum TEXT,

    effective_date DATE,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gst.schedule_entry_hsns
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entry_id UUID
        REFERENCES gst.schedule_entries(id),

    hsn_code TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);
