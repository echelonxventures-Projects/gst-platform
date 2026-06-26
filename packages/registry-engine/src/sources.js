import { db } from '@gst-platform/core/db';

export class SourceRegistry {
  async list(enabledOnly = false) {
    const query = enabledOnly
      ? 'SELECT * FROM source.sources WHERE enabled = true ORDER BY priority DESC, code'
      : 'SELECT * FROM source.sources ORDER BY priority DESC, code';
    const result = await db.query(query);
    return result.rows;
  }

  async get(code) {
    const result = await db.query(
      'SELECT * FROM source.sources WHERE code = $1',
      [code]
    );
    return result.rows[0];
  }

  async getById(id) {
    const result = await db.query(
      'SELECT * FROM source.sources WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async register(code, name, url, type, configuration = {}, priority = 100) {
    const result = await db.query(
      `INSERT INTO source.sources (code, name, url, type, configuration, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, url = EXCLUDED.url, type = EXCLUDED.type,
           configuration = EXCLUDED.configuration, priority = EXCLUDED.priority
       RETURNING *`,
      [code, name, url, type, JSON.stringify(configuration), priority]
    );
    return result.rows[0];
  }

  async enable(code) {
    await db.query(
      'UPDATE source.sources SET enabled = true WHERE code = $1',
      [code]
    );
  }

  async disable(code) {
    await db.query(
      'UPDATE source.sources SET enabled = false WHERE code = $1',
      [code]
    );
  }

  async updateConfig(code, configuration) {
    await db.query(
      'UPDATE source.sources SET configuration = $1 WHERE code = $2',
      [JSON.stringify(configuration), code]
    );
  }
}

export const sourceRegistry = new SourceRegistry();
