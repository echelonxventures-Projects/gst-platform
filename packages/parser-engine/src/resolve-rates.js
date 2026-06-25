import fs from 'fs';

const raw =
JSON.parse(
  fs.readFileSync(
    'storage/structured/coordinate_rate_map.json',
    'utf8'
  )
);

const resolved = {};

for (const [hsn, entries] of Object.entries(raw)) {

  const counts = {};

  entries.forEach(entry => {

    counts[entry.rate] =
      (counts[entry.rate] || 0) + 1;

  });

  const winner =
    Object.entries(counts)
      .sort(
        (a, b) => b[1] - a[1]
      )[0][0];

  resolved[hsn] = {
    rate: Number(winner),
    evidence: counts
  };

}

fs.writeFileSync(
  'storage/structured/resolved_rate_map.json',
  JSON.stringify(
    resolved,
    null,
    2
  )
);

console.log(
  'Resolved:',
  Object.keys(resolved).length
);
