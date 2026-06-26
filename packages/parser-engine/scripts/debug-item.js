import fs from 'fs';

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

console.dir(
  pages[10][0],
  { depth: null }
);
