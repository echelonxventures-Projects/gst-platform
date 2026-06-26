#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

console.log('=== GST Platform Validation Tests ===\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    failed++;
  }
}

// Test file structure
await test('Core package exists', async () => {
  await fs.access('packages/core/package.json');
  await fs.access('packages/core/src/config.js');
  await fs.access('packages/core/src/db.js');
  await fs.access('packages/core/src/validators.js');
});

await test('Billing engine exists', async () => {
  await fs.access('packages/billing-engine/package.json');
  await fs.access('packages/billing-engine/src/auth.js');
  await fs.access('packages/billing-engine/src/usage.js');
  await fs.access('packages/billing-engine/src/customers.js');
  await fs.access('packages/billing-engine/src/promo.js');
});

await test('All required packages exist', async () => {
  const packages = [
    'registry-engine', 'change-engine', 'event-engine',
    'source-engine', 'parser-engine', 'workflow-engine',
    'gst-module', 'search-engine'
  ];
  
  for (const pkg of packages) {
    await fs.access(`packages/${pkg}/package.json`);
  }
});

await test('All apps exist', async () => {
  await fs.access('apps/api/src/index.js');
  await fs.access('apps/worker/src/index.js');
  await fs.access('apps/admin/src/index.js');
});

await test('Database schema exists', async () => {
  await fs.access('database/schema.sql');
  await fs.access('database/seed.sql');
  await fs.access('database/bootstrap.sql');
});

await test('API keys migration exists', async () => {
  const sql = await fs.readFile('database/migrations/007_api_keys.sql', 'utf-8');
  if (!sql.includes('CREATE TABLE billing.api_keys')) throw new Error('Missing api_keys table');
  if (!sql.includes('CREATE TABLE billing.customers')) throw new Error('Missing customers table');
  if (!sql.includes('CREATE TABLE billing.subscriptions')) throw new Error('Missing subscriptions table');
});

await test('Promo codes migration exists', async () => {
  const sql = await fs.readFile('database/migrations/008_promo_offers.sql', 'utf-8');
  if (!sql.includes('CREATE TABLE billing.promo_codes')) throw new Error('Missing promo_codes table');
  if (!sql.includes('CREATE TABLE billing.promo_redemptions')) throw new Error('Missing promo_redemptions table');
  if (!sql.includes('CREATE TABLE billing.customer_credits')) throw new Error('Missing customer_credits table');
  if (!sql.includes('CREATE TABLE billing.referrals')) throw new Error('Missing referrals table');
});

await test('Promo code types are complete', async () => {
  const sql = await fs.readFile('database/migrations/008_promo_offers.sql', 'utf-8');
  const types = ['percentage', 'fixed_amount', 'credit', 'trial_extension', 'feature_unlock', 'plan_upgrade'];
  for (const type of types) {
    if (!sql.includes(type)) throw new Error(`Missing promo type: ${type}`);
  }
});

await test('Offer types are complete', async () => {
  const sql = await fs.readFile('database/migrations/008_promo_offers.sql', 'utf-8');
  const types = ['signup', 'upgrade', 'referral', 'seasonal', 'flash', 'loyalty', 'winback', 'bundle'];
  for (const type of types) {
    if (!sql.includes(type)) throw new Error(`Missing offer type: ${type}`);
  }
});

await test('PromoEngine has all methods', async () => {
  const code = await fs.readFile('packages/billing-engine/src/promo.js', 'utf-8');
  const methods = [
    'validatePromoCode', 'redeemPromoCode', 'createPromoCode',
    'addCredit', 'getCustomerCredits', 'useCredits',
    'checkOffers', 'applyOffer', 'createReferralCode'
  ];
  
  for (const method of methods) {
    if (!code.includes(`async ${method}(`)) throw new Error(`Missing method: ${method}`);
  }
});

await test('Admin API has promo endpoints', async () => {
  const code = await fs.readFile('apps/admin/src/index.js', 'utf-8');
  if (!code.includes("'/api/promo-codes'")) throw new Error('Missing promo-codes endpoint');
  if (!code.includes("'/api/promo-codes/:code/validate'")) throw new Error('Missing validate endpoint');
  if (!code.includes("'/api/promo-codes/:code/redeem'")) throw new Error('Missing redeem endpoint');
  if (!code.includes("'/api/customers/:id/credits'")) throw new Error('Missing credits endpoint');
});

await test('API has authentication middleware', async () => {
  const code = await fs.readFile('apps/api/src/index.js', 'utf-8');
  if (!code.includes('x-api-key')) throw new Error('Missing API key header check');
  if (!code.includes('authenticate')) throw new Error('Missing authenticate middleware');
});

await test('Docker Compose configuration exists', async () => {
  const yaml = await fs.readFile('docker-compose.yml', 'utf-8');
  if (!yaml.includes('db:')) throw new Error('Missing db service');
  if (!yaml.includes('api:')) throw new Error('Missing api service');
  if (!yaml.includes('worker:')) throw new Error('Missing worker service');
  if (!yaml.includes('admin:')) throw new Error('Missing admin service');
});

await test('Deployment documentation exists', async () => {
  await fs.access('DEPLOYMENT.md');
  await fs.access('API_BUSINESS.md');
  await fs.access('BILLING_CONFIG.md');
  await fs.access('PROMO_OFFERS.md');
});

await test('Production deployment files exist', async () => {
  await fs.access('docker-compose.prod.yml');
  await fs.access('infrastructure/nginx/nginx.conf');
  await fs.access('deploy.sh');
  await fs.access('backup.sh');
  await fs.access('.env.example');
});

await test('Billing engine exports are correct', async () => {
  const pkg = JSON.parse(await fs.readFile('packages/billing-engine/package.json', 'utf-8'));
  const exports = pkg.exports;
  
  if (!exports['./auth']) throw new Error('Missing auth export');
  if (!exports['./usage']) throw new Error('Missing usage export');
  if (!exports['./customers']) throw new Error('Missing customers export');
  if (!exports['./config']) throw new Error('Missing config export');
  if (!exports['./promo']) throw new Error('Missing promo export');
});

await test('Package.json has correct scripts', async () => {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  const scripts = pkg.scripts;
  
  if (!scripts['dev:api']) throw new Error('Missing dev:api script');
  if (!scripts['dev:worker']) throw new Error('Missing dev:worker script');
  if (!scripts['dev:admin']) throw new Error('Missing dev:admin script');
  if (!scripts['docker:up']) throw new Error('Missing docker:up script');
});

console.log(`\n=== Results ===`);
console.log(`✓ Passed: ${passed}`);
if (failed > 0) {
  console.log(`✗ Failed: ${failed}`);
}
console.log(`Total: ${passed + failed}`);
console.log('');

if (failed === 0) {
  console.log('✅ All validation tests passed!');
  console.log('');
  console.log('To run the platform:');
  console.log('  1. Start Docker Desktop');
  console.log('  2. Run: ./test.sh');
  console.log('  3. Access admin at http://localhost:3001');
  console.log('  4. Access API at http://localhost:3000');
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
