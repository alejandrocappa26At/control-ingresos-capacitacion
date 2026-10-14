import type { SesionPublica } from '@/lib/rbac';

/**
 * Cliente de la API de autenticación. La cookie de sesión es HttpOnly:
 * el navegador la adjunta automáticamente; el JS nunca la lee ni la
 * persiste. Este es el único contrato a reemplazar al migrar a un
 * backend externo.
 */

/** GET /api/auth/session — sesión vigente o null (401/expirada). */
export async function fetchSession(): Promise<SesionPublica | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SesionPublica;
  } catch {
    return null;
  }
}

/** POST /api/auth/login — null si las credenciales no son válidas. */
export async function loginRequest(username: string, password: string): Promise<SesionPublica | null> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  return (await res.json()) as SesionPublica;
}

/** POST /api/auth/logout — invalida la cookie de sesión. */
export async function logoutRequest(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    /* noop */
  }
}
