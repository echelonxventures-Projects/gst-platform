import fs from 'fs';

const INPUT =
  'storage/extracted/gst_schedule_goods.json';

const OUTPUT =
  'storage/normalized/gst_schedule_goods.json';

const pdf =
  JSON.parse(
    fs.readFileSync(INPUT, 'utf8')
  );

const pages = [];

for (const page of pdf.Pages) {

  const texts = [];

  for (const t of page.Texts || []) {

    let text =
      t.R?.[0]?.T || '';

    try {
      text =
        decodeURIComponent(text);
    } catch {}

    texts.push({
      x: t.x,
      y: t.y,
      text
    });
  }

  pages.push(texts);
}

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(
    pages,
    null,
    2
  )
);

console.log(
  'NORMALIZED:',
  OUTPUT
);

console.log(
  'Pages:',
  pages.length
);
