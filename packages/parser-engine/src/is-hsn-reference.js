export function isHSNReference(text) {

  const t =
    text.toLowerCase();

  const referencePatterns = [

    /\bgoods of heading\b/,
    /\bof heading\b/,
    /\bthose of heading\b/,
    /\bother than heading\b/,
    /\bheading\s+\d{4}\b/,
    /\bheadings\s+\d{4}\b/,
    /\bheadings\s+\d{4}\s+to\s+\d{4}\b/

  ];

  return referencePatterns.some(
    p => p.test(t)
  );

}
