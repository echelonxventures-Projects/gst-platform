import fs from 'fs';

const v2 = JSON.parse(
  fs.readFileSync(
    'storage/structured/schedule_entries_v2.json',
    'utf8'
  )
);

const v3 = JSON.parse(
  fs.readFileSync(
    'storage/structured/schedule_entries_v3.json',
    'utf8'
  )
);

const key = e =>
  `${e.page}|${e.rate}|${e.entryNo}|${e.text}`;

const v2Set = new Set(
  v2.map(key)
);

const v3Set = new Set(
  v3.map(key)
);

console.log('\nMissing from V3\n');

for (const e of v2) {

  if (!v3Set.has(key(e))) {

    console.log(
      JSON.stringify(e, null, 2)
    );

  }

}

console.log('\nAdded in V3\n');

for (const e of v3) {

  if (!v2Set.has(key(e))) {

    console.log(
      JSON.stringify(e, null, 2)
    );

  }

}
