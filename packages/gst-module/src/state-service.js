import { db } from '@gst-platform/core/db';

export class StateService {
  async getByStateCode(stateCode) {
    const result = await db.query(
      `SELECT * FROM gst.state_rules 
       WHERE state_code = $1 AND active = true
       ORDER BY effective_date DESC`,
      [stateCode]
    );
    return result.rows;
  }

  async list() {
    const result = await db.query(
      `SELECT DISTINCT state_code, state_name 
       FROM gst.state_rules 
       WHERE active = true
       ORDER BY state_name`
    );
    return result.rows;
  }

  async create(data) {
    const result = await db.query(
      `INSERT INTO gst.state_rules 
       (state_code, state_name, rule_type, rule_data, effective_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.state_code,
        data.state_name,
        data.rule_type,
        JSON.stringify(data.rule_data),
        data.effective_date
      ]
    );
    return result.rows[0];
  }

  async deactivate(id) {
    await db.query(
      `UPDATE gst.state_rules SET active = false WHERE id = $1`,
      [id]
    );
  }
}

export const stateService = new StateService();
