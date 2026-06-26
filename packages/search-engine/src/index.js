import { db } from '@gst-platform/core/db';

export class SearchEngine {
  async search(query, options = {}) {
    const limit = options.limit || 20;
    const types = options.types || ['hsn', 'notification'];
    
    const results = {
      hsn: [],
      notifications: [],
      total: 0
    };

    if (types.includes('hsn')) {
      results.hsn = await this.searchHSN(query, limit);
    }

    if (types.includes('notification')) {
      results.notifications = await this.searchNotifications(query, limit);
    }

    results.total = results.hsn.length + results.notifications.length;
    
    return results;
  }

  async searchHSN(query, limit = 20) {
    const isNumeric = /^\d+$/.test(query.trim());

    if (isNumeric) {
      const result = await db.query(
        `SELECT hsn_code, description, cgst, sgst, igst, cess, 
                'exact' as match_type, 1.0 as score
         FROM gst.hsn_master
         WHERE active = true AND hsn_code ILIKE $1
         ORDER BY hsn_code
         LIMIT $2`,
        [`${query}%`, limit]
      );
      return result.rows;
    }

    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess,
              'fulltext' as match_type,
              ts_rank(to_tsvector('english', description), plainto_tsquery('english', $1)) as score
       FROM gst.hsn_master
       WHERE active = true 
         AND to_tsvector('english', description) @@ plainto_tsquery('english', $1)
       ORDER BY score DESC, hsn_code
       LIMIT $2`,
      [query, limit]
    );

    if (result.rows.length === 0) {
      const fuzzyResult = await db.query(
        `SELECT hsn_code, description, cgst, sgst, igst, cess,
                'fuzzy' as match_type, 0.5 as score
         FROM gst.hsn_master
         WHERE active = true AND description ILIKE $1
         ORDER BY hsn_code
         LIMIT $2`,
        [`%${query}%`, limit]
      );
      return fuzzyResult.rows;
    }

    return result.rows;
  }

  async searchNotifications(query, limit = 20) {
    const result = await db.query(
      `SELECT notification_no, notification_date, title, category, url
       FROM gst.notifications
       WHERE notification_no ILIKE $1 
          OR title ILIKE $1 
          OR content ILIKE $1
       ORDER BY notification_date DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  async searchByRate(rate, limit = 50) {
    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess
       FROM gst.hsn_master
       WHERE active = true AND igst = $1
       ORDER BY hsn_code
       LIMIT $2`,
      [rate, limit]
    );
    return result.rows;
  }

  async fuzzySearch(query, limit = 20) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words.length === 0) {
      return [];
    }

    const conditions = words.map((_, i) => `description ILIKE $${i + 1}`).join(' OR ');
    const params = [...words.map(w => `%${w}%`), limit];

    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess
       FROM gst.hsn_master
       WHERE active = true AND (${conditions})
       ORDER BY hsn_code
       LIMIT $${words.length + 1}`,
      params
    );
    return result.rows;
  }

  async suggest(prefix, limit = 10) {
    const isNumeric = /^\d+$/.test(prefix.trim());

    if (isNumeric) {
      const result = await db.query(
        `SELECT DISTINCT hsn_code, description
         FROM gst.hsn_master
         WHERE active = true AND hsn_code LIKE $1
         ORDER BY hsn_code
         LIMIT $2`,
        [`${prefix}%`, limit]
      );
      return result.rows;
    }

    const result = await db.query(
      `SELECT DISTINCT hsn_code, description
       FROM gst.hsn_master
       WHERE active = true AND description ILIKE $1
       ORDER BY hsn_code
       LIMIT $2`,
      [`${prefix}%`, limit]
    );
    return result.rows;
  }
}

export const searchEngine = new SearchEngine();
