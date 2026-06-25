export function buildRows(column) {

  const buckets = {};

  for (const item of column.items) {

    if (
      item.y < 6 ||
      item.y > 32
    ) {
      continue;
    }

    const y =
      Math.round(item.y * 10) / 10;

    if (!buckets[y]) {
      buckets[y] = [];
    }

    buckets[y].push(item);

  }

  return Object
    .entries(buckets)
    .sort(
      (a, b) =>
        Number(a[0]) -
        Number(b[0])
    )
    .map(
      ([y, items]) => ({

        y: Number(y),

        tokens: items
          .sort(
            (a, b) =>
              a.x - b.x
          ),

        text:
          items
            .sort(
              (a, b) =>
                a.x - b.x
            )
            .map(
              item =>
                item.text.trim()
            )
            .join(' ')
            .replace(
              /\s+/g,
              ' '
            )
            .trim()

      })
    )
    .filter(
      row =>
        row.text.length
    );

}
