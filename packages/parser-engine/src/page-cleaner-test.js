import fs from 'fs';
import { isNoiseText } from './page-cleaner.js';

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

let total = 0;
let removed = 0;

for (const page of pages) {

  for (const item of page) {

    total++;

    if (
      isNoiseText(item.text)
    ) {
      removed++;
    }

  }

}

console.log({
  total,
  removed,
  kept: total - removed
});
