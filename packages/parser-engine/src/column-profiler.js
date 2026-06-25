import fs from 'fs';

const page =
JSON.parse(
  fs.readFileSync(
    'storage/debug/page_2_coords.json',
    'utf8'
  )
);

const buckets = {
  serial: [],
  chapter: [],
  nil: [],
  rate5: [],
  rate12: [],
  rate18: [],
  rate28: []
};

for (const item of page) {

  const x = Number(item.x);

  if (x < 5) {
    buckets.serial.push(item.text);
  }
  else if (x < 10) {
    buckets.chapter.push(item.text);
  }
  else if (x < 18) {
    buckets.nil.push(item.text);
  }
  else if (x < 26) {
    buckets.rate5.push(item.text);
  }
  else if (x < 34) {
    buckets.rate12.push(item.text);
  }
  else if (x < 42) {
    buckets.rate18.push(item.text);
  }
  else {
    buckets.rate28.push(item.text);
  }
}

for (const [name, values] of Object.entries(buckets)) {

  console.log('\n==========');
  console.log(name.toUpperCase());
  console.log('==========');

  console.log(
    values
      .filter(v => v.trim())
      .slice(0, 50)
      .join('\n')
  );
}
