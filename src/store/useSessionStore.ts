'use client';

import { create } from 'zustand';
import {
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
    const valid = credentialsAreValid(user, password);
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