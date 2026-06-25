import fs from 'fs';

const duplicates =
JSON.parse(
  fs.readFileSync(
    'storage/structured/duplicate_hsns.json',
    'utf8'
  )
);

let conflicts = 0;

for (const entries of Object.values(duplicates)) {

  const rates =
    [
      ...new Set(
        entries
          .map(e => e.rate)
          .filter(r => r !== null)
      )
    ];

  if (rates.length > 1) {
    conflicts++;
  }

}

console.log({
  duplicates: Object.keys(duplicates).length,
  conflicts
});
