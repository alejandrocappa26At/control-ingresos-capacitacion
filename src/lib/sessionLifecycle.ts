'use client';

/**
 * Ciclo de vida de la sesión — "sesión de una sola vez":
 *  - Refrescar la página (F5) cierra la sesión: el arranque detecta la
 *    navegación tipo `reload` y la cierra de forma determinista.
 *  - Cerrar la pestaña o el navegador deja caer el "latido de pestaña"
 *    (cookie cic_tab): el servidor trata la sesión como caducada en
 *    LATIDO_TTL_S y en el próximo acceso se pide login.
 *  - Navegar a otra URL NO cierra la sesión: no hay ninguna acción de
 *    salida que la dispare; la pestaña sigue viva y el latido continúa.
 *
 * Se evita deliberadamente el logout en `pagehide`/`beforeunload`: un
 * descarga de página no distingue "cierre" de "navegar a otra URL" (la
 * Navigation API no es fiable en todos los orígenes de navegación), lo
 * que introducía carreras que cerraban sesiones válidas.
 */

import { LATIDO_COOKIE, LATIDO_INTERVALO_MS, LATIDO_TTL_S } from '@/lib/authCookies';

/** true si la página actual entró por F5 / "recargar" (no por navegación normal). */
export function esRecarga(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav?.type) return nav.type === 'reload';
  } catch {
    /* motores sin Navigation Timing L2 → fallback inferior */
  }
  return (performance as { navigation?: { type?: number } }).navigation?.type === 1;
}

/**
 * Mantiene vivo el latido de pestaña mientras el sistema esté abierto.
 * Devuelve la función de limpieza para el `useEffect` del AuthGate.
 */
export function iniciarLatido(): () => void {
  const latir = () => {
    document.cookie = `${LATIDO_COOKIE}=1; path=/; max-age=${LATIDO_TTL_S}; samesite=lax`;
  };
  latir();
  const timer = window.setInterval(latir, LATIDO_INTERVALO_MS);
  return () => window.clearInterval(timer);
}
