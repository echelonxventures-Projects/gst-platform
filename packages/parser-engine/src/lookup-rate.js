import fs from 'fs';

const map =
JSON.parse(
  fs.readFileSync(
    'storage/structured/resolved_rate_map.json',
    'utf8'
  )
);

export function lookupRate(hsn) {

  const code =
    String(hsn)
      .replace(/\D/g, '');

  if (map[code]) {
    return map[code];
  }

  if (
    code.length >= 8 &&
    map[code.substring(0, 6)]
  ) {
    return map[
      code.substring(0, 6)
    ];
  }

  if (
    code.length >= 6 &&
    map[code.substring(0, 4)]
  ) {
    return map[
      code.substring(0, 4)
    ];
  }

  return null;
}
