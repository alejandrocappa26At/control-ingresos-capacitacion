/**
 * Sesión firmada HMAC-SHA256 (Web Crypto → compatible Edge y Node).
 *
 * El token viaja SOLO en una cookie HttpOnly: nunca se expone al bundle
 * cliente ni a localStorage. La verificación es stateless; para migrar a
 * un backend real únicamente se reemplaza la emisión por una store de
 * sesiones (p. ej. Redis) manteniendo el mismo contrato.
 */

import { ROLES, type Rol } from '@/lib/rbac';

export const SESSION_COOKIE = 'cic_session';
/** Respaldo de expiración del token (el tiempo real de la sesión lo decide el navegador: cookie de sesión sin Max-Age). */
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** Solo username + rol + expiración. Sin datos sensibles. */
export interface SessionPayload {
  u: string;
  r: Rol;
  exp: number;
}

function secretKey(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[auth] SESSION_SECRET es obligatorio en producción.');
  }
  // Fallback SOLO para desarrollo local.
  return 'cic-dev-secret-cambiar-en-produccion';
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function firmar(body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return b64urlEncode(new Uint8Array(firma));
}

/** Comparación en tiempo constante de dos strings ASCII de igual longitud. */
function igualesConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await firmar(body)}`;
}

export async function verifySessionToken(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, firma] = token.split('.');
  if (!body || !firma) return null;

  const esperada = await firmar(body);
  if (!igualesConstante(firma, esperada)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as SessionPayload;
    if (!payload?.u || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    if (!(payload.r in ROLES)) return null;
    return payload;
  } catch {
    return null;
  }
}
