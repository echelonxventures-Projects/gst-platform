export function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

export function normalize(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

export function isBlank(text) {
  return normalize(text).length === 0;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function sortByXY(tokens) {

  return [...tokens].sort((a, b) => {

    if (Math.abs(a.y - b.y) > 0.001) {
      return a.y - b.y;
    }

    return a.x - b.x;

  });

}

export function groupBy(array, keyFn) {

  const map = new Map();

  for (const item of array) {

    const key = keyFn(item);

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(item);

  }

  return map;

}

export function unique(values) {

  return [...new Set(values)];

}

export function pad(value, width = 2) {

  return String(value).padStart(width, '0');

}

export function makeEntryId(
  page,
  column,
  entryNo
) {

  return `P${pad(page,3)}-C${column}-E${entryNo}`;

}
