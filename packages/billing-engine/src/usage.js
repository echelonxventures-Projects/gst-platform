import { db } from '@gst-platform/core/db';

export class UsageTracker {
  async track(keyId, customerId, endpoint, method, statusCode, responseTime) {
    await db.query(
      `INSERT INTO billing.api_usage 
       (api_key_id, customer_id, endpoint, method, status_code, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [keyId, customerId, endpoint, method, statusCode, responseTime]
    );
  }

  async getUsage(customerId, startDate, endDate) {
    const result = await db.query(
      `SELECT 
         DATE(timestamp) as date,
         COUNT(*) as requests,
         AVG(response_time_ms) as avg_response_time,
         COUNT(DISTINCT endpoint) as unique_endpoints
       FROM billing.api_usage
       WHERE customer_id = $1
         AND timestamp BETWEEN $2 AND $3
       GROUP BY DATE(timestamp)
       ORDER BY date DESC`,
      [customerId, startDate, endDate]
    );
    return result.rows;
  }

  async getCurrentMonthUsage(customerId) {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(DISTINCT api_key_id) as active_keys,
         AVG(response_time_ms) as avg_response_time
       FROM billing.api_usage
       WHERE customer_id = $1
         AND timestamp >= date_trunc('month', CURRENT_DATE)`,
      [customerId]
    );
    return result.rows[0];
  }

  async getTopEndpoints(customerId, limit = 10) {
    const result = await db.query(
      `SELECT 
         endpoint,
         COUNT(*) as requests,
         AVG(response_time_ms) as avg_response_time
       FROM billing.api_usage
       WHERE customer_id = $1
         AND timestamp >= CURRENT_DATE - interval '30 days'
       GROUP BY endpoint
       ORDER BY requests DESC
       LIMIT $2`,
      [customerId, limit]
    );
    return result.rows;
  }
}

export const usageTracker = new UsageTracker();
