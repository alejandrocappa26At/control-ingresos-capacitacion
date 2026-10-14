import { randomBytes, scryptSync } from 'node:crypto';

/**
 * Genera hashes scrypt para el directorio de usuarios (src/server/auth/users.ts).
 * Uso (contraseña por variable de entorno, nunca por argumentos ni logs):
 *   CIC_HASH_PASS="Mauricio2026@##" node scripts/gen-user-hash.mjs
 */
const password = process.env.CIC_HASH_PASS;

if (!password) {
  console.error('Defina CIC_HASH_PASS antes de ejecutar (la contraseña no se expone en argv ni en logs).');
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, KEYLEN, { N, r, p }).toString('hex');

console.log(`scrypt$${N}$${r}$${p}$${salt}$${hash}`);
