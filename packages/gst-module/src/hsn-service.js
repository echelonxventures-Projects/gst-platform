import { db } from '@gst-platform/core/db';
import { normalizeHSN } from '@gst-platform/core/validators';

export class HSNService {
  async getByCode(hsnCode) {
    const normalized = normalizeHSN(hsnCode);
    const result = await db.query(
      `SELECT * FROM gst.hsn_master 
       WHERE hsn_code = $1 AND active = true 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [normalized]
    );
    return result.rows[0];
  }

  async search(query, limit = 20) {
    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess, effective_date, notification_no
       FROM gst.hsn_master
       WHERE active = true 
         AND (hsn_code ILIKE $1 OR description ILIKE $1)
       ORDER BY hsn_code
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  async searchByDescription(description, limit = 20) {
    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess, effective_date, notification_no,
              ts_rank(to_tsvector('english', description), plainto_tsquery('english', $1)) as rank
       FROM gst.hsn_master
       WHERE active = true 
         AND to_tsvector('english', description) @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC, hsn_code
       LIMIT $2`,
      [description, limit]
    );
    return result.rows;
  }

  async getHistory(hsnCode) {
    const normalized = normalizeHSN(hsnCode);
    const result = await db.query(
      `SELECT * FROM gst.hsn_history 
       WHERE hsn_code = $1 
       ORDER BY detected_at DESC`,
      [normalized]
    );
    return result.rows;
  }

  async getAllActive(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess
       FROM gst.hsn_master
       WHERE active = true
       ORDER BY hsn_code
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async getByRate(igst) {
    const result = await db.query(
      `SELECT hsn_code, description, cgst, sgst, igst, cess
       FROM gst.hsn_master
       WHERE active = true AND igst = $1
       ORDER BY hsn_code`,
      [igst]
    );
    return result.rows;
  }

  async getStats() {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(DISTINCT igst) as unique_rates,
         MIN(igst) as min_rate,
         MAX(igst) as max_rate
       FROM gst.hsn_master
       WHERE active = true`
    );
    return result.rows[0];
  }

  async create(data) {
    const result = await db.query(
      `INSERT INTO gst.hsn_master 
       (hsn_code, description, cgst, sgst, igst, cess, effective_date, notification_no, source_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.hsn_code,
        data.description,
        data.cgst,
        data.sgst,
        data.igst,
        data.cess,
        data.effective_date,
        data.notification_no,
        data.source_id
      ]
    );
    return result.rows[0];
  }

  async update(hsnCode, data) {
    const normalized = normalizeHSN(hsnCode);
    const result = await db.query(
      `UPDATE gst.hsn_master
       SET description = COALESCE($2, description),
           cgst = COALESCE($3, cgst),
           sgst = COALESCE($4, sgst),
           igst = COALESCE($5, igst),
           cess = COALESCE($6, cess),
           updated_at = now()
       WHERE hsn_code = $1 AND active = true
       RETURNING *`,
      [normalized, data.description, data.cgst, data.sgst, data.igst, data.cess]
    );
    return result.rows[0];
  }

  async deactivate(hsnCode) {
    const normalized = normalizeHSN(hsnCode);
    await db.query(
      `UPDATE gst.hsn_master SET active = false WHERE hsn_code = $1`,
      [normalized]
    );
  }
}

export const hsnService = new HSNService();
