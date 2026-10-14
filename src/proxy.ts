import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/session';
import { LATIDO_COOKIE } from '@/lib/authCookies';
import { ROLES, homePath, permisoParaPath } from '@/lib/rbac';

/**
 * Proxy (Next.js 16 — antes "middleware"): protección de rutas en el
 * servidor ANTES de renderizar.
 *
 * 1. Sin cookie de sesión válida, o sin latido de pestaña (el sistema
 *    estaba cerrado → la sesión caducó), → redirige a /login (bloquea
 *    acceso directo por URL).
 * 2. Con sesión pero sin el permiso del módulo → redirige al módulo
 *    permitido del rol con ?denied=<permiso> para que el cliente muestre
 *    el mensaje de "permiso insuficiente".
 *
 * Es una verificación optimista de defensa en profundidad; la autoridad
 * de credenciales vive en /api/auth/* (lista lista para backend real).
 */

const RUTAS_PUBLICAS = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (RUTAS_PUBLICAS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null;
  const session = await verifySessionToken(token);
  const latido = request.cookies.get(LATIDO_COOKIE)?.value;

  if (!session || !latido) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const permiso = permisoParaPath(pathname);
  if (permiso && !ROLES[session.r].permisos.includes(permiso)) {
    const url = new URL(homePath(session.r), request.url);
    url.searchParams.set('denied', permiso);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Excluye API (login/session/logout deben ser alcanzables sin cookie),
  // assets estáticos e imágenes.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|ico|webp|woff2?)$).*)'],
};
