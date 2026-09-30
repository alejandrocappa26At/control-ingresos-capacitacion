'use client';

import { Sidebar, SIDEBAR_EXPANDED, SIDEBAR_RAIL } from './Sidebar';
import { Header } from './Header';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { AuthGate } from '@/components/auth/AuthGate';
import { useDataStore } from '@/store/useDataStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pinned = useDataStore((s) => s.sidebarPinned);
  const compact = useMediaQuery('(max-width: 767px)');
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  const isPinned = pinned && !compact;

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
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
          <FilterDrawer />
        </div>
      )}
    </AuthGate>
  );
}
