import fs from 'fs';

const page =
JSON.parse(
  fs.readFileSync(
    'storage/debug/page_2_coords.json',
    'utf8'
  )
);

const buckets = {};

for (const item of page) {

  const x =
  Math.floor(item.x);

  buckets[x] =
  (buckets[x] || 0) + 1;
}

Object.keys(buckets)
  .sort((a,b) => Number(a)-Number(b))
  .forEach(x => {
    console.log(
      x.padStart(2,' '),
      buckets[x]
    );
  });
