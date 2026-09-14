export const AUTH_USER = (process.env.NEXT_PUBLIC_APP_USER ?? 'capacitacion').trim();
export const AUTH_PASSWORD = (process.env.NEXT_PUBLIC_APP_PASSWORD ?? 'Capacitacion2026*').trim();

const DEBUG_LOGIN = true;

if (DEBUG_LOGIN) {
  console.log('[AUTH] AUTH_USER:', JSON.stringify(AUTH_USER));
  console.log('[AUTH] AUTH_PASSWORD_EXISTS:', !!AUTH_PASSWORD);
  console.log('[AUTH] NEXT_PUBLIC_APP_USER:', JSON.stringify(process.env.NEXT_PUBLIC_APP_USER));
  console.log('[AUTH] NEXT_PUBLIC_APP_PASSWORD_EXISTS:', !!process.env.NEXT_PUBLIC_APP_PASSWORD);
}

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
  const safeUser = user.trim();
  const safePassword = password.trim();

  const expectedUser = AUTH_USER.trim();
  const expectedPassword = AUTH_PASSWORD.trim();

  const result =
    safeUser === expectedUser &&
    safePassword === expectedPassword;

  if (DEBUG_LOGIN && typeof window !== 'undefined') {
    console.log('[AUTH·val] Usuario ingresado  :', JSON.stringify(safeUser));
    console.log('[AUTH·val] Usuario esperado   :', JSON.stringify(expectedUser));
    console.log('[AUTH·val] Longitud password ingresada:', safePassword.length);
    console.log('[AUTH·val] Longitud password esperada :', expectedPassword.length);
    console.log('[AUTH·val] Variables leídas   :', {
      user: AUTH_USER,
      passwordOK: !!AUTH_PASSWORD,
    });
    console.log('[AUTH·val] Resultado validación:', result);
  }

  if (DEBUG_LOGIN) {
    const hardcodedResult =
      safeUser === 'capacitacion' &&
      safePassword === 'Capacitacion2026*';
    console.log('[AUTH·test] Validación con valores fijos (sin env):', hardcodedResult);
  }

  return result;
}