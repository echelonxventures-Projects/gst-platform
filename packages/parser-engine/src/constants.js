export const PAGE_WIDTH = 50;

export const ROW_Y_TOLERANCE = 0.25;

export const COLUMN_GAP = 2.50;

export const MIN_COLUMN_WIDTH = 2.0;

export const SERIAL_REGEX =
  /^\d+\./;

export const HSN_REGEX =
  /^\d{4}\s+[A-Za-z]/;

export const EMPTY_REGEX =
  /^\d+\.\s*$/;

export const CONTINUATION_END =
  /\b(and|or|of|the|with|for|to|in|whether|other)\s*$/i;

export const CONTINUATION_START =
  /^(and|or|of|the|with|for|to|in|including|other|than)\b/i;

export const OUTPUT_DIR =
  'storage/structured';

export const INPUT_FILE =
  'storage/normalized/gst_schedule_goods.json';

export const OUTPUT_FILE =
  'storage/structured/schedule_entries_v3.json';

export const SUMMARY_FILE =
  'storage/structured/schedule_summary_v3.json';

export const VALIDATION_FILE =
  'storage/structured/schedule_validation_v3.json';
