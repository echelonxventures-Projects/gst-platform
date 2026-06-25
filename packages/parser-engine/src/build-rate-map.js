import fs from 'fs';

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const rateMap = {};

function determineRate(x) {

  if (x >= 10 && x < 18) {
    return 0;
  }

  if (x >= 20 && x < 27) {
    return 5;
  }

  if (x >= 28 && x < 35) {
    return 12;
  }

  if (x >= 36 && x < 43) {
    return 18;
  }

  if (x >= 44) {
    return 28;
  }

  return null;
}

const regex = /\d{4}/;

for (const page of pages) {

  for (const row of page) {

    const match =
      row.text.match(regex);

    if (!match) {
      continue;
    }

    const hsn =
      match[0];

    const rate =
      determineRate(row.x);

    if (rate === null) {
      continue;
    }

    rateMap[hsn] = rate;
  }
}

fs.mkdirSync(
  'storage/structured',
  { recursive: true }
);

fs.writeFileSync(
  'storage/structured/rate_map.json',
  JSON.stringify(
    rateMap,
    null,
    2
  )
);

console.log(
  'HSN Count:',
  Object.keys(rateMap).length
);
