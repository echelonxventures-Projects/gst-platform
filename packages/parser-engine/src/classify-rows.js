const SERIAL_REGEX =
  /^(\d+)\.\s*/;

const HSN_REGEX =
  /^(\d{4})\s+[A-Za-z]/;

const RATE_REGEX =
  /^(Nil|0%|0\.25%|3%|5%|12%|18%|28%)$/i;

const HEADER_REGEX =
  /(GST RATE SCHEDULE|FOR GOODS|GST Council|S\.?\s*No\.?)/i;

const FOOTER_REGEX =
  /(Page\s+\d+|CGST|IGST|SGST)/i;

function isSubItem(text) {

  const t =
    text.trim();

  if (
    !SERIAL_REGEX.test(t)
  ) {
    return false;
  }

  //
  // Standalone serials are not sub-items.
  //
  if (
    t.length <= 3
  ) {
    return false;
  }

  //
  // HSN rows are never sub-items.
  //
  if (
    HSN_REGEX.test(t)
  ) {
    return false;
  }

  return false;

}

function detectKind(text) {

  const t =
    text.trim();

  if (!t.length) {
    return 'blank';
  }

  if (
    HEADER_REGEX.test(t)
  ) {
    return 'header';
  }

  if (
    FOOTER_REGEX.test(t)
  ) {
    return 'footer';
  }

  if (
    RATE_REGEX.test(t)
  ) {
    return 'rate-header';
  }

  if (
    HSN_REGEX.test(t)
  ) {
    return 'hsn';
  }

  if (
    SERIAL_REGEX.test(t)
  ) {

    if (
      isSubItem(t)
    ) {
      return 'subitem';
    }

    return 'serial';

  }

  return 'continuation';

}

export function classifyRows(rows) {

  return rows.map(row => {

    const kind =
      detectKind(
        row.text
      );

    const serial =
      row.text.match(
        SERIAL_REGEX
      );

    const hsn =
      row.text.match(
        HSN_REGEX
      );

    return {

      ...row,

      kind,

      serial:

        serial
          ? Number(
              serial[1]
            )
          : null,

      hsn:

        hsn
          ? hsn[1]
          : null

    };

  });

}
