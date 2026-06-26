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

function normalize(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function makeKey(entry) {
  return [
    entry.page,
    entry.rate,
    entry.entryNo
  ].join('|');
}

const v2Map = new Map();
const v3Map = new Map();

for (const e of v2) {
  v2Map.set(
    makeKey(e),
    e
  );
}

for (const e of v3) {
  v3Map.set(
    makeKey(e),
    e
  );
}

const missing = [];
const extra = [];
const changed = [];

for (const [key, e2] of v2Map) {

  const e3 =
    v3Map.get(key);

  if (!e3) {

    missing.push({
      key,
      page: e2.page,
      rate: e2.rate,
      entryNo: e2.entryNo,
      text: e2.text
    });

    continue;

  }

  if (
    normalize(e2.text) !==
    normalize(e3.text)
  ) {

    changed.push({

      key,

      page: e2.page,

      rate: e2.rate,

      entryNo: e2.entryNo,

      v2: e2.text,

      v3: e3.text,

      v2Length:
        e2.text.length,

      v3Length:
        e3.text.length,

      delta:
        e3.text.length -
        e2.text.length

    });

  }

}

for (const [key, e3] of v3Map) {

  if (
    !v2Map.has(key)
  ) {

    extra.push({

      key,

      page: e3.page,

      rate: e3.rate,

      entryNo: e3.entryNo,

      text: e3.text

    });

  }

}

console.log('');
console.log('========== COMPARISON ==========');
console.log(`V2 Entries : ${v2.length}`);
console.log(`V3 Entries : ${v3.length}`);
console.log(`Missing    : ${missing.length}`);
console.log(`Extra      : ${extra.length}`);
console.log(`Changed    : ${changed.length}`);

console.log('');
console.log('========== MISSING ==========');

console.table(
  missing.slice(0, 20)
);

console.log('');
console.log('========== EXTRA ==========');

console.table(
  extra.slice(0, 20)
);

console.log('');
console.log('========== CHANGED SUMMARY ==========');

console.table(

  changed
    .slice(0, 20)
    .map(c => ({

      key:
        c.key,

      page:
        c.page,

      rate:
        c.rate,

      entryNo:
        c.entryNo,

      v2Length:
        c.v2Length,

      v3Length:
        c.v3Length,

      delta:
        c.delta

    }))

);

console.log('');
console.log('========== CHANGED DETAILS ==========');

for (
  const c of changed
) {

  console.log('');
  console.log(
    '========================================================'
  );

  console.log(
    `Key     : ${c.key}`
  );

  console.log(
    `Page    : ${c.page}`
  );

  console.log(
    `Rate    : ${c.rate}`
  );

  console.log(
    `Entry   : ${c.entryNo}`
  );

  console.log(
    `Delta   : ${c.delta}`
  );

  console.log('');
  console.log('----- V2 -----');
  console.log(c.v2);

  console.log('');
  console.log('----- V3 -----');
  console.log(c.v3);

}

console.log('');
console.log(
  '========== END OF REPORT =========='
);
