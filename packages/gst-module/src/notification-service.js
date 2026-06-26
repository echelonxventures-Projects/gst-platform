import { db } from '@gst-platform/core/db';

export class NotificationService {
  async getByNumber(notificationNo) {
    const result = await db.query(
      `SELECT * FROM gst.notifications WHERE notification_no = $1`,
      [notificationNo]
    );
    return result.rows[0];
  }

  async list(limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT * FROM gst.notifications 
       ORDER BY notification_date DESC, notification_no DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async search(query, limit = 20) {
    const result = await db.query(
      `SELECT * FROM gst.notifications
       WHERE notification_no ILIKE $1 OR title ILIKE $1 OR content ILIKE $1
       ORDER BY notification_date DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  async getByDateRange(startDate, endDate) {
    const result = await db.query(
      `SELECT * FROM gst.notifications
       WHERE notification_date BETWEEN $1 AND $2
       ORDER BY notification_date DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  async create(data) {
    const result = await db.query(
      `INSERT INTO gst.notifications 
       (notification_no, notification_date, title, content, category, url, effective_date, source_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (notification_no) DO UPDATE
       SET title = EXCLUDED.title, content = EXCLUDED.content, category = EXCLUDED.category
       RETURNING *`,
      [
        data.notification_no,
        data.notification_date,
        data.title,
        data.content,
        data.category,
        data.url,
        data.effective_date,
        data.source_id
      ]
    );
    return result.rows[0];
  }
}

export const notificationService = new NotificationService();
