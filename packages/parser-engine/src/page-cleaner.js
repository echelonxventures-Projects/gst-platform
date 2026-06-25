export function isNoiseText(text) {

  const t = text.trim();

  if (!t) {
    return true;
  }

  const noise = [
    'GST RATE SCHEDULE',
    'FOR GOODS',
    'Chapter',
    'Nil',
    '5%',
    '12%',
    '18%',
    '28%',
    'S.',
    'No.'
  ];

  if (noise.includes(t)) {
    return true;
  }

  if (
    /^May,\s*2017$/i.test(t)
  ) {
    return true;
  }

  if (
    /^\d+$/.test(t)
  ) {
    return true;
  }

  return false;
}
