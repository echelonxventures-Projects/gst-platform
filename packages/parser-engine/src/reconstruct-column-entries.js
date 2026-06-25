import fs from 'fs';

const page = Number(process.argv[2]);
const minX = Number(process.argv[3]);
const maxX = Number(process.argv[4]);

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const items =
  pages[page - 1]
    .filter(
      item =>
        item.x >= minX &&
        item.x <= maxX
    );

const buckets = {};

for (const item of items) {

  if (
    item.y < 6 ||
    item.y > 32
  ) {
    continue;
  }

  const y =
    Math.round(item.y * 10) / 10;

  if (!buckets[y]) {
    buckets[y] = [];
  }

  buckets[y].push(item);

}

const rows =
  Object.entries(buckets)
    .sort(
      (a, b) =>
        Number(a[0]) -
        Number(b[0])
    )
    .map(
      ([, row]) =>
        row
          .sort(
            (a, b) =>
              a.x - b.x
          )
          .map(
            r => r.text.trim()
          )
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);

const entries = [];

let current = null;

for (const row of rows) {

  const isSerial =
    /^\d+\.\s*/.test(row);

  const isHSN =
    /^\d{4}\s+/.test(row);

  if (isSerial || isHSN) {

    if (current) {
      entries.push(
        current.trim()
      );
    }

    current = row;
    continue;

  }

  if (current) {
    current +=
      ' ' + row;
  }

}

if (current) {

  entries.push(
    current.trim()
  );

}

console.log(
  JSON.stringify(
    entries,
    null,
    2
  )
);
