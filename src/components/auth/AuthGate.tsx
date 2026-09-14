'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useSessionStore((s) => s.status);

  const [mounted, setMounted] = useState(false);

  const isLogin = pathname === '/login';

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === 'guest' && !isLogin) {
      router.replace('/login');
    } else if (status === 'authenticated' && isLogin) {
      router.replace('/');
    }
  }, [mounted, status, isLogin, router]);

  // Evita mismatch SSR/hidratación: no renderiza el árbol protegido
  // hasta saber el estado real de la sesión en el cliente.
  if (!mounted) return null;

  if (status === 'guest') {
    return isLogin ? <>{children}</> : null;
  }

  return isLogin ? null : <>{children}</>;
}