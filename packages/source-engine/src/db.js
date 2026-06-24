import pg from 'pg';

export const db = new pg.Pool({
  database: 'gst_platform'
});
