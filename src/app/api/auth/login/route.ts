import { NextResponse } from 'next/server';
import { findUsuario } from '@/server/auth/users';
import { DUMMY_HASH, verifyPassword } from '@/server/auth/passwords';
import { SESSION_COOKIE, SESSION_DURATION_MS, signSessionToken } from '@/server/auth/session';
import { LATIDO_COOKIE, LATIDO_TTL_S } from '@/lib/authCookies';
import { ROLES, type SesionPublica } from '@/lib/rbac';

/**
 * POST /api/auth/login — valida credenciales contra el directorio de
 * usuarios (hash scrypt) y emite una cookie HttpOnly firmada HMAC.
 * Contrato preparado para migrar a un backend externo sin tocar al cliente.
 */
export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
  }

  const usuario = findUsuario(username);
  // Siempre se ejecuta una verificación (dummy si el usuario no existe)
  // para equalizar el tiempo de respuesta y no revelar usernames válidos.
  const stored = usuario?.passwordHash ?? DUMMY_HASH;
  const passwordOk = verifyPassword(password, stored);

  if (!usuario || !passwordOk) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }

  const token = await signSessionToken({
    u: usuario.username,
    r: usuario.role,
    exp: Date.now() + SESSION_DURATION_MS,
  });

  const sesion: SesionPublica = {
    user: usuario.username,
    displayName: usuario.displayName,
    role: usuario.role,
    permissions: [...ROLES[usuario.role].permisos],
  };

  const response = NextResponse.json(sesion);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Sin maxAge → cookie de sesión del navegador: muere al cerrar el
    // navegador. El cierre al refrescar lo garantiza el cliente
    // (src/lib/sessionLifecycle.ts).
  });
  // Latido de pestaña: el cliente lo renueva mientras el sistema esté
  // abierto; su ausencia invalida la sesión en el servidor.
  response.cookies.set(LATIDO_COOKIE, '1', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: LATIDO_TTL_S,
  });
  return response;
}
