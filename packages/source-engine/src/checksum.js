import crypto from 'crypto';

export function checksum(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}
