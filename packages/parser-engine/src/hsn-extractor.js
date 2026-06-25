export function extractHSNs(text) {

  const results = [];

  const normalized =
    text.replace(/\s+/g, ' ');

  const eightDigit =
    normalized.match(
      /\b\d{4}\s\d{2}\s\d{2}\b/g
    ) || [];

  for (const code of eightDigit) {

    results.push(
      code.replace(/\s/g, '')
    );

  }

  const sixDigit =
    normalized.match(
      /\b\d{4}\s\d{2}\b/g
    ) || [];

  for (const code of sixDigit) {

    const covered =
      eightDigit.some(
        entry =>
          entry.startsWith(code)
      );

    if (covered) {
      continue;
    }

    results.push(
      code.replace(/\s/g, '')
    );

  }

  const fourDigit =
    normalized.match(
      /\b\d{4}\b/g
    ) || [];

  for (const code of fourDigit) {

    const covered =
      results.some(
        entry =>
          entry.startsWith(code)
      );

    if (covered) {
      continue;
    }

    results.push(code);

  }

  return [...new Set(results)];

}
