import crypto from 'crypto';
import { db } from '@gst-platform/core/db';

export class ChangeDetector {
  calculateChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async hasChanged(documentCode, currentChecksum) {
    const result = await db.query(
      'SELECT latest_checksum FROM source.document_registry WHERE document_code = $1',
      [documentCode]
    );

    if (result.rows.length === 0) {
      return { changed: true, reason: 'new_document' };
    }

    const lastChecksum = result.rows[0].latest_checksum;
    
    if (lastChecksum !== currentChecksum) {
      return { changed: true, reason: 'content_changed', lastChecksum };
    }

    return { changed: false, reason: 'no_change' };
  }

  async recordCheck(documentCode, checksum, status) {
    await db.query(
      `INSERT INTO source.fetch_history (document_code, checksum, status)
       VALUES ($1, $2, $3)`,
      [documentCode, checksum, status]
    );
  }

  async updateRegistry(sourceCode, documentCode, documentUrl, checksum) {
    await db.query(
      `INSERT INTO source.document_registry 
       (source_code, document_code, document_url, latest_checksum, last_checked, last_changed)
       VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (document_code) DO UPDATE
       SET document_url = EXCLUDED.document_url,
           latest_checksum = EXCLUDED.latest_checksum,
           last_checked = now(),
           last_changed = now()`,
      [sourceCode, documentCode, documentUrl, checksum]
    );
  }

  async getHistory(documentCode, limit = 10) {
    const result = await db.query(
      `SELECT * FROM source.fetch_history 
       WHERE document_code = $1 
       ORDER BY fetched_at DESC 
       LIMIT $2`,
      [documentCode, limit]
    );
    return result.rows;
  }

  async detectHSNChanges(oldData, newData) {
    const changes = [];

    const oldMap = new Map(oldData.map(row => [row.hsn_code, row]));
    const newMap = new Map(newData.map(row => [row.hsn_code, row]));

    for (const [hsnCode, newRecord] of newMap) {
      const oldRecord = oldMap.get(hsnCode);
      
      if (!oldRecord) {
        changes.push({ type: 'added', hsnCode, newRecord });
      } else if (JSON.stringify(oldRecord) !== JSON.stringify(newRecord)) {
        changes.push({ type: 'modified', hsnCode, oldRecord, newRecord });
      }
    }

    for (const [hsnCode, oldRecord] of oldMap) {
      if (!newMap.has(hsnCode)) {
        changes.push({ type: 'removed', hsnCode, oldRecord });
      }
    }

    return changes;
  }

  async recordHSNChange(hsnCode, oldRecord, newRecord, changeType) {
    await db.query(
      `INSERT INTO gst.hsn_history (hsn_code, old_record, new_record, change_type)
       VALUES ($1, $2, $3, $4)`,
      [hsnCode, JSON.stringify(oldRecord), JSON.stringify(newRecord), changeType]
    );
  }
}

export const changeDetector = new ChangeDetector();
