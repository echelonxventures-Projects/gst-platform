import fs from 'fs';

const pageNo =
parseInt(process.argv[2] || '1', 10);

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const page = pages[pageNo - 1];

if (!page) {
  console.error(`Page ${pageNo} not found`);
  process.exit(1);
}

const rows = {};

for (const item of page) {

  const y =
  Number(item.y).toFixed(1);

  if (!rows[y]) {
    rows[y] = [];
  }

  rows[y].push(item);
}

const output = {
  page: pageNo,
  rows: Object.entries(rows)
    .sort(
      (a, b) =>
      Number(a[0]) - Number(b[0])
    )
    .map(([y, items]) => ({
      y: Number(y),
      text: items
        .sort(
          (a, b) =>
          a.x - b.x
        )
        .map(x => x.text)
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
    }))
};

fs.mkdirSync(
  'storage/debug',
  { recursive: true }
);

fs.writeFileSync(
  `storage/debug/page_${pageNo}.json`,
  JSON.stringify(
    output,
    null,
    2
  )
);

console.log(
  `EXPORTED: storage/debug/page_${pageNo}.json`
);

console.log(
  `Rows: ${output.rows.length}`
);
