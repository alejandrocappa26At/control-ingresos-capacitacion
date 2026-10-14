/**
 * Hash de contraseñas con scrypt (Node crypto) — SOLO servidor.
 *
 * Nunca se almacena ni transmite la contraseña en texto plano.
 * Formato almacenado: scrypt$N$r$p$saltHex$hashHex
 * Para generar un hash de un usuario nuevo: scripts/gen-user-hash.mjs
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P }).toString('hex');
  return `scrypt$${N}$${R}$${P}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length === 0) return false;
  let derived: Buffer;
  try {
    derived = scryptSync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    });
  } catch {
    return false;
  }
  return timingSafeEqual(derived, expected);
}

/**
 * Hash ficticio para igualar el tiempo de respuesta cuando el usuario
 * no existe (evita que el timing revele qué usernames están registrados).
 */
export const DUMMY_HASH = hashPassword('dummy-timing-equalizer');
