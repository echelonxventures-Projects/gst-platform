import fs from 'fs';

const pageNumber =
Number(process.argv[2]);

const minX =
Number(process.argv[3]);

const maxX =
Number(process.argv[4]);

const pages =
JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const page =
pages[pageNumber - 1];

const items =
page
  .filter(
    x =>
      x.x >= minX &&
      x.x < maxX
  )
  .sort(
    (a,b) =>
      a.y - b.y
  );

console.log(
  JSON.stringify(
    items,
    null,
    2
  )
);
