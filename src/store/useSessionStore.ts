'use client';

import { create } from 'zustand';
import {
  AUTH_PASSWORD,
  AUTH_USER,
  clearStoredSession,
  credentialsAreValid,
  readStoredSession,
  writeStoredSession,
} from '@/lib/auth';

type SessionStatus = 'authenticated' | 'guest';

interface SessionState {
  user: string | null;
  status: SessionStatus;
  login: (user: string, password: string) => boolean;
  logout: () => void;
}

function initialSession(): Pick<SessionState, 'user' | 'status'> {
  if (typeof window === 'undefined') return { user: null, status: 'guest' };
  const stored = readStoredSession();
  return stored
    ? { user: stored.user, status: 'authenticated' }
    : { user: null, status: 'guest' };
}

const init = initialSession();

export const useSessionStore = create<SessionState>((set) => ({
  user: init.user,
  status: init.status,
  login: (user, password) => {
    console.log('[AUTH] LOGIN ATTEMPT');
    console.log('[AUTH] USER INPUT:', JSON.stringify(user));
    console.log('[AUTH] PASSWORD LENGTH:', password.length);
    console.log('[AUTH] AUTH_USER:', JSON.stringify(AUTH_USER));
    console.log('[AUTH] AUTH_PASSWORD EXISTS:', !!AUTH_PASSWORD);

    const valid = credentialsAreValid(user, password);
    console.log('[AUTH] credentialsAreValid ejecutado, resultado:', valid);
    if (!valid) return false;
    const cleanUser = user.trim();
    writeStoredSession(cleanUser);
    set({ user: cleanUser, status: 'authenticated' });
    return true;
  },
  logout: () => {
    clearStoredSession();
    set({ user: null, status: 'guest' });
  },
}));