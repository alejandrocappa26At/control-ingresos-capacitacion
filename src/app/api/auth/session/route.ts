import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/session';
import { LATIDO_COOKIE } from '@/lib/authCookies';
import { findUsuario } from '@/server/auth/users';
import { ROLES, type SesionPublica } from '@/lib/rbac';

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/**
 * GET /api/auth/session — devuelve la sesión vigente (cookie HttpOnly)
 * o401 si no existe / expiró / la firma no valida / no hay latido de
 * pestaña (el sistema estaba cerrado → la sesión caducó).
 */
export async function GET(request: Request) {
  const cookiesHeader = request.headers.get('cookie');
  const token = readCookie(cookiesHeader, SESSION_COOKIE);
  const latido = readCookie(cookiesHeader, LATIDO_COOKIE);
  const payload = await verifySessionToken(token);

  if (!payload || !latido) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // El displayName se deriva del directorio; si el usuario fue dado de
  // baja, la sesión deja de ser válida aunque el token aún no expire.
  const usuario = findUsuario(payload.u);
  if (!usuario) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const sesion: SesionPublica = {
    user: usuario.username,
    displayName: usuario.displayName,
    role: usuario.role,
    permissions: [...ROLES[usuario.role].permisos],
  };
  return NextResponse.json(sesion);
}
