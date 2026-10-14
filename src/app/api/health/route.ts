import { NextResponse } from 'next/server';

/**
 * GET /api/health — endpoint público de diagnóstico de despliegue.
 *
 * Devuelve el commit exacto que está sirviendo cada ambiente (Vercel
 * inyecta VERCEL_GIT_COMMIT_SHA y VERCEL_ENV en cada deployment). Permite
 * verificar en segundos si un entorno ejecuta la versión esperada del
 * código — p. ej. confirmar que Vercel sirve el build con el sistema de
 * usuarios RBAC y no una versión anterior. No expone datos sensibles.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'AT People',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    ambiente: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'local',
  });
}
