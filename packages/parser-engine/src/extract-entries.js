import fs from 'fs';
import { isValidHSN } from './hsn-validator.js';

const page =
JSON.parse(
  fs.readFileSync(
    'storage/debug/page_2.json',
    'utf8'
  )
);

const rows = page.rows;

const entries = [];

let current = null;
let currentRate = null;

for (const row of rows) {

  const text = row.text.trim();

  if (!text) {
    continue;
  }

  if (
    text.includes('[0201') ||
    text.includes('[0202')
  ) {

    if (current) {
      entries.push(current);
    }

    current = {
      page: page.page,
      rate: currentRate,
      description: '',
      hsn_codes: []
    };
  }

  const hsnMatches =
    (text.match(/\b\d{4}\b/g) || [])
      .filter(isValidHSN);

  if (current) {

    current.hsn_codes.push(
      ...hsnMatches
    );

    current.description +=
      ' ' + text;
  }

  if (
    text.includes('frozen')
  ) {
    currentRate = 5;
  }

}

if (current) {
  entries.push(current);
}

fs.mkdirSync(
  'storage/structured',
  { recursive: true }
);

fs.writeFileSync(
  'storage/structured/entry_map.json',
  JSON.stringify(
    entries,
    null,
    2
  )
);

console.log(
  'ENTRIES:',
  entries.length
);
