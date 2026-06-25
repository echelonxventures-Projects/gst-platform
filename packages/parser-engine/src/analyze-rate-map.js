import fs from 'fs';

const data = JSON.parse(
  fs.readFileSync(
    'storage/structured/rate_map.json',
    'utf8'
  )
);

const counts = {};

for (const rate of Object.values(data)) {
  counts[rate] = (counts[rate] || 0) + 1;
}

console.log(counts);
