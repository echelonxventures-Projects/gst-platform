import { sourceEngine } from './engine.js';

async function run() {
  console.log('GST Source Engine - Processing all sources');
  
  const results = await sourceEngine.processAllSources();
  
  console.log('\nResults:');
  results.forEach(r => {
    console.log(`  ${r.source}: ${r.status}`);
  });
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
