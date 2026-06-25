import fs from 'fs';

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const COLUMNS = [
  { rate: 0,  minX: 10, maxX: 18 },
  { rate: 5,  minX: 18, maxX: 25 },
  { rate: 12, minX: 25, maxX: 33 },
  { rate: 18, minX: 33, maxX: 41 },
  { rate: 28, minX: 41, maxX: 50 }
];

const results = [];

for (
  let pageIndex = 0;
  pageIndex < pages.length;
  pageIndex++
) {

  const page =
    pages[pageIndex];

  for (const column of COLUMNS) {

    const items =
      page.filter(
        item =>
          item.x >= column.minX &&
          item.x <= column.maxX
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
        Math.round(
          item.y * 10
        ) / 10;

      if (!buckets[y]) {
        buckets[y] = [];
      }

      buckets[y].push(item);

    }

    const rows =
      Object.entries(buckets)
        .sort(
          (a,b) =>
            Number(a[0]) -
            Number(b[0])
        )
        .map(
          ([,row]) =>
            row
              .sort(
                (a,b) =>
                  a.x - b.x
              )
              .map(
                r =>
                  r.text.trim()
              )
              .join(' ')
              .replace(
                /\s+/g,
                ' '
              )
              .trim()
        )
        .filter(Boolean);

    let current = null;

    for (const row of rows) {

      const serialMatch =
        row.match(
          /^(\d+)\./
        );

      const hsnMatch =
        row.match(
          /^(\d{4})\s+[A-Za-z]/
        );

      if (serialMatch) {

        if (
          current &&
          !/^\d+\.\s*$/.test(
            current.text
          )
        ) {

          results.push(
            current
          );

        }

        current = {
          page:
            pageIndex + 1,
          rate:
            column.rate,
          entryNo:
            Number(
              serialMatch[1]
            ),
          text:
            row
        };

        continue;

      }

      if (hsnMatch) {

        if (
          current &&
          !/^\d+\.\s*$/.test(
            current.text
          )
        ) {

          results.push(
            current
          );

        }

        current = {
          page:
            pageIndex + 1,
          rate:
            column.rate,
          entryNo:
            Number(
              hsnMatch[1]
            ),
          text:
            row
        };

        continue;

      }

      if (current) {

        current.text +=
          ' ' + row;

      }

    }

    if (
      current &&
      !/^\d+\.\s*$/.test(
        current.text
      )
    ) {

      results.push(
        current
      );

    }

  }

}

fs.mkdirSync(
  'storage/structured',
  {
    recursive: true
  }
);

fs.writeFileSync(
  'storage/structured/schedule_entries_v2.json',
  JSON.stringify(
    results,
    null,
    2
  )
);

console.log(
  'Entries:',
  results.length
);
