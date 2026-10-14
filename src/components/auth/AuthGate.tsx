'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';
import { homePath } from '@/lib/rbac';
import { esRecarga, iniciarLatido } from '@/lib/sessionLifecycle';

/**
 * Guardia de autenticación a nivel de shell:
 *  - restaura la sesión desde la cookie HttpOnly (bootstrap), salvo en
 *    recargas (F5), donde la sesión se cierra por política de sesión única,
 *  - sin sesión → redirige a /login,
 *  - sesión activa en /login → redirige a su módulo inicial,
 *  - con sesión activa, mantiene el latido de pestaña (cic_tab): cerrar
 *    la pestaña o el navegador deja la sesión sin latido y caduca en el
 *    servidor (ver src/lib/sessionLifecycle.ts y src/lib/authCookies.ts).
 *
 * El control de PERMISOS por módulo vive en AppShell (mensaje de
 * "permiso insuficiente") y en src/proxy.ts (bloqueo server-side).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.role);
  const bootstrap = useSessionStore((s) => s.bootstrap);
  const logout = useSessionStore((s) => s.logout);

  const isLogin = pathname === '/login';

  useEffect(() => {
    // Recarga (F5): nunca restaurar la sesión anterior — se cierra y se
    // pide login. (logout() espera al POST antes de pasar a 'guest',
    // por lo que la UI de login no se habilita hasta confirmarlo.)
    if (esRecarga()) {
      void logout();
      return;
    }
    void bootstrap();
  }, [bootstrap, logout]);

  // Sesión activa: latido de pestaña (cerrar pestaña/navegador deja la
  // sesión sin latido → caduca en el servidor en ≤ LATIDO_TTL_S).
  useEffect(() => {
    if (status !== 'authenticated') return;
    return iniciarLatido();
  }, [status]);

  useEffect(() => {
    if (status === 'guest' && !isLogin) {
      router.replace('/login');
    } else if (status === 'authenticated' && isLogin && role) {
      router.replace(homePath(role));
    }
  }, [status, isLogin, role, router]);

  // Evita mismatch SSR/hidratación: no renderiza hasta conocer la sesión real.
  if (status === 'loading') return null;

  if (status === 'guest') {
    return isLogin ? <>{children}</> : null;
  }

  return isLogin ? null : <>{children}</>;
}
