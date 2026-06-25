import fs from 'fs';

const pageNo =
parseInt(process.argv[2] || '2', 10);

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const page = pages[pageNo - 1];

fs.mkdirSync(
  'storage/debug',
  { recursive: true }
);

fs.writeFileSync(
  `storage/debug/page_${pageNo}_coords.json`,
  JSON.stringify(
    page,
    null,
    2
  )
);

console.log(
  `EXPORTED: storage/debug/page_${pageNo}_coords.json`
);

console.log(
  `Items: ${page.length}`
);
