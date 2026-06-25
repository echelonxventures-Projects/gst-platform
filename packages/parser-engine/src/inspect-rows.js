import fs from 'fs';

const pageNo = Number(process.argv[2] || 2);

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const page = pages[pageNo - 1];

const rows = {};

for (const item of page) {
  const key = item.y.toFixed(1);

  if (!rows[key]) {
    rows[key] = [];
  }

  rows[key].push(item);
}

for (const y of Object.keys(rows).sort((a, b) => Number(a) - Number(b))) {

  const text = rows[y]
    .sort((a, b) => a.x - b.x)
    .map(x => x.text)
    .join('');

  console.log(`${y} | ${text}`);
}
