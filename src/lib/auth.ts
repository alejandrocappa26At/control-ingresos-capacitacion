export const AUTH_USER = process.env.NEXT_PUBLIC_APP_USER || 'capacitacion';
export const AUTH_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'Capacitacion2026*';

const SESSION_KEY = 'cic_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export interface StoredSession {
  user: string;
  expiresAt: number;
}

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.user || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(user: string): void {
  if (typeof window === 'undefined') return;
  const session: StoredSession = { user, expiresAt: Date.now() + SESSION_DURATION_MS };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* noop */
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export function credentialsAreValid(user: string, password: string): boolean {
  return user.trim() === AUTH_USER && password === AUTH_PASSWORD;
}