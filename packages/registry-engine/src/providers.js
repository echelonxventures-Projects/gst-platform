import { db } from '@gst-platform/core/db';

export class ProviderRegistry {
  async list(enabledOnly = false) {
    const query = enabledOnly
      ? 'SELECT * FROM registry.providers WHERE enabled = true ORDER BY code'
      : 'SELECT * FROM registry.providers ORDER BY code';
    const result = await db.query(query);
    return result.rows;
  }

  async get(code) {
    const result = await db.query(
      'SELECT * FROM registry.providers WHERE code = $1',
      [code]
    );
    return result.rows[0];
  }

  async register(code, name, type, configuration = {}) {
    const result = await db.query(
      `INSERT INTO registry.providers (code, name, type, configuration)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, type = EXCLUDED.type, configuration = EXCLUDED.configuration
       RETURNING *`,
      [code, name, type, JSON.stringify(configuration)]
    );
    return result.rows[0];
  }

  async enable(code) {
    await db.query(
      'UPDATE registry.providers SET enabled = true WHERE code = $1',
      [code]
    );
  }

  async disable(code) {
    await db.query(
      'UPDATE registry.providers SET enabled = false WHERE code = $1',
      [code]
    );
  }
}

export const providerRegistry = new ProviderRegistry();
