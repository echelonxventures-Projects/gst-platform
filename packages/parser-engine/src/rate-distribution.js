import fs from 'fs';

const map =
JSON.parse(
  fs.readFileSync(
    'storage/structured/coordinate_rate_map.json',
    'utf8'
  )
);

const totals = {};

for (const item of Object.values(map)) {

  const rate =
    item.rate;

  totals[rate] =
    (totals[rate] || 0) + 1;

}

console.log(totals);
