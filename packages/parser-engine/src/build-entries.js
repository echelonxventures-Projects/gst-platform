const EMPTY_SERIAL_REGEX =
  /^\d+\.\s*$/;

function flush(results, current) {

  if (!current) {
    return;
  }

  if (
    EMPTY_SERIAL_REGEX.test(
      current.text
    )
  ) {
    return;
  }

  current.text =
    current.text
      .replace(/\s+/g, ' ')
      .trim();

  results.push(current);

}

function newSerialEntry({
  page,
  column,
  row
}) {

  return {

    id:
      `P${page}-C${column.index}-S${row.serial}`,

    page,

    column:
      column.index,

    rate:
      column.rate,

    type:
      'serial',

    entryNo:
      row.serial,

    startY:
      row.y,

    endY:
      row.y,

    rows: [
      row
    ],

    text:
      row.text

  };

}

function newHSNEntry({
  page,
  column,
  row
}) {

  return {

    id:
      `P${page}-C${column.index}-H${row.hsn}`,

    page,

    column:
      column.index,

    rate:
      column.rate,

    type:
      'hsn',

    entryNo:
      Number(row.hsn),

    hsn:
      row.hsn,

    startY:
      row.y,

    endY:
      row.y,

    rows: [
      row
    ],

    text:
      row.text

  };

}

export function buildEntries({
  page,
  column,
  rows
}) {

  const results = [];

  let current = null;

  for (const row of rows) {

    switch (row.kind) {

      case 'header':
      case 'footer':
      case 'blank':
      case 'rate-header':
        continue;

      case 'serial':

        flush(
          results,
          current
        );

        current =
          newSerialEntry({
            page,
            column,
            row
          });

        continue;

      case 'hsn':

        flush(
          results,
          current
        );

        current =
          newHSNEntry({
            page,
            column,
            row
          });

        continue;

      case 'subitem':

      case 'continuation':

        if (!current) {
          continue;
        }

        current.rows.push(
          row
        );

        current.endY =
          row.y;

        current.text +=
          ' ' + row.text;

        continue;

      default:

        if (!current) {
          continue;
        }

        current.rows.push(
          row
        );

        current.endY =
          row.y;

        current.text +=
          ' ' + row.text;

    }

  }

  flush(
    results,
    current
  );

  return results;

}
