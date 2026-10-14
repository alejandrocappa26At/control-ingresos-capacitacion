'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, SIDEBAR_EXPANDED, SIDEBAR_RAIL } from './Sidebar';
import { Header } from './Header';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { AuthGate } from '@/components/auth/AuthGate';
import { AccesoRestringido } from '@/components/auth/AccesoRestringido';
import { useDataStore } from '@/store/useDataStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PERMISOS_LABEL, homePath, permisoParaPath, puedeAcceder, type Permiso } from '@/lib/rbac';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pinned = useDataStore((s) => s.sidebarPinned);
  const compact = useMediaQuery('(max-width: 767px)');
  const pathname = usePathname();
  const router = useRouter();
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.role);
  const isLogin = pathname === '/login';

  // Acceso directo por URL bloqueado por el proxy → ?denied=<permiso>.
  // Se deriva en cada render (sin estado ni efectos): AuthGate no monta el
  // shell hasta resolver la sesión en cliente, y con status 'loading' (SSR)
  // no se entra en esta rama, por lo que window es seguro de leer aquí.
  const denied: Permiso | null =
    status === 'authenticated' && typeof window !== 'undefined'
      ? (() => {
          const value = new URLSearchParams(window.location.search).get('denied');
          return value && value in PERMISOS_LABEL ? (value as Permiso) : null;
        })()
      : null;

  const isPinned = pinned && !compact;

  // Defensa en profundidad en cliente (la autoridad server-side vive en proxy.ts)
  const permisoActual = status === 'authenticated' ? permisoParaPath(pathname) : null;
  const bloqueado = !!role && !!permisoActual && !puedeAcceder(role, permisoActual);
  const mostrarRestringido = status === 'authenticated' && !isLogin && (!!denied || bloqueado);

  // Al navegar, pathname cambia y la query ?denied= desaparece junto con la
  // recomputación de `denied` — no hace falta limpiar estado manualmente.
  const volverAMiModulo = () => {
    if (role) router.replace(homePath(role));
  };

  return (
    <AuthGate>
      {isLogin ? (
        children
      ) : (
        <div className="relative min-h-dvh bg-canvas">
          <div className="bg-mesh aurora pointer-events-none fixed inset-0 z-0">
            <div className="fixed inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-canvas/70 to-transparent" />
          </div>

          <Sidebar />
          <div
            className="relative z-10 flex min-h-dvh flex-col transition-[padding] duration-300 ease-out"
            style={{ paddingLeft: isPinned ? SIDEBAR_EXPANDED : SIDEBAR_RAIL }}
          >
            <Header />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {mostrarRestringido ? (
                <AccesoRestringido modulo={(denied ?? permisoActual)!} onVolver={volverAMiModulo} />
              ) : (
                children
              )}
            </main>
          </div>
          <FilterDrawer />
        </div>
      )}
    </AuthGate>
  );
}
