export function validateHSN(hsnCode) {
  if (!hsnCode) return false;
  const cleaned = hsnCode.toString().trim();
  return /^\d{2,8}$/.test(cleaned);
}

export function validateSAC(sacCode) {
  if (!sacCode) return false;
  const cleaned = sacCode.toString().trim();
  return /^\d{4,6}$/.test(cleaned);
}

export function validateGSTRate(rate) {
  if (rate === null || rate === undefined) return true;
  const num = parseFloat(rate);
  return !isNaN(num) && num >= 0 && num <= 100;
}

export function validateNotificationNo(notificationNo) {
  if (!notificationNo) return false;
  return /^\d+\/\d{4}/.test(notificationNo.trim());
}

export function normalizeHSN(hsnCode) {
  if (!hsnCode) return null;
  return hsnCode.toString().trim().replace(/\D/g, '');
}
