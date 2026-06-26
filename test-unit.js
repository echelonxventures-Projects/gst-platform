#!/usr/bin/env node

console.log('=== GST Platform Unit Tests ===\n');

const tests = [];
const results = { passed: 0, failed: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      results.passed++;
    } catch (err) {
      console.log(`✗ ${name}`);
      console.log(`  ${err.message}`);
      results.failed++;
    }
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total: ${tests.length}`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Mock database
const mockDb = {
  transactions: [],
  query: async (sql, params) => {
    mockDb.transactions.push({ sql, params });
    
    if (sql.includes('SELECT pc.*')) {
      return {
        rows: [{
          id: 'promo-1',
          code: 'TEST50',
          type: 'percentage',
          value: 50,
          status: 'active',
          used_count: 0,
          max_uses: 100,
          max_uses_per_customer: 1,
          customer_redemptions: 0,
          config: { duration_months: 3 }
        }]
      };
    }
    
    if (sql.includes('INSERT INTO billing.promo_codes')) {
      return {
        rows: [{
          id: 'new-promo',
          code: params[0],
          name: params[1],
          type: params[3],
          value: params[4]
        }]
      };
    }
    
    if (sql.includes('UPDATE billing.promo_codes')) {
      return { rows: [] };
    }
    
    if (sql.includes('INSERT INTO billing.promo_redemptions')) {
      return {
        rows: [{
          id: 'redemption-1',
          promo_code_id: 'promo-1',
          customer_id: params[1],
          discount_amount: 50,
          benefits: JSON.parse(params[5])
        }]
      };
    }
    
    if (sql.includes('SELECT * FROM billing.offers')) {
      return { rows: [] };
    }
    
    if (sql.includes('SUM(remaining_amount)')) {
      return { rows: [{ total_credits: '5000' }] };
    }
    
    return { rows: [] };
  },
  transaction: async (fn) => {
    return await fn(mockDb);
  }
};

// Test PromoEngine
test('PromoEngine: validates valid promo code', async () => {
  const PromoEngine = (await import('./packages/billing-engine/src/promo.js')).PromoEngine;
  
  // Mock db
  const originalDb = global.db;
  global.db = mockDb;
  
  const engine = new PromoEngine();
  const result = await engine.validatePromoCode('TEST50', 'customer-1', 'professional');
  
  global.db = originalDb;
  
  if (!result.valid) throw new Error('Expected valid promo code');
  if (result.promo.value !== 50) throw new Error('Expected 50% discount');
});

test('PromoEngine: creates promo code', async () => {
  const PromoEngine = (await import('./packages/billing-engine/src/promo.js')).PromoEngine;
  
  global.db = mockDb;
  
  const engine = new PromoEngine();
  const promo = await engine.createPromoCode({
    code: 'NEW50',
    name: 'New Promo',
    description: 'Test',
    type: 'percentage',
    value: 50,
    max_uses: 100,
    config: { duration_months: 3 }
  });
  
  if (promo.code !== 'NEW50') throw new Error('Expected code NEW50');
  if (promo.value !== 50) throw new Error('Expected value 50');
});

test('PromoEngine: redeems promo code', async () => {
  const PromoEngine = (await import('./packages/billing-engine/src/promo.js')).PromoEngine;
  
  global.db = mockDb;
  
  const engine = new PromoEngine();
  const result = await engine.redeemPromoCode('TEST50', 'customer-1', 'sub-1');
  
  if (!result.success) throw new Error('Expected successful redemption');
  if (result.benefits.discount_percent !== 50) throw new Error('Expected 50% discount benefit');
});

test('PromoEngine: checks customer credits', async () => {
  const PromoEngine = (await import('./packages/billing-engine/src/promo.js')).PromoEngine;
  
  global.db = mockDb;
  
  const engine = new PromoEngine();
  const credits = await engine.getCustomerCredits('customer-1');
  
  if (credits !== 5000) throw new Error(`Expected 5000 credits, got ${credits}`);
});

test('Config: loads environment variables', async () => {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  
  const config = (await import('./packages/core/src/config.js')).config;
  
  if (config.db.host !== 'localhost') throw new Error('Expected host localhost');
  if (config.db.port !== 5432) throw new Error('Expected port 5432');
});

test('Validators: validates email', async () => {
  const validators = await import('./packages/core/src/validators.js');
  
  if (!validators.validateEmail('test@example.com')) throw new Error('Valid email rejected');
  if (validators.validateEmail('invalid')) throw new Error('Invalid email accepted');
});

test('Validators: validates HSN code', async () => {
  const validators = await import('./packages/core/src/validators.js');
  
  if (!validators.validateHSN('0901')) throw new Error('Valid HSN rejected');
  if (!validators.validateHSN('090111')) throw new Error('Valid HSN rejected');
  if (validators.validateHSN('123')) throw new Error('Invalid HSN accepted');
});

test('File structure: all key packages exist', async () => {
  const fs = await import('fs/promises');
  
  const packages = [
    'packages/core/package.json',
    'packages/billing-engine/package.json',
    'packages/registry-engine/package.json',
    'packages/change-engine/package.json',
    'packages/event-engine/package.json',
    'packages/source-engine/package.json',
    'packages/parser-engine/package.json',
    'packages/workflow-engine/package.json',
    'packages/gst-module/package.json',
    'packages/search-engine/package.json'
  ];
  
  for (const pkg of packages) {
    try {
      await fs.access(pkg);
    } catch {
      throw new Error(`Package not found: ${pkg}`);
    }
  }
});

test('File structure: all apps exist', async () => {
  const fs = await import('fs/promises');
  
  const apps = [
    'apps/api/src/index.js',
    'apps/worker/src/index.js',
    'apps/admin/src/index.js'
  ];
  
  for (const app of apps) {
    try {
      await fs.access(app);
    } catch {
      throw new Error(`App not found: ${app}`);
    }
  }
});

test('File structure: database files exist', async () => {
  const fs = await import('fs/promises');
  
  const files = [
    'database/schema.sql',
    'database/seed.sql',
    'database/migrations/007_api_keys.sql',
    'database/migrations/008_promo_offers.sql'
  ];
  
  for (const file of files) {
    try {
      await fs.access(file);
    } catch {
      throw new Error(`File not found: ${file}`);
    }
  }
});

test('SQL: promo_codes table has correct columns', async () => {
  const fs = await import('fs/promises');
  const sql = await fs.readFile('database/migrations/008_promo_offers.sql', 'utf-8');
  
  const required = ['code', 'name', 'type', 'value', 'max_uses', 'config', 'status'];
  for (const col of required) {
    if (!sql.includes(col)) throw new Error(`Missing column: ${col}`);
  }
});

test('SQL: all promo types defined', async () => {
  const fs = await import('fs/promises');
  const sql = await fs.readFile('database/migrations/008_promo_offers.sql', 'utf-8');
  
  const types = ['percentage', 'fixed_amount', 'credit', 'trial_extension', 'feature_unlock'];
  for (const type of types) {
    if (!sql.includes(type)) throw new Error(`Missing promo type: ${type}`);
  }
});

run();
