import fs from 'fs';

const duplicates =
JSON.parse(
  fs.readFileSync(
    'storage/structured/duplicate_hsns.json',
    'utf8'
  )
);

const conflicts = [];

for (const [hsn, entries] of Object.entries(duplicates)) {

  const rates =
    [...new Set(
      entries
        .map(e => e.rate)
        .filter(r => r !== null)
    )];

  if (rates.length > 1) {

    conflicts.push({
      hsn,
      rates,
      count: entries.length
    });

  }

}

conflicts.sort(
  (a, b) =>
    b.rates.length - a.rates.length ||
    b.count - a.count
);

console.log(
  JSON.stringify(
    conflicts.slice(0, 50),
    null,
    2
  )
);
