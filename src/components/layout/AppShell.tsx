'use client';

import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FilterChips } from '@/components/filters/FilterChips';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { AuthGate } from '@/components/auth/AuthGate';
import { useDataStore } from '@/store/useDataStore';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useDataStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useDataStore((s) => s.setSidebarCollapsed);
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  useEffect(() => {
    const onResize = () => setSidebarCollapsed(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setSidebarCollapsed]);

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
            className={cn(
              'relative z-10 flex min-h-dvh flex-col transition-all duration-300 ease-out',
              collapsed ? 'pl-[76px]' : 'pl-[248px]',
            )}
          >
            <Header />
            <FilterChips />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
          <FilterDrawer />
        </div>
      )}
    </AuthGate>
  );
}