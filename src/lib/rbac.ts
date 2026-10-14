/**
 * ══════════════════════════════════════════════════════════════════
 *  RBAC — Modelo de roles y permisos (fuente de verdad)
 * ══════════════════════════════════════════════════════════════════
 *
 * Módulo ISOMÓRFICO: lo consumen el proxy (Edge), los route handlers
 * (Node) y los componentes cliente. Por eso solo contiene datos y
 * funciones puras — sin Node APIs, sin fetch, sin secretos.
 */

export type Permiso = 'dashboard' | 'reclutadores' | 'capacitacion' | 'caidas' | 'upload_excel';

export type Rol = 'GERENTE_VENTAS' | 'CAPACITACION' | 'GDT' | 'JEFA_CAPACITACION';

export interface DefinicionRol {
  /** Nombre visible del rol. */
  label: string;
  /** Descripción corta para onboarding. */
  descripcion: string;
  /** Permisos concedidos (única fuente para nav, proxy y API). */
  permisos: readonly Permiso[];
}

export const ROLES: Record<Rol, DefinicionRol> = {
  GERENTE_VENTAS: {
    label: 'Gerente de Ventas',
    descripcion: 'Acceso completo: dashboard, matriz de reclutadores, capacitación, caídas, informes, filtros y carga Excel.',
    permisos: ['dashboard', 'reclutadores', 'capacitacion', 'caidas', 'upload_excel'],
  },
  CAPACITACION: {
    label: 'Capacitación',
    descripcion: 'Únicamente el módulo de Capacitación y la carga de Excel.',
    permisos: ['capacitacion', 'upload_excel'],
  },
  GDT: {
    label: 'GDT',
    descripcion: 'Dashboard general, módulo de Caídas y carga de Excel.',
    permisos: ['dashboard', 'caidas', 'upload_excel'],
  },
  JEFA_CAPACITACION: {
    label: 'JEFA_CAPACITACION',
    descripcion: 'Acceso total al sistema (administrador operativo): dashboard, matriz de reclutadores, capacitación, caídas, informes, filtros y carga Excel.',
    permisos: ['dashboard', 'reclutadores', 'capacitacion', 'caidas', 'upload_excel'],
  },
};

export const PERMISOS_LABEL: Record<Permiso, string> = {
  dashboard: 'Dashboard',
  reclutadores: 'Matriz de Reclutadores',
  capacitacion: 'Capacitación',
  caidas: 'Caídas',
  upload_excel: 'Carga Excel',
};

/** Sesión visible que viaja al cliente (nunca el hash ni datos sensibles). */
export interface SesionPublica {
  user: string;
  displayName: string;
  role: Rol;
  permissions: Permiso[];
}

/** Ruta inicial tras login, según los permisos del rol. */
export function homePath(role: Rol): string {
  const permisos = ROLES[role].permisos;
  if (permisos.includes('dashboard')) return '/';
  if (permisos.includes('capacitacion')) return '/capacitacion';
  return '/upload';
}

/** Permiso requerido para acceder a una ruta (null = ruta no protegida por módulo). */
export function permisoParaPath(pathname: string): Permiso | null {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/capacitacion')) return 'capacitacion';
  if (pathname.startsWith('/caidas')) return 'caidas';
  if (pathname.startsWith('/upload')) return 'upload_excel';
  return null;
}

/** ¿El rol posee el permiso? */
export function puedeAcceder(role: Rol | null | undefined, permiso: Permiso): boolean {
  if (!role) return false;
  return ROLES[role].permisos.includes(permiso);
}
