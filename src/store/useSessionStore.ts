'use client';

import { create } from 'zustand';
import { fetchSession, loginRequest, logoutRequest } from '@/lib/auth';
import type { Permiso, Rol, SesionPublica } from '@/lib/rbac';

export type SessionStatus = 'loading' | 'guest' | 'authenticated';

interface SessionState {
  user: string | null;
  displayName: string | null;
  role: Rol | null;
  permissions: Permiso[];
  status: SessionStatus;
  /** Restaura la sesión desde la cookie HttpOnly (refresco de página). */
  bootstrap: () => Promise<void>;
  login: (user: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

/** Evita re-fetch de sesión en cada montaje del AuthGate. */
let bootstrapped = false;

function desdeSesion(sesion: SesionPublica): Pick<SessionState, 'user' | 'displayName' | 'role' | 'permissions' | 'status'> {
  return {
    user: sesion.user,
    displayName: sesion.displayName,
    role: sesion.role,
    permissions: sesion.permissions,
    status: 'authenticated',
  };
}

const SIN_SESION: Pick<SessionState, 'user' | 'displayName' | 'role' | 'permissions'> = {
  user: null,
  displayName: null,
  role: null,
  permissions: [],
};

export const useSessionStore = create<SessionState>((set) => ({
  ...SIN_SESION,
  status: 'loading',

  bootstrap: async () => {
    if (bootstrapped) return;
    bootstrapped = true;
    const sesion = await fetchSession();
    set(sesion ? desdeSesion(sesion) : { ...SIN_SESION, status: 'guest' });
  },

  login: async (user, password) => {
    const sesion = await loginRequest(user, password);
    bootstrapped = true;
    if (!sesion) {
      set({ ...SIN_SESION, status: 'guest' });
      return false;
    }
    set(desdeSesion(sesion));
    return true;
  },

  logout: async () => {
    await logoutRequest();
    bootstrapped = false;
    set({ ...SIN_SESION, status: 'guest' });
  },
}));
