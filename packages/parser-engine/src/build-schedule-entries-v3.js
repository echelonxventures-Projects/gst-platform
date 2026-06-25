import fs from 'fs';

import { detectColumns } from './detect-columns.js';
import { buildRows } from './build-rows.js';
import { classifyRows } from './classify-rows.js';
import { buildEntries } from './build-entries.js';

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const results = [];

for (
  let pageIndex = 0;
  pageIndex < pages.length;
  pageIndex++
) {

  const page =
    pages[pageIndex];

  const columns =
    detectColumns(page);

  for (const column of columns) {

    const rows =
      buildRows(column);

    const classifiedRows =
      classifyRows(rows);

    const entries =
      buildEntries({
        page:
          pageIndex + 1,
        column,
        rows:
          classifiedRows
      });

    results.push(
      ...entries
    );

  }

}

fs.mkdirSync(
  'storage/structured',
  {
    recursive: true
  }
);

fs.writeFileSync(
  'storage/structured/schedule_entries_v3.json',
  JSON.stringify(
    results,
    null,
    2
  )
);

console.log(
  `Pages   : ${pages.length}`
);

console.log(
  `Entries : ${results.length}`
);
