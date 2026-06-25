
ALTER TABLE gst.hsn_master
ADD COLUMN IF NOT EXISTS chapter_code TEXT;

ALTER TABLE gst.hsn_master
ADD COLUMN IF NOT EXISTS source_checksum TEXT;

ALTER TABLE gst.hsn_master
ADD COLUMN IF NOT EXISTS source_document TEXT;

ALTER TABLE gst.hsn_master
ADD COLUMN IF NOT EXISTS metadata JSONB
DEFAULT '{}'::jsonb;

