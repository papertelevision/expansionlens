// Bcrypt-based password hashing for admin accounts.
// Cost factor 12 is the current best-practice baseline (~250ms per hash on
// modern hardware) — slow enough to defeat brute force, fast enough that
// admin login still feels instant.

import bcrypt from 'bcryptjs';

const COST = 12;

export function hashAdminPassword(plain) {
  if (typeof plain !== 'string' || plain.length < 8) {
    throw new Error('Admin password must be at least 8 characters.');
  }
  return bcrypt.hashSync(plain, COST);
}

export function verifyAdminPassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string') return false;
  // Reject anything that doesn't look like a bcrypt hash. Legacy HMAC
  // hashes from the previous implementation are not accepted — admins
  // must reset their password via scripts/set-admin-password.js.
  if (!hash.startsWith('$2')) return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
