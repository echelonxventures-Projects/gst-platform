import fs from 'fs';

const dup =
JSON.parse(
  fs.readFileSync(
    'storage/structured/duplicate_hsns.json',
    'utf8'
  )
);

const report = {};

let duplicates = 0;
let conflicts = 0;

for (const [hsn, entries] of Object.entries(dup)) {

  const rates =
    [...new Set(
      entries
        .map(e => e.rate)
        .filter(r => r !== null)
    )];

  if (rates.length === 1) {

    duplicates++;

    continue;
  }

  conflicts++;

  report[hsn] = {
    length: hsn.length,
    rates,
    occurrences: entries.length,
    entries
  };

}

fs.writeFileSync(
  'storage/structured/ambiguity_report.json',
  JSON.stringify(
    report,
    null,
    2
  )
);

console.log({
  duplicates,
  conflicts
});
