import fs from 'fs';

const pageNo = Number(process.argv[2] || 2);

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const page = pages[pageNo - 1];

for (const item of page) {
  console.log(
    `${item.y.toFixed(2)} | ${item.x.toFixed(2)} | ${item.text}`
  );
}
