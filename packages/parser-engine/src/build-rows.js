const Y_TOLERANCE = 0.25;

export function buildRows(column) {

  const rows = [];

  const items = column.items
    .filter(item =>
      item.y >= 6 &&
      item.y <= 32
    )
    .sort((a, b) => {

      const dy = a.y - b.y;

      if (Math.abs(dy) > Y_TOLERANCE) {
        return dy;
      }

      return a.x - b.x;

    });

  for (const item of items) {

    let row =
      rows.find(r =>
        Math.abs(r.y - item.y) <=
        Y_TOLERANCE
      );

    if (!row) {

      row = {
        y: item.y,
        tokens: []
      };

      rows.push(row);

    }

    row.tokens.push(item);

  }

  rows.sort(
    (a, b) =>
      a.y - b.y
  );

  return rows
    .map(row => {

      row.tokens.sort(
        (a, b) =>
          a.x - b.x
      );

      const text =
        row.tokens
          .map(token =>
            token.text.trim()
          )
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .replace(/\s+([,.;:)\]])/g, '$1')
          .replace(/([([])\s+/g, '$1')
          .trim();

      return {

        y: row.y,

        tokens: row.tokens,

        text

      };

    })
    .filter(row =>
      row.text.length > 0
    );

}
