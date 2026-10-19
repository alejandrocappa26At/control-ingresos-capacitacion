# INFORME TÉCNICO — AT People · Plataforma de Control de Ingresos y Capacitación

**Fecha del informe:** 16 de octubre de 2026
**Repositorio:** `github.com/alejandrocappa26At/control-ingresos-capacitacion` (rama `main`)
**Commit de referencia:** `6f84dcd`
**Entorno productivo:** `https://control-ingresos-capacitacion.vercel.app`
**Alcance del informe:** descripción textual completa de cómo está construido el proyecto: estructura de carpetas, arquitectura, autenticación, autorización, pipeline de importación de Excel, lógica de negocio (KPIs), estilos, pruebas y despliegue.

---

## 1. Resumen ejecutivo

AT People es una **aplicación web analítica interna** para gestionar el proceso de ingreso, capacitación y caída de promotores de ventas. El usuario sube un archivo Excel de capacitación (hojas "CAPACITACIÓN LIMA" y "CAPACITACIÓN PROVINCIA") y la plataforma, **100% en el navegador**, parsea el libro, clasifica a cada promotor, calcula decenas de indicadores (KPIs) y los presenta en dashboards con gráficos, rankings, matrices y filtros avanzados.

Características principales:

- **Framework:** Next.js 16.3.4 (App Router) + React 19 + TypeScript estricto.
- **Sin base de datos:** los datos viven solo en memoria (Zustand); cada sesión de trabajo comienza con una carga de Excel. La migración a un backend real está prevista y documentada.
- **Autenticación propia:** hash scrypt + cookie HttpOnly firmada HMAC-SHA256 + política de sesión única (F5 cierra la sesión).
- **Autorización RBAC:** 4 roles, 5 permisos, validada en el servidor (proxy), en el cliente (AuthGate) y en la UI (menú y pantallas).
- **Despliegue:** Vercel (producción automática desde `main`), sin configuración especial más allá de la variable `SESSION_SECRET`.
- **Calidad:** suite de verificación de RBAC (unit + E2E con navegador real), chequeo de rangos de KPI, benchmark reproducible de importación y auditorías de consistencia en consola.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Uso en el proyecto |
|---|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.3.4 | Páginas, rutas API, proxy (middleware), fuentes y metadata |
| UI | React | 19.2.8 | Toda la interfaz (componentes cliente) |
| Lenguaje | TypeScript (modo `strict`) | 5.x | Tipado completo del dominio (`Promotor`, `Kpis`, `FilterState`…) |
| Estilos | Tailwind CSS v4 (CSS-first, sin `tailwind.config`) | 4.x | Design tokens en `@theme` dentro de `globals.css` |
| Estado | Zustand | 5.x | Stores globales: datos (`useDataStore`) y sesión (`useSessionStore`) |
| Gráficos | ECharts + echarts-for-react | 6.x / 3.x | Barras, área, treemap, donut, funnel, heatmap, leaderboard |
| Tablas | TanStack Table | 8.x | `DataTable` con paginación (10 por página) |
| Excel | XLSX (SheetJS) | 0.18.5 | Lectura del libro en Web Worker |
| Exportación | file-saver + PapaParse | 2.x / 5.x | Exportar Excel y CSV (CSV con BOM para Excel) |
| Fechas | date-fns | 4.x | Utilidades de fecha (etiquetas de UI; el parser usa formato manual propio por rendimiento) |
| Animaciones | Framer Motion | 13.x | Transiciones del login, modales, micro-interacciones |
| Iconos | lucide-react | 1.x | Iconografía de la UI |
| Toasts | sonner | 2.x | Notificaciones (importación exitosa/errónea) |
| Formularios | react-hook-form | 7.x | Disponible en el proyecto |
| Testing E2E | playwright-core (Edge del sistema) | 1.x | Suite `check:rbac:e2e` en navegador real |
| Lint | ESLint 9 (flat config) | 9.x | `eslint-config-next/core-web-vitals` + `/typescript` |

---

## 3. Estructura del repositorio

### 3.1 Árbol de directorios (completo, según `git ls-files`)

```
capacitacion-app/
├── package.json / package-lock.json / tsconfig.json
├── next.config.ts                  # configuración vacía (defaults de Next 16)
├── eslint.config.mjs               # ESLint 9 flat config
├── postcss.config.mjs              # Tailwind v4 vía PostCSS
├── AGENTS.md / CLAUDE.md / README.md
├── INFORME-ARQUITECTURA-AT-PEOPLE.md   # este informe
├── public/                         # logo1at.jpg (sidebar), logo2at.png (login), logo3at.png (favicon), iconos PNG
├── scripts/                        # calidad, auditorías y benchmarks (ver §14)
│   ├── check-rbac.mjs              # verificación unitaria de RBAC + directorio de usuarios
│   ├── check-rbac-e2e.mjs          # E2E real con navegador (4 usuarios)
│   ├── check-rangos-kpi.mjs        # fronteras exactas de los indicadores
│   ├── bench-import.mjs            # benchmark reproducible de importación (10k/30k/60k filas)
│   ├── gen-user-hash.mjs           # genera hashes scrypt para nuevos usuarios
│   ├── check-kpis.mjs, check-capacitadores.mjs, check-etiquetas.mjs, check-momento-caida.mjs
│   ├── audit-estados-reclutadores.mjs, audit-total-dias.mjs   # auditorías sobre Excel real
│   ├── scan-sheets.mjs, screenshot-login.mjs, measure-guia-height.mjs
│   └── ts-resolve.mjs / ts-hooks.mjs   # permiten importar TS (alias @/) desde scripts .mjs
└── src/
    ├── proxy.ts                    # guardia de rutas de Next 16 (reemplaza a middleware.ts)
    ├── app/                        # App Router
    │   ├── layout.tsx              # raíz: fuentes, metadata, ErrorBoundary, AppShell, Toaster
    │   ├── globals.css             # design tokens + clases premium (~542 líneas)
    │   ├── page.tsx                # /  → Dashboard general (8 KPIs + gráficos)
    │   ├── login/page.tsx          # /login
    │   ├── upload/page.tsx         # /upload → Dropzone
    │   ├── capacitacion/page.tsx   # /capacitación → rendimiento de capacitadores
    │   ├── caidas/page.tsx         # /caidas → dashboard ejecutivo de caídas + Matriz de Reclutadores
    │   └── api/
    │       ├── auth/login/route.ts     # POST login
    │       ├── auth/session/route.ts   # GET sesión vigente
    │       ├── auth/logout/route.ts    # POST logout
    │       └── health/route.ts         # GET diagnóstico de despliegue (público)
    ├── lib/                        # módulos isomórficos (puros, sin Node APIs salvo donde se indica)
    │   ├── rbac.ts                 # fuente de verdad de roles y permisos
    │   ├── auth.ts                 # cliente fetch de las rutas de auth
    │   ├── authCookies.ts          # constantes de la cookie de latido
    │   ├── sessionLifecycle.ts     # detección de F5 + latido de pestaña
    │   ├── constants.ts            # hojas/columnas requeridas, MAX_DAYS=10, MAX_TOTAL_DIAS=12
    │   ├── dates.ts                # parseo de fechas Excel (serial y texto) + helpers de período
    │   ├── etapa.ts / filterDescriptions.ts / utils.ts
    ├── server/auth/                # SOLO servidor (nunca se importa desde cliente)
    │   ├── users.ts                # directorio de usuarios (hashes scrypt)
    │   ├── session.ts              # firma/verificación HMAC-SHA256 del token
    │   ├── passwords.ts            # scrypt + comparación en tiempo constante
    │   └── README.md               # documentación de la arquitectura de autenticación
    ├── types/index.ts              # modelo de datos completo del dominio
    ├── store/                      # Zustand: useDataStore (datos/filtros), useSessionStore
    ├── hooks/                      # useAppData (motor de analítica), useDebounce, useMediaQuery
    ├── services/
    │   ├── excel/                  # pipeline de importación (parseWorkbook, reader, worker, progress)
    │   ├── analytics/              # lógica de KPIs (kpis, desercionBase, reclutadores, falls, charts, zonas, validacion…)
    │   ├── validators/excelValidator.ts   # resolución de columnas por alias
    │   └── export/exporter.ts      # exportación Excel/CSV
    └── components/                 # UI organizada por dominio
        ├── layout/     (AppShell, Sidebar, Header)
        ├── auth/       (AuthGate, LoginScreen, Login/*, AccesoRestringido)
        ├── upload/     (Dropzone)
        ├── dashboard/  (KpiCard, caidas/, capacitacion/, reclutadores/, zonas/, sedes/, shared/)
        ├── charts/     (EChart, charts.tsx, premium.tsx, IngresosPorMes, SedeRanking)
        ├── filters/    (FilterDrawer, MultiSelect, DateRange, Chips…)
        ├── ui/         (button, card, badge, modal, progress, skeleton, tooltip…)
        ├── tables/, modals/, timeline/, common/
```

### 3.2 Configuración raíz

- **`next.config.ts`**: objeto de configuración vacío — todo son defaults de Next 16.
- **`tsconfig.json`**: `strict: true`, `moduleResolution: "bundler"`, alias único `"@/*" → "./src/*"`.
- **`src/proxy.ts`** (Next 16 renombró `middleware.ts` a `proxy.ts`): excluye de su matcher `api`, `_next/static`, `_next/image` e imágenes, de modo que las rutas de login/session/logout sean alcanzables sin cookie.
- **No existe `vercel.json`**: el despliegue usa la detección automática de Vercel para Next.

---

## 4. Arquitectura general

### 4.1 Patrón de la aplicación

- **Renderizado híbrido con toda la lógica de datos en el cliente**: las páginas son componentes `'use client'`; el servidor solo interviene en (a) las 3 rutas de autenticación, (b) el proxy de protección de rutas y (c) el endpoint de salud.
- **El procesamiento del Excel ocurre íntegramente en el navegador**, en un **Web Worker**, por lo que no consume cuota ni tiempo del servidor (Vercel serverless) y soporta archivos de 100 MB+.
- **No hay React Context**: el estado global se maneja con dos stores Zustand.
- **Módulos isomórficos**: `rbac.ts`, `dates.ts`, `constants.ts` y los servicios de analytics son funciones puras compartidas por cliente y servidor.

### 4.2 Flujo de datos de extremo a extremo

```
Archivo .xlsx
   │  (Dropzone, en /upload)
   ▼
reader.ts ──► Web Worker (reader.worker.ts)          [etapas con progreso real]
   │              └─► parseWorkbook.ts: lectura en 2 pasadas (nombres de hojas; luego hojas requeridas en modo dense)
   │                    ├─► excelValidator.resolveColumns (columnas por alias)
   │                    ├─► normalización por fila (fechas, asistencia, estados) → Promotor[]
   │                    └─► computeKpis → meta
   ▼
useDataStore.setRecords(records)      [Zustand, memoria]
   ▼
useAppData (useMemo sobre records + filters + searchTerm)
   ├─ selectFilteredRecords  → filtrado multi-criterio
   ├─ computeKpis / computeEmbudo / series / rankings
   ▼
Páginas: / (dashboard), /capacitacion, /caidas  →  componentes renderizan (la lógica vive en services/)
```

---

## 5. Modelo de datos (`src/types/index.ts`)

La entidad central es **`Promotor`** (no "registro"), construida por cada fila del Excel:

- **Identificación:** `id` (`` `${jurisdiccion}-${index}-${dni}` ``), `dni`, `apellidosNombres`, `origenHoja`.
- **Organización:** `jurisdiccion` (`'LIMA' | 'PROVINCIA'`), `zonaComercial`, `sede`, `distrito`, `nombreTienda`, `supervisor`, `responsableAS`.
- **Capacitación:** `modalidad`, `capacitador`, `fechaIngreso`, `inicioCapacitacion`, `finCapacitacion`, `entregaOperaciones`.
- **Asistencia:** `asistencia: Array<1|0|null>` (hasta 10 días), `diasAsistidos`, `diasFaltantes`, `totalDias: number|null`.
- **Resultado:** `pasaAOperaciones: 1|0|null`, `motivoCaida`, `subMotivoCaida`.
- **Clasificación derivada:** `resultado` (`APROBADO | NO_APROBADO | PENDIENTE`), `estado` (`EN_CAPACITACION | APROBADO | NO_APROBADO | PENDIENTE`), `fechasISO` (fechas en ISO para filtrado).

Otros tipos clave:

- **`FilterState`**: 11 filtros multi-select (jurisdicción, zona, sede, distrito, tienda, supervisor, responsable, capacitador, pasa a operaciones, motivo, submotivo), modalidad (single) y 3 filtros de fecha con modos `all|day|month|year|range`.
- **`Kpis`**: 14 métricas del dashboard con las reglas de negocio comentadas en el propio código.
- **`ParseMeta`**: totales de la carga (registros, Lima, Provincia, **duplicados auditados**).
- **`ParseResult` / `ValidationIssue`**: resultado del parseo con errores tipados (`sheet` | `column`).

---

## 6. Autenticación (sin librerías externas: criptografía nativa)

La arquitectura está documentada además en `src/server/auth/README.md`.

### 6.1 Hash de contraseñas (`src/server/auth/passwords.ts`)

- Algoritmo **scrypt** de `node:crypto` con parámetros exactos: **`N = 16384, r = 8, p = 1, KEYLEN = 64`**, salt aleatorio de 16 bytes (`randomBytes(16)` en hex).
- Formato almacenado: `scrypt$N$r$p$saltHex$hashHex`.
- Verificación con **`timingSafeEqual`** (comparación en tiempo constante).
- Existe un **`DUMMY_HASH`** (`hashPassword('dummy-timing-equalizer')`): si el usuario no existe, el login **igualmente verifica** contra este hash para que el tiempo de respuesta no revele qué usernames existen (anti-enumeración).
- **El texto plano de las contraseñas nunca existe en el código.**

### 6.2 Directorio de usuarios (`src/server/auth/users.ts`)

- Array **hardcodeado, solo servidor**, con `username`, `displayName`, `role`, `passwordHash`.
- Lookup con `findUsuario` **case-insensitive + trim**.
- Alta de usuarios: ejecutar `scripts/gen-user-hash.mjs` con la contraseña por variable de entorno (`CIC_HASH_PASS`) y pegar el hash resultante.

### 6.3 Token y cookie de sesión (`src/server/auth/session.ts`)

- Token **HMAC-SHA256** firmado con Web Crypto (compatible Edge y Node): formato `body.firma` en base64url.
- Payload mínimo: `SessionPayload { u: string; r: Rol; exp: number }` (usuario, rol, expiración).
- Secreto: **`process.env.SESSION_SECRET`**. En producción, si falta, se lanza `'[auth] SESSION_SECRET es obligatorio en producción.'` (el login devuelve un 500 genérico). En desarrollo existe un fallback explícito `'cic-dev-secret-cambiar-en-produccion'`.
- Cookie **`cic_session`**: `httpOnly`, `sameSite: 'lax'`, `secure` en producción, `path: '/'` y **sin `Max-Age`** → es una cookie de sesión: muere al cerrar el navegador.
- Duración de respaldo del token: `SESSION_DURATION_MS = 30 días`.
- Verificación del token con comparación en tiempo constante; token malformado, alterado, expirado o con rol inexistente → rechazado.

### 6.4 Sesión única: cookie de latido (`src/lib/authCookies.ts`, `src/lib/sessionLifecycle.ts`)

- Cookie **`cic_tab`** (latido): TTL **180 s**, reescrita cada **30 s** mientras la pestaña está abierta.
- El endpoint `GET /api/auth/session` exige **firma + expiración + latido vigente**.
- **Política deliberada de sesión única:**
  - **F5/refresh → cierra la sesión** (detectado con `PerformanceNavigationTiming.type === 'reload'`), el usuario debe volver a iniciar sesión.
  - **Cerrar la pestaña/navegador → el latido deja de refrescarse** y la sesión caduca en ≤180 s.
  - **Navegar a otra URL de la app → NO cierra la sesión** (solo F5 la cierra).

### 6.5 Rutas API (`src/app/api/auth/*`)

| Ruta | Método | Comportamiento |
|---|---|---|
| `/api/auth/login` | POST | Valida credenciales (scrypt, dummy-hash si el usuario no existe), firma el token, devuelve `{ user, displayName, role, permissions }` y setea `cic_session` + `cic_tab` |
| `/api/auth/session` | GET | Verifica firma + expiración + latido; si el usuario fue dado de baja del directorio → 401 aunque el token no expire |
| `/api/auth/logout` | POST | Borra ambas cookies (`maxAge: 0`), idempotente |

### 6.6 Tres capas de protección de rutas

1. **Servidor — `src/proxy.ts`:** sin sesión válida (o sin latido) → redirect a `/login`; con sesión pero sin permiso para la ruta → redirect al home del rol con `?denied=<permiso>`.
2. **Cliente — `AuthGate`:** bootstrap de la sesión al montar, redirecciones, mantenimiento del latido; en F5 cierra la sesión.
3. **UI — `AppShell`:** pantalla **"Acceso restringido"** si llega `?denied=` o la ruta no corresponde al rol; el menú (`Sidebar`) se filtra por los permisos del rol.

---

## 7. Control de acceso basado en roles (RBAC) — `src/lib/rbac.ts`

Módulo **isomórfico y puro**: es la **única fuente de verdad** de roles/permisos y la consumen el proxy (servidor), los route handlers y los componentes cliente.

### 7.1 Definición

- **Permisos (5):** `dashboard`, `reclutadores`, `capacitacion`, `caidas`, `upload_excel`.
- **Roles (4):**

| Rol | Etiqueta | Permisos | Alcance |
|---|---|---|---|
| `GERENTE_VENTAS` | Gerente de Ventas | los 5 | Acceso completo |
| `CAPACITACION` | Capacitación | `capacitacion`, `upload_excel` | Solo capacitación y carga |
| `GDT` | GDT | `dashboard`, `caidas`, `upload_excel` | Dashboard y caídas (sin capacitación) |
| `JEFA_CAPACITACION` | JEFA_CAPACITACION | los 5 | Acceso completo / administrador operativo |

### 7.2 Mapeo ruta ↔ permiso (`permisoParaPath`)

`/` → `dashboard` · `/capacitacion*` → `capacitacion` · `/caidas` → `caidas` · `/upload` → `upload_excel` · resto (`/login`, `/api/*`) → `null`.

### 7.3 Home por rol (`homePath`)

Con permiso `dashboard` → `/`; si no, con `capacitacion` → `/capacitacion`; si no → `/upload`.

### 7.4 Aplicación efectiva

- **Servidor:** proxy valida cada navegación.
- **Cliente:** `AuthGate` + `AppShell` (`puedeAcceder`).
- **Menú:** `Sidebar` renderiza solo las secciones cuyo permiso posee el rol; el pie muestra chips con los permisos concedidos.
- **Nota de dominio:** la **Matriz de Reclutadores es una sección dentro de `/caidas`**; el permiso `reclutadores` es explícito de `GERENTE_VENTAS` y `JEFA_CAPACITACION`, y `GDT` accede a `/caidas` completo.

### 7.5 Usuarios actuales (5)

| Username | Nombre visible | Rol |
|---|---|---|
| `Mauricio.Guerra` | Mauricio Guerra | `GERENTE_VENTAS` |
| `Capacitacion.At` | Capacitación AT | `CAPACITACION` |
| `Gdt.At` | GDT AT | `GDT` |
| `Tatiana.Patricia` | Jefa de Capacitación | `JEFA_CAPACITACION` |
| `Hiroshi.Shimatsu` | Hiroshi Shimatsu | `GERENTE_VENTAS` |

---

## 8. Pipeline de importación de Excel (`src/services/excel/`)

### 8.1 Etapas con progreso real (`progress.ts`)

`leer` (10%) → `hojas` (20%) → `columnas` (40%) → `registros` (40–60%) → `kpis` (80%) → `fin` (100%), con mensajes en español y conteo de registros procesados (chunks de **1000 filas**). La UI muestra etapa, porcentaje, tiempo transcurrido y registros — **sin porcentajes inventados**.

### 8.2 Ejecución (`reader.ts` + `reader.worker.ts`)

- Extensiones permitidas: `.xlsx` y `.xls`.
- Se intenta siempre el **Web Worker**; *timeout* de **15 s** para la primera señal (antes 5 s; en archivos grandes se mataba el worker y se reparseaba en el hilo principal, la principal causa de importaciones >4 min).
- Si el worker falla → **fallback en hilo principal** con cesión de CPU (`setTimeout(0)`) cada chunk.
- El `ArrayBuffer` se transfiere al worker (transferencia de buffer, sin copia).

### 8.3 Lectura del libro (`parseWorkbook.ts`)

- **Lectura en 2 pasadas:** 1ª con `bookSheets: true` para enumerar solo los nombres de hojas; valida que exista al menos una hoja requerida (`CAPACITACIÓN LIMA` / `CAPACITACIÓN PROVINCIA`, normalizando acentos). 2ª **solo de las hojas requeridas** con `dense: true, cellDates: true` y todas las características pesadas desactivadas (`bookVBA/bookFiles/bookProps/cellText/cellNF/cellStyles: false`). El modo *dense* entrega la hoja como matriz de celdas y acelera el parseo XML ~25%.
- Las hojas distractoras del archivo real (`CONSOLIDADO`, `ASIGNACIÓN`, `MOTIVOS_DE_BAJA`, `BD_TIENDAS`, etc.) **no se procesan**.
- La extracción de celdas se hace manualmente sobre el modo dense (evita `sheet_to_json`, que costaba ~1.8 s adicionales); existe fallback al modo clásico si dense no está disponible.
- `xlsx` se carga de forma **lazy con caché** para no incluirlo en el bundle inicial.
- **Instrumentación permanente:** `console.time` por fase (Lectura Excel, Validación, Registros, KPIs) con tabla de cuello de botella — la medición manda: solo se optimiza lo que la medición justifica.

### 8.4 Resolución de columnas (`validators/excelValidator.ts`)

- `findHeaderRow`: busca la fila de encabezado entre las primeras filas del sheet (la que maximice columnas reconocidas).
- `resolveColumns`: **3 pasadas** por campo (exacta → *startsWith* → *contains*), tokenizando por `/ _ - ( )` y espacios; cada columna se asigna una sola vez. **19 campos** de negocio con múltiples alias (incluye el typo real del archivo fuente `'RESPONSABEL A&S'`), más las **10 columnas de asistencia** detectadas por regex (`ASISTENCIA DÍA n` / `DIA n` / `D n`, para n = 1..10).
- Solo `jurisdiccion` y `totalDias` son opcionales; si falta una columna obligatoria se emite el error `No se puede procesar el archivo porque falta la columna [LABEL]`.
- **Jurisdicción:** se impone por hoja (LIMA/PROVINCIA); si la hoja no lo indica, se lee de la celda; filas sin valor quedan contabilizadas.

### 8.5 Normalización de valores (reglas exactas)

| Campo | Regla |
|---|---|
| Texto | colapsa espacios; vacío → `'—'` |
| Fecha | serial Excel (epoch `1899-12-30`) o string `d/M/yyyy`, `d-M-yyyy`, `yyyy-MM-dd`, `yyyy/MM/dd`; display `dd/MM/yyyy` + ISO en hora local; textos `pendiente / sin registro / n/a / -` → `'Pendiente'` |
| Asistencia día | `1|SI|SÍ|ASISTIO|ASISTIÓ|X|PRESENTE` → 1; `0|NO|FALTO|FALTÓ` → 0; resto → null |
| Pasa a operaciones | `1|SI|SÍ|PASA|APROBADO|OK` → 1; `0|NO|NO PASA|DESAPROBADO|CAIDO|CAÍDO|CÁIDO` → 0; resto → null |
| Total de días | entero ≥ 0; textos no numéricos → null |
| Derivados | `diasFaltantes = MAX_DAYS(10) − diasAsistidos`; `resultado` (1→APROBADO, 0→NO_APROBADO, si no PENDIENTE); `estado` (APROBADO / NO_APROBADO / EN_CAPACITACION) |

### 8.6 Deduplicación: auditoría, no descarte

Los duplicados **no se descartan** (regla de negocio): se cuentan por DNI y se auditan — `meta.totalDuplicados = Σ(repeticiones − 1)`, se imprime `[AUDITORIA]` en consola y se muestra en el toast de importación ("Duplicados detectados: N"). Cada fila conserva su `id` único.

### 8.7 Rendimiento (medido, no estimado)

Benchmark permanente `npm run bench:import` (archivos sintéticos 10k/30k/60k filas, ~17/51/104 MB, caché en `%TEMP%`). Resultado tras la optimización (paridad de KPIs verificada con huella sha256 idéntica antes/después):

| Filas | Antes | Después | Ganancia |
|---|---|---|---|
| 10.000 | 7,52 s | 4,77 s | −37% |
| 30.000 | 16,18 s | 12,74 s | −21% |
| 60.000 | 25,66 s | 18,02 s | −30% |

Cuello de botella restante: `XLSX.read` concentra ~75% del tiempo (límite del motor, no se modifica por riesgo de paridad). En navegador real: import de 10k filas ≈ 9,2 s muro; viaje completo carga→dashboard ≈ 15,2 s.

---

## 9. Lógica de negocio: KPIs y reglas (`src/services/analytics/`)

Principio rector documentado en `services/analytics/README.md`: **los umbrales viven solo en `INDICADORES_KPI`**; los componentes solo renderizan.

### 9.1 Clasificación base (`desercionBase.ts` — fuente única del dashboard)

- **Inició capacitación:** `totalDias != null && totalDias >= 1`.
- **Deserción (dashboard):** `totalDias === 0 && pasaAOperaciones === 0` ("nunca inició").
- **Aprobado:** inició y `pasa = 1` · **Baja en capacitación:** inició y `pasa = 0` · **En capacitación:** inició y `pasa` vacío.
- **Capacitación finalizada:** inició y `pasa` tiene valor (1 o 0).
- **Sin clasificar:** ni inició ni deserción (dato faltante; en dev se avisa si > 0).
- **Particiones que deben cerrar:** `INICIAN = APROBADOS + BAJAS + EN CAPACITACIÓN` y `TOTAL INGRESOS = DESERCIÓN + INICIAN + SIN CLASIFICAR`.

### 9.2 KPIs del dashboard (`kpis.ts`, 8 tarjetas)

Total Ingresos · Inician Capacitación · En Capacitación · Capacitación Finalizada · Aprobados · Bajas durante Capacitación · Deserción · % Aprobación. Fórmulas:

- `porcentajeAprobacion = pasanAOperaciones ÷ inicianCapacitacion × 100`
- `porcentajeBajas = bajasCapacitacion ÷ inicianCapacitacion × 100`
- `porcentajeDesercion = desercion ÷ totalIngresos × 100`
- `provincia = totalIngresos − lima`

### 9.3 Indicadores de reclutadores (`reclutadores.ts` — semáforo)

| Indicador | Fórmula | Dirección | 🟢 Excelente | 🟡 Aceptable | 🟠 Riesgo | 🔴 Crítico |
|---|---|---|---|---|---|---|
| Tasa de deserción | (Deserciones ÷ Ingresos) × 100 | menor es mejor | ≤ 5% | >5–10% | >10–15% | >15% |
| Tasa de baja en capacitación | (Bajas en Capacitación ÷ Ingresos) × 100 | menor es mejor | ≤ 8% | >8–12% | >12–18% | >18% |
| Tasa total de caídas | ((Deserciones + Bajas) ÷ Ingresos) × 100 | menor es mejor | ≤ 5% | >5–10% | >10–15% | >15% |
| Tasa de permanencia | ((Aprobados + En Capacitación) ÷ Ingresos) × 100 | mayor es mejor | ≥ 95% | 90–95% | 85–90% | <85% |

Colores: `#22c55e` / `#eab308` / `#f97316` / `#dc2626`. Identidad de reclutador: campo `responsableAS` (registros sin responsable se excluyen y se contabilizan). Ecuación del módulo: `TOTAL INGRESOS A CAPACITACIÓN = APROBADOS + CAÍDAS EN CAPACITACIÓN + CAÍDAS POR DESERCIÓN + EN CAPACITACIÓN`.

### 9.4 KPIs de caídas (`falls.ts`)

- Caídas = `pasaAOperaciones === 0`; rankings por motivo y submotivo con porcentaje.
- **Momento de salida:** siempre 13 buckets — `'Nunca asistió'` + `'Día 1' … 'Día 12'` (`MAX_TOTAL_DIAS = 12`); las bajas se recortan al rango 1..12.
- **Embudo de capacitación** (`computeEmbudo`): Total Ingresos → Inician → Deserción/Bajas → Pasan a Operaciones, con `integridad` booleana (la suma debe cerrar con el total) y detección de inconsistencia `pasan > inician`.
- **Heatmap** supervisor × sede; **promotores en riesgo de desaprobación**: `esperado ≥ 3 && diasAsistidos < esperado − 1` (avance esperado por defecto: 10 días); nivel alto si hay > 5 en riesgo.

### 9.5 Capacitadores (`charts.ts` → `analizarCapacitadores`)

Partición **excluyente** por capacitador replicando las reglas de `desercionBase`; excluye capacitadores genéricos (`PROMOTOR`, `-`, `N/A`, `SIN CAPACITADOR`, `PENDIENTE`, `VACÍO`); calcula `diferenciaTotal` y `desbalances` para detectar Excel incompleto.

### 9.6 Auditorías de consistencia en consola (se ejecutan en cada recálculo)

- `validarConsistenciaDesercion`: `SUMA RESPONSABLE A&S = SUMA SUPERVISORES = SUMA TIENDAS = SUMA MOMENTO DE SALIDA = TOTAL DESERCIONES` (y por mes, zona y capacitador), listando hasta 20 registros excluidos con su motivo.
- `validarCalculosReclutadores` y `auditarTotalDias` (limitado a 20 líneas de detalle para no provocar lag).
- `diagnosticoClasificacion`: calcula las diferencias de partición (`diferenciaIniciaron`, `diferenciaTotal`, etc.).

### 9.7 Definiciones convivientes (transparencia para revisión)

Existen **dos definiciones de "deserción"** y son **deliberadas** por pertenecer a módulos distintos:

1. **Dashboard (`desercionBase`):** `totalDias === 0 && pasa === 0` — estricta; los casos faltantes quedan como "Sin clasificar" y se auditan.
2. **Módulo de Caídas/Reclutadores (`reclutadores.ts`):** `totalDias == null || totalDias === 0` — matiza e incluye los vacíos; además detecta "anomalía de estados" (deserción con `pasa = 1`, dato contradictorio que se cuenta como deserción).

Ambas están documentadas en sus respectivos README/módulos; cambiar una sin la otra alteraría los tableros, por lo que se mantienen como están.

---

## 10. Estado global y filtrado

- **`useDataStore` (Zustand):** `records`, `filters`, `searchTerm`, `uploadMeta`, `isProcessing`, UI flags. `setRecords` resetea filtros y búsqueda.
- **`selectFilteredRecords`** — motor de filtrado puro: listas multi, zona normalizada, matching bidireccional de capacitadores (tokeniza con `/ , ; |`), resultado mapeado a `'1'|'0'|'Pendiente'`, motivos/submotivos, 3 filtros de fecha (día/mes/año/rango) sobre `fechasISO`, y búsqueda libre (DNI, nombre, tienda, supervisor, capacitador, distrito, sede).
- **`useAppData` (hook central):** memoizado con `useMemo` sobre `[records, filters, searchTerm]`; ejecuta `computeKpis`, `computeEmbudo`, series de gráficos, `analizarCapacitadores` y rankings; mide tiempos (`Filtros`, `Gráficos`).
- **UI de filtros:** `FilterDrawer` (portal, grupos colapsables), `FilterChips` removibles con descripción legible, `PeriodoAnalisis`, `DateRangePicker`, `CapacitadorMultiSelect`, `ResultsFilter`. Búsqueda global con debounce de 250 ms.

---

## 11. Interfaz: páginas y componentes

| Ruta | Contenido | Permisos requeridos |
|---|---|---|
| `/login` | Login premium (panel visual + formulario), logo `logo2at` con resplandor rojo | pública |
| `/` | Dashboard: 8 KPIs, Ingresos por Mes, por Jurisdicción, por Zona Comercial (top 8), por Sede con modales de detalle | `dashboard` |
| `/capacitacion` | 6 KPIs, Rendimiento de Capacitadores, tabla y modal de detalle | `capacitacion` |
| `/caidas` | Dashboard ejecutivo de caídas: funnel KPIs, momento de salida, rankings por sede/supervisor, análisis de zonas, **Matriz de Reclutadores** con guía de interpretación, ranking de motivos | `caidas` |
| `/upload` | `Dropzone` con drag&drop, progreso por etapas y meta de la última carga | `upload_excel` |

Organización de `src/components/`: `layout/` (AppShell con fondo aurora, Sidebar con badges KPI, Header con título por ruta), `auth/`, `upload/`, `dashboard/` (por subdominio: `caidas/`, `capacitacion/`, `reclutadores/`, `zonas/`, `sedes/`, `shared/`), `charts/` (wrappers ECharts + gráficos "premium"), `filters/`, `ui/` (design system), `tables/`, `modals/`, `timeline/`, `common/` (`ErrorBoundary`, `NoDataYet`).

---

## 12. Sistema de diseño (`src/app/globals.css`, ~542 líneas)

- **Tailwind v4 CSS-first:** tokens en bloque `@theme`; no hay `tailwind.config.*`.
- **Tema: "Power BI Premium · Dark Enterprise", oscuro permanente.** Paleta: canvas `#0b0f17`, tarjetas `#111827`/`#161d2e`/`#1e293b`, líneas `rgba(255,255,255,0.08)`, texto `#f8fafc`/`#94a3b8`/`#64748b`, **marca roja `--brand-500: #e30613`** (escala completa 50–950).
- **Fuentes:** Plus Jakarta Sans (variable) + Geist Mono (códigos `.kbd`), cargadas con `next/font`.
- **Clases premium:** `.bg-mesh`, `.aurora` (blobs animados), `.glass` (backdrop-blur), `.glow-*`, `.gradient-text`, `.gradient-border`, `.aurora-border` (borde cónico animado con `@property --aurora-angle`; se acelera en el Dropzone activo y se detiene con `prefers-reduced-motion`), animaciones `fade-in/scale-in/shimmer/float/aurora-drift`.
- **Metadata e identidad:** título `AT People | Gestión de Talento`, favicon local `logo3at` (32/16 + apple-touch), `<html lang="es">`.

---

## 13. Exportación (`src/services/export/exporter.ts`)

- **Excel** (`.xlsx`) y **CSV** (con BOM UTF-8 para que Excel abra tildes correctamente), nombre `capacitacion_aaaaMMdd.xlsx|csv`.
- 23 columnas de negocio + columnas de asistencia Día 1–10 con valores legibles («Asistió / No asistió / Sin registro»).

---

## 14. Calidad y pruebas automatizadas (`scripts/` + npm scripts)

| Comando npm | Qué valida | Estado |
|---|---|---|
| `npm run check:rbac` | Roles exactos por usuario, ausencias por rol, mapeo ruta↔permiso, `homePath`, round-trip y rechazo de tokens firmados falsos/alterados/expirados, nombre de cookie `cic_session`, **5 usuarios con hash scrypt sin texto plano**, `findUsuario` case-insensitive, y (con env `CIC_PASS_*`) **verificación positiva de los 5 hashes** contra sus contraseñas | ✅ OK |
| `npm run check:rbac:e2e` | **E2E con navegador real** (playwright-core + Edge): login correcto/incorrecto, menú por rol, acceso a módulos permitidos, bloqueo de rutas no permitidas con pantalla «Acceso restringido», carga de Excel sintético con el rol más restringido, refresco → reingreso, cookie HttpOnly temporal, latido y logout. 4 usuarios × 9 verificaciones = **36/36** | ✅ 36/36 |
| `npm run check:rangos` | Fronteras inclusivas de `INDICADORES_KPI` (5/10/15 y 8/12/18 y 95/90/85), que no existan rangos compartidos entre indicadores, fórmulas de partición y tasas recalculadas a mano, alineación del semáforo de zonas | ✅ OK |
| `npm run bench:import` | Benchmark de importación (10k/30k/60k) por etapas + huella sha256 de paridad de registros | ✅ OK |
| `npm run lint` / `npx tsc --noEmit` | ESLint 9 (next/core-web-vitals + typescript) y type-check estricto | ✅ OK |
| `npm run build` | Build de producción (12 rutas) | ✅ OK |

Además: `check-kpis`, `check-capacitadores`, `check-momento-caida`, `check-etiquetas` (particiones y etiquetas), `audit-estados-reclutadores` / `audit-total-dias` (replican las reglas del parser sobre un Excel real por argv), `gen-user-hash` (alta de usuarios sin exponer la contraseña en argv ni logs).

**Validaciones de aceptación recientes (16-oct-2026):** nuevo usuario `Hiroshi.Shimatsu` verificado 13/13 en navegador (login, 4 módulos, carga real de 10k filas, KPIs, filtros, política F5, re-login, rechazo de password incorrecta); regresión completa de los 4 usuarios originales; smoke en build de producción (`:3001`) y sondeos en vivo contra Vercel (login 200 con rol y permisos, control existente 200, credenciales cruzadas 401).

---

## 15. Despliegue y operación

- **Plataforma:** Vercel, despliegue automático al hacer push a `main`. Sin `vercel.json`.
- **Verificación de despliegue:** `GET /api/health` (público) devuelve `{ ok, app, commit, ambiente, sessionSecretConfigurado }` — `commit` proviene de `VERCEL_GIT_COMMIT_SHA`, y `sessionSecretConfigurado` es un booleano (**nunca** expone el valor). Permite confirmar qué commit está en producción y diagnosticar el problema clásico de login 500.
- **Variables de entorno:**
  - `SESSION_SECRET` — **obligatoria en producción** (generar con `openssl rand -hex 32`); sin ella, `/api/auth/login` devuelve 500. Ya está configurada en Vercel (verificado en vivo).
  - Legado sin uso en `.env.local`: `APP_USER`, `APP_PASSWORD`, `NEXT_PUBLIC_APP_USER`, `NEXT_PUBLIC_APP_PASSWORD` (quedaron de una versión previa; el código no las referencia — se recomienda eliminarlas).
- **Alta de usuarios en producción:** requiere commit (el directorio vive en el código); no hay base de datos ni migración.
- **Importación en producción:** al ejecutarse en el navegador, no aplica límite de duración de funciones serverless.

---

## 16. Seguridad — resumen

1. Contraseñas **solo como hash scrypt** (`N=16384`), salt por usuario, verificación en tiempo constante, dummy-hash anti-enumeración de usuarios.
2. Cookie de sesión **HttpOnly** (inaccesible desde JS), `SameSite=Lax`, `Secure` en producción, firmada **HMAC-SHA256** con `SESSION_SECRET` (obligatoria en prod).
3. **Validación en el servidor** en cada navegación (proxy) y en `GET /api/auth/session`; el frontend no es la fuente de autoridad.
4. **Política de sesión única:** F5 cierra la sesión; pestaña cerrada caduca vía latido `cic_tab` (TTL 180 s).
5. El directorio de usuarios está **solo en el servidor**; ninguna credencial en `NEXT_PUBLIC_*` ni en el bundle del cliente.
6. Baja de usuario efectiva: eliminar la entrada del directorio invalida la sesión vigente (401) aunque el token no haya expirado.

---

## 17. Evolución del proyecto (historial Git — 24 commits)

| Fecha | Commit | Hito |
|---|---|---|
| 2026-09-08 | `0414ec7` | Initial commit from Create Next App |
| 2026-09-13/14 | `e74caf6`…`71760ea` | Primera versión, fix login |
| 2026-09-17 | `7898140`…`06528ba` | Estructura: componentes, analítica, `useAppData` |
| 2026-09-20/22 | `967d3ab`…`d83b3fa` | Dashboard, layout, estado, módulo de caídas |
| 2026-09-30 | `5236d79` | Core layout, hooks y páginas de capacitación |
| 2026-10-07 | `ae2d6d0`, `796cbed` | Analítica de reclutadores y funnel de caídas |
| 2026-10-13/14 | `9ee87ff`…`c9e1799` | Sistema de autenticación + RBAC completo, login premium, documentación |
| 2026-10-14 | `2dccea3`, `b03b5fe` | Endpoint `/api/health` (commit + estado de SESSION_SECRET) |
| 2026-10-16 | `a059e9c` | **Rendimiento de importación: hasta 37% más rápida** (lectura dense, fechas sin date-fns, worker 15 s) con paridad de KPIs verificada |
| 2026-10-16 | `6f84dcd` | **Usuario `Hiroshi.Shimatsu` con acceso completo** (GERENTE_VENTAS) |

---

## 18. Observaciones y limitaciones conocidas

1. **Sin persistencia:** los datos solo viven en memoria (Zustand); un refresco de página pierde la carga y requiere volver a subir el Excel. Es una decisión de arquitectura actual; la migración a backend real está prevista (reemplazar la route handler de login y el store, conservando el contrato `SesionPublica`).
2. **Dos definiciones de deserción** conviven por diseño (dashboard estricto vs. módulo de caídas que cubre vacíos) — detallado en §9.7; están documentadas en sus módulos.
3. **Cuello de botella irreducible:** `XLSX.read` concentra ~75% del tiempo de parseo; superarlo exigiría cambiar de motor Excel (riesgo de paridad de datos).
4. **Progreso de la etapa "lectura":** el parseo del libro es síncrono dentro del worker y no puede emitir sub-progreso; la UI muestra etapa, spinner y tiempo transcurrido.
5. **Ruido de consola (inofensivo):** warnings de `[KPIs] Partición incompleta` derivados de datos reales; la línea `REGISTROS SIN CATEGORÍA EN TOTAL DE DÍAS` se emite una vez por recálculo por instancia (acotada a ≤20 líneas de detalle); aviso de `scroll-behavior: smooth` en dev; aviso `MODULE_TYPELESS_PACKAGE_JSON` de Node.
6. **Higiene del repositorio:** `README.md` raíz sigue siendo el boilerplate de create-next-app (este informe lo sustituye funcionalmente); `next-dev.log` y `next-dev.err.log` están commiteados en la raíz y conviene eliminarlos del repo; `npm audit` reporta 10 vulnerabilidades en el árbol de dependencias (todas en dependencias transitivas; ninguna afecta la lógica de negocio).
7. **Pruebas E2E:** la navegación sintética sobre enlaces del sidebar colapsado no dispara el click de Playwright (la navegación por router funciona; es un artefacto del test, no del producto).
8. **Archivos de prueba cacheados:** el bench deja libros sintéticos en `%TEMP%/opencode/atpeople-bench/` reutilizables para pruebas manuales de UI.

---

*Informe generado a partir del estado real del código en el commit `6f84dcd` (rama `main`), incluyendo configuración, módulos, constantes y reglas de negocio tal como están implementadas.*
