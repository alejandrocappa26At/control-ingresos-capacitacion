import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/server/auth/session';
import { LATIDO_COOKIE } from '@/lib/authCookies';

/** POST /api/auth/logout — elimina la cookie de sesión y el latido. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(LATIDO_COOKIE, '', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
