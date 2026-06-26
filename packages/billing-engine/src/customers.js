import { db } from '@gst-platform/core/db';

export class CustomerService {
  async create(email, companyName, contactPerson, phone, address) {
    const result = await db.query(
      `INSERT INTO billing.customers 
       (email, company_name, contact_person, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, companyName, contactPerson, phone, address]
    );
    return result.rows[0];
  }

  async get(customerId) {
    const result = await db.query(
      'SELECT * FROM billing.customers WHERE id = $1',
      [customerId]
    );
    return result.rows[0];
  }

  async getByEmail(email) {
    const result = await db.query(
      'SELECT * FROM billing.customers WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  async list(limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT c.*, 
              COUNT(DISTINCT k.id) as api_keys_count,
              COUNT(DISTINCT s.id) as subscriptions_count
       FROM billing.customers c
       LEFT JOIN billing.api_keys k ON c.id = k.customer_id
       LEFT JOIN billing.subscriptions s ON c.id = s.customer_id
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async suspend(customerId) {
    await db.query(
      'UPDATE billing.customers SET status = $1, updated_at = now() WHERE id = $2',
      ['suspended', customerId]
    );
  }

  async activate(customerId) {
    await db.query(
      'UPDATE billing.customers SET status = $1, updated_at = now() WHERE id = $2',
      ['active', customerId]
    );
  }

  async getPlans() {
    const result = await db.query(
      'SELECT * FROM billing.plans WHERE active = true ORDER BY monthly_price'
    );
    return result.rows;
  }
}

export const customerService = new CustomerService();
