import fs from 'fs';

const page =
JSON.parse(
  fs.readFileSync(
    'storage/debug/page_2_coords.json',
    'utf8'
  )
);

for (const item of page) {

  const text =
  item.text.trim();

  if (
    text === 'Nil' ||
    text === '5%' ||
    text === '12%' ||
    text === '18%' ||
    text === '28%'
  ) {
    console.log(
      JSON.stringify(
        {
          text,
          x: item.x,
          y: item.y
        },
        null,
        2
      )
    );
  }
}
