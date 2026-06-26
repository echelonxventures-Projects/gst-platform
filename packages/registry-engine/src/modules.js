import { db } from '@gst-platform/core/db';

export class ModuleRegistry {
  async list(enabledOnly = false) {
    const query = enabledOnly
      ? 'SELECT * FROM registry.modules WHERE enabled = true ORDER BY code'
      : 'SELECT * FROM registry.modules ORDER BY code';
    const result = await db.query(query);
    return result.rows;
  }

  async get(code) {
    const result = await db.query(
      'SELECT * FROM registry.modules WHERE code = $1',
      [code]
    );
    return result.rows[0];
  }

  async isEnabled(code) {
    const module = await this.get(code);
    return module?.enabled || false;
  }

  async enable(code) {
    await db.query(
      'UPDATE registry.modules SET enabled = true, updated_at = now() WHERE code = $1',
      [code]
    );
  }

  async disable(code) {
    await db.query(
      'UPDATE registry.modules SET enabled = false, updated_at = now() WHERE code = $1',
      [code]
    );
  }

  async updateConfig(code, configuration) {
    await db.query(
      'UPDATE registry.modules SET configuration = $1, updated_at = now() WHERE code = $2',
      [JSON.stringify(configuration), code]
    );
  }

  async register(code, name, configuration = {}) {
    const result = await db.query(
      `INSERT INTO registry.modules (code, name, configuration)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, configuration = EXCLUDED.configuration, updated_at = now()
       RETURNING *`,
      [code, name, JSON.stringify(configuration)]
    );
    return result.rows[0];
  }
}

export const moduleRegistry = new ModuleRegistry();
