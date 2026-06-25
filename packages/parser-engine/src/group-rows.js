import fs from 'fs';

const page =
JSON.parse(
  fs.readFileSync(
    process.argv[2],
    'utf8'
  )
);

const buckets = {};

for (const item of page) {

  const y =
    Math.round(
      item.y * 10
    ) / 10;

  if (!buckets[y]) {
    buckets[y] = [];
  }

  buckets[y].push(item);

}

const rows =
Object.entries(buckets)
  .sort(
    (a,b) =>
      Number(a[0]) -
      Number(b[0])
  )
  .map(
    ([y,items]) => ({
      y,
      items:
        items.sort(
          (a,b) =>
            a.x - b.x
        )
    })
  );

console.log(
  JSON.stringify(
    rows,
    null,
    2
  )
);
