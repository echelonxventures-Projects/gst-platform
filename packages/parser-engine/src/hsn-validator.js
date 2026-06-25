export function isValidHSN(code) {

  if (
    !/^\d{4}$|^\d{6}$|^\d{8}$/
      .test(code)
  ) {
    return false;
  }

  const invalid = new Set([
    '0000',
    '2012',
    '2017',
    '9996',
    '9997',
    '9998',
    '9999'
  ]);

  if (
    invalid.has(code)
  ) {
    return false;
  }

  return true;
}
