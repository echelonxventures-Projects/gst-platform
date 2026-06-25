export function rateFromX(x) {

  if (x >= 11 && x < 18) {
    return 0;
  }

  if (x >= 18 && x < 25) {
    return 5;
  }

  if (x >= 25 && x < 33) {
    return 12;
  }

  if (x >= 33 && x < 41) {
    return 18;
  }

  if (x >= 41) {
    return 28;
  }

  return null;
}
