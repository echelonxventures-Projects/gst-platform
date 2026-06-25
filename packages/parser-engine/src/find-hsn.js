import fs from 'fs';

const pages = JSON.parse(
  fs.readFileSync(
    'storage/normalized/gst_schedule_goods.json',
    'utf8'
  )
);

const regex = /\b\d{4}\b/;

for (let p = 0; p < pages.length; p++) {

  for (const row of pages[p]) {

    if (regex.test(row.text)) {

      console.log(
        JSON.stringify({
          page: p + 1,
          x: row.x,
          y: row.y,
          text: row.text
        })
      );
    }
  }
}
