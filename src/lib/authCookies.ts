/**
 * Cookies del sistema de autenticación compartidas entre cliente y
 * servidor (isomórfico, sin directivas de cliente).
 *
 *  - `cic_session` (HttpOnly, definida en src/server/auth/session.ts):
 *    token firmado; SIN Max-Age → muere al cerrar el navegador.
 *  - `cic_tab` ("latido de pestaña", escribible por JS): solo existe
 *    mientras el sistema está abierto en alguna pestaña. El servidor la
 *    exige junto a la sesión: al cerrar pestaña/navegador el latido se
 *    cae y la sesión caduca en LATIDO_TTL_S (en el próximo acceso se
 *    pide login). Navegar a otra URL no lo afecta (la pestaña sigue viva).
 */

export const LATIDO_COOKIE = 'cic_tab';
/** Vigencia del latido: el cierre de pestañas se materializa en ≤ TTL. */
export const LATIDO_TTL_S = 180;
/** Frecuencia de refresco del latido (holgura ante throttling en background: ~60s). */
export const LATIDO_INTERVALO_MS = 30_000;
