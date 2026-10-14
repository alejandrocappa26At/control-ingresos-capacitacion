# Autenticación y RBAC — Control de Ingresos y Capacitación

## Arquitectura

```
[Cliente]  LoginScreen ─▶ useSessionStore ─▶ fetch('/api/auth/*')   (cookie HttpOnly: el JS nunca ve el token)
              │                                    ▲
              ▼                                    │
[Shell]    AuthGate (sesión) · AppShell (permisos → "Acceso restringido") · Sidebar/Header (menú dinámico)

[Servidor] proxy.ts (guardia de rutas, Next.js 16) ─▶ /api/auth/login|session|logout (route handlers Node)
              └ src/server/auth/users.ts (directorio, hashes scrypt)
                src/server/auth/passwords.ts (scrypt + timingSafeEqual)
                src/server/auth/session.ts  (token HMAC-SHA256, Web Crypto → Edge y Node)

[Compartido] src/lib/rbac.ts — roles, permisos y mapeo ruta↔permiso (isomórfico, sin secretos)
```

## Flujo de login

1. `POST /api/auth/login` `{ username, password }`.
2. `findUsuario` (case-insensitive + trim) y `verifyPassword` (scrypt N=16384 + `timingSafeEqual`). Si el usuario no existe se verifica un **hash dummy** para equalizar tiempos y no revelar usernames válidos.
3. Se emite un token firmado HMAC-SHA256 con payload `{ u, r, exp }` en la cookie `cic_session`: **HttpOnly, SameSite=Lax, Secure (producción), Path=/** y **sin Max-Age** (cookie de sesión del navegador: muere al cerrarlo). `exp` (30 días) actúa solo como respaldo del token.
4. `GET /api/auth/session` revalida firma + expiración + directorio: si el usuario fue dado de baja, la sesión deja de ser válida aunque el token no haya expirado.
5. `POST /api/auth/logout` elimina la cookie (idempotente; también se invoca automáticamente al refrescar o cerrar la página, ver punto 6).

6. **Cierre automático de sesión** (`src/lib/sessionLifecycle.ts` + `src/lib/authCookies.ts`): la sesión **no sobrevive refrescos ni cierres**. Al refrescar (F5), el arranque detecta la navegación tipo `reload` y la cierra de forma determinista. Mientras el sistema está abierto en alguna pestaña, el cliente mantiene el **latido de pestaña** (cookie `cic_tab`, refresco cada 30 s, TTL 180 s) y el servidor la exige junto a la sesión: al cerrar la pestaña o el navegador el latido se cae y la sesión caduca (en el próximo acceso se pide login). Navegar a otra URL no cierra la sesión. La `cic_session` sin Max-Age cubre además el cierre total del navegador de inmediato.

## Roles y permisos

| Rol            | Rutas accesibles              | Permisos                                                      |
| -------------- | ----------------------------- | ------------------------------------------------------------- |
| `GERENTE_VENTAS` | `/`, `/caidas`, `/capacitacion`, `/upload` | `dashboard`, `reclutadores`, `capacitacion`, `caidas`, `upload_excel` |
| `CAPACITACION`   | `/capacitacion`, `/upload`    | `capacitacion`, `upload_excel`                                |
| `GDT`            | `/`, `/caidas`, `/upload`     | `dashboard`, `caidas`, `upload_excel`                         |

**Nota:** la Matriz de Reclutadores es una sección dentro de `/caidas`. El permiso `reclutadores` es explícito solo de `GERENTE_VENTAS`; `GDT` accede al módulo `/caidas` completo (incluida la matriz), tal como define su especificación (su único módulo excluido es Capacitación).

## Protección de rutas (3 capas)

1. **`src/proxy.ts` (servidor, antes de renderizar):** sin cookie válida → redirect a `/login` (bloquea acceso directo por URL); con sesión pero sin el permiso del módulo → redirect al módulo inicial del rol con `?denied=<permiso>`.
2. **`AuthGate` (cliente):** restaura sesión desde la cookie (`bootstrap`) —excepto en recargas (F5), donde la cierra—, redirige invitados a `/login` y a usuarios autenticados fuera de `/login`; con sesión activa mantiene el latido de pestaña (`src/lib/sessionLifecycle.ts`).
3. **`AppShell` (cliente):** muestra la pantalla **"Acceso restringido / Permiso insuficiente"** (con los módulos permitidos del rol y botón de retorno) cuando detecta `?denied=` o una ruta no permitida.

El menú lateral se filtra con la misma fuente (`ROLES[role].permisos`), por lo que los módulos no autorizados **no aparecen** en la navegación.

## Variables de entorno

- `SESSION_SECRET` — obligatoria en producción (firma HMAC). En desarrollo existe un fallback local con advertencia.
- ~~`NEXT_PUBLIC_APP_USER` / `NEXT_PUBLIC_APP_PASSWORD`~~ — **eliminadas**: exponían la credencial en texto plano en el bundle cliente.

## Alta de usuarios

1. Generar el hash (la contraseña viaja por variable de entorno, nunca por argv ni logs):
   `CIC_HASH_PASS="NuevaClave2026@" node scripts/gen-user-hash.mjs`
2. Pegar el hash resultante en `src/server/auth/users.ts`.

## Validaciones automatizadas

- `npm run check:rbac` — unit: roles exactos, mapeo ruta↔permiso, home por rol, tokens (round-trip, firma alterada, expiración, rol fantasma), directorio de usuarios y rechazo de contraseñas incorrectas. Con `CIC_PASS_GERENTE/CIC_PASS_CAP/CIC_PASS_GDT` definidas añade la verificación positiva de los3 hashes.
- `npm run check:rbac:e2e` — E2E headless (Edge): login correcto/incorrecto de los3 usuarios, menú por rol, módulos permitidos, bloqueo por URL directa con mensaje, recuperación, carga Excel real con el rol más restringido, cierre de sesión al refrescar, cookie HttpOnly temporal (sin expiración fija), latido de pestaña y logout.

## Migración a backend real

El contrato ya es el de un backend: sustituir la verificación interna de la route handler `login` por la llamada al servicio de autenticación externo, manteniendo el mismo shape de `SesionPublica` y la misma cookie. Ni el proxy ni el cliente requieren cambios.
