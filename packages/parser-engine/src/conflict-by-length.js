import fs from 'fs';

const report =
JSON.parse(
  fs.readFileSync(
    'storage/structured/ambiguity_report.json',
    'utf8'
  )
);

const stats = {};

for (const [hsn, data] of Object.entries(report)) {

  const len = hsn.length;

  stats[len] =
    (stats[len] || 0) + 1;

}

console.log(stats);
