import fs from 'fs';

import { detectColumns } from '../src/detect-columns.js';

const PAGE = 11;

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const page = pages[PAGE - 1];

const columns = detectColumns(page);

for (const column of columns) {
  console.log('');
  console.log('========================================');
  console.log(`COLUMN ${column.index}  RATE ${column.rate}`);
  console.log('========================================');

  console.table(
    column.items.map(item => ({
      x: item.x,
      y: item.y,
      text: item.text
    }))
  );
}
