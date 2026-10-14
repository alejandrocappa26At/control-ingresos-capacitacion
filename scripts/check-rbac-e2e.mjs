import { chromium } from 'playwright-core';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

/**
 * E2E del sistema de login + RBAC contra el dev server.
 *
 * Credenciales de prueba por variables de entorno (jamás en el repo):
 *   CIC_USER_GERENTE / CIC_PASS_GERENTE
 *   CIC_USER_CAP     / CIC_PASS_CAP
 *   CIC_USER_GDT     / CIC_PASS_GDT
 *   CIC_USER_JEFA    / CIC_PASS_JEFA
 *   (opcional) CIC_E2E_BASE, default http://localhost:3000
 */

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const BASE = process.env.CIC_E2E_BASE ?? 'http://localhost:3000';

const USERS = {
  gerente: { user: process.env.CIC_USER_GERENTE, pass: process.env.CIC_PASS_GERENTE, displayName: 'Mauricio Guerra', roleLabel: 'Gerente de Ventas' },
  cap: { user: process.env.CIC_USER_CAP, pass: process.env.CIC_PASS_CAP, displayName: 'Capacitación AT', roleLabel: 'Capacitación' },
  gdt: { user: process.env.CIC_USER_GDT, pass: process.env.CIC_PASS_GDT, displayName: 'GDT AT', roleLabel: 'GDT' },
  jefa: { user: process.env.CIC_USER_JEFA, pass: process.env.CIC_PASS_JEFA, displayName: 'Jefa de Capacitación', roleLabel: 'JEFA_CAPACITACION' },
};

if (Object.values(USERS).some((u) => !u.user || !u.pass)) {
  console.error('Defina CIC_USER_GERENTE/CIC_PASS_GERENTE, CIC_USER_CAP/CIC_PASS_CAP, CIC_USER_GDT/CIC_PASS_GDT y CIC_USER_JEFA/CIC_PASS_JEFA.');
  process.exit(1);
}

let failures = 0;
function check(name, ok, extra = '') {
  console.log(`${ok ? '  OK ' : '  FALLA '} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures += 1;
}

async function login(page, u) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.fill('#login-user', u.user);
  await page.fill('#login-password', u.pass);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 });
}

const navHrefs = (page) =>
  page.evaluate(() => [...document.querySelectorAll('nav a[href]')].map((a) => a.getAttribute('href')));

const cuerpo = (page) => page.evaluate(() => document.body.innerText);

function buildXlsx() {
  const wb = XLSX.utils.book_new();
  const headers = [
    'JURIDICCION', 'FECHA DE INGRESO', 'ZONA COMERCIAL', 'SEDE', 'DISTRITO',
    'NOMBRE DE TIENDA', 'SUPERVISOR', 'RESPONSABLE A&S', 'DNI', 'APELLIDOS Y NOMBRES',
    'MODALIDAD', 'CAPACITADOR', 'F. INICIO CAPACITACIÓN', 'F. FIN DE CAPACITACIÓN',
    'F. ENTREGA A OPERACIONES', 'TOTAL DE DÍAS', 'PASA A OPERACIONES',
    'MOTIVO DE CAIDA', 'SUB MOTIVO DE CAIDA',
    ...Array.from({ length: 10 }, (_, i) => `ASISTENCIA DÍA ${i + 1}`),
  ];
  const rows = [headers];
  for (let i = 0; i < 12; i++) {
    rows.push([
      'LIMA', '15/04/2026', 'ZONA 1', 'LARCOMAR', 'DISTRITO 1', `TIENDA ${i}`, 'SUP 1',
      'RAS E2E', String(10000000 + i), `APELLIDO${i} NOMBRE${i}`, 'PRESENCIAL', 'CAP 1',
      '16/04/2026', i % 3 === 0 ? 'Pendiente' : '20/04/2026', 'Pendiente',
      i % 3 === 0 ? 0 : 4, i % 3 === 0 ? 'No' : '', '—', '—', ...Array.from({ length: 10 }, () => 1),
    ]);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'CAPACITACIÓN LIMA');
  return wb;
}

const dir = mkdtempSync(join(tmpdir(), 'rbac-e2e-'));
const xlsxPath = join(dir, 'datos.xlsx');
XLSX.writeFile(buildXlsx(), xlsxPath);

const browser = await chromium.launch({ channel: 'msedge', headless: true });

try {
  // ═══ 1) LOGIN INCORRECTO ═══
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('#login-user', 'usuario.no.existe');
    await page.fill('#login-password', 'clave incorrecta');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Credenciales incorrectas', { timeout: 15000 });
    check('Login incorrecto muestra mensaje de error', true);
    check('Login incorrecto permanece en /login', new URL(page.url()).pathname === '/login');
    await context.close();
  }

  // ═══ 2) GERENTE DE VENTAS: menú completo y todos los módulos accesibles ═══
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, USERS.gerente);
    check('GERENTE aterriza en /', new URL(page.url()).pathname === '/');
    await page.waitForSelector('nav a[href]', { timeout: 30000 });
    const hrefs = await navHrefs(page);
    check(
      'GERENTE ve los4 módulos en el menú',
      ['/', '/capacitacion', '/caidas', '/upload'].every((h) => hrefs.includes(h)),
      hrefs.join(', '),
    );
    const texto = await cuerpo(page);
    check('Header muestra nombre y rol del usuario', texto.includes(USERS.gerente.displayName) && texto.includes(USERS.gerente.roleLabel));

    // El sidebar arranca colapsado: se expande con hover para ver los chips de permisos.
    await page.hover('nav');
    await page.waitForTimeout(600);
    const textoExpandido = await cuerpo(page);
    check('Sidebar lista permisos disponibles', textoExpandido.includes('Matriz de Reclutadores') && textoExpandido.includes('Carga Excel'));

    for (const [path, esperado] of [
      ['/caidas', 'Dashboard Ejecutivo de Caídas'],
      ['/capacitacion', 'Capacitación'],
      ['/upload', null],
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
      const t = await cuerpo(page);
      const ok =
        new URL(page.url()).pathname === path &&
        !t.includes('Acceso restringido') &&
        (esperado === null || t.toLowerCase().includes(esperado.toLowerCase()));
      check(`GERENTE accede a ${path}`, ok);
    }
    const tieneInput = await page.$('input[type="file"]');
    check('GERENTE ve el input de carga en /upload', !!tieneInput);
    await context.close();
  }

  // ═══ 3) CAPACITACIÓN: solo su módulo + carga Excel; bloqueos con mensaje ═══
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, USERS.cap);
    check('CAPACITACION aterriza en /capacitacion', new URL(page.url()).pathname === '/capacitacion');
    await page.waitForSelector('nav a[href]', { timeout: 30000 });
    const hrefs = await navHrefs(page);
    check(
      'CAPACITACION ve solo2 módulos',
      hrefs.length === 2 && hrefs.includes('/capacitacion') && hrefs.includes('/upload'),
      hrefs.join(', '),
    );

    // Acceso directo por URL a /caidas → bloqueado con mensaje
    await page.goto(`${BASE}/caidas`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForSelector('text=Acceso restringido', { timeout: 30000 });
    const bloqueo = await cuerpo(page);
    // innerText en Chromium aplica text-transform:uppercase → comparar en mayúsculas
    check('CAPACITACION bloqueado en /caidas con mensaje', new URL(page.url()).pathname === '/capacitacion' && bloqueo.toUpperCase().includes('PERMISO INSUFICIENTE') && bloqueo.includes('Caídas'));
    await page.click('button:has-text("Volver a mi módulo")');
    await page.waitForFunction(() => !window.location.search, null, { timeout: 15000 });
    check('Recuperación desde pantalla de bloqueo', new URL(page.url()).pathname === '/capacitacion');

    // Acceso directo a / (dashboard) → bloqueado
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForSelector('text=Acceso restringido', { timeout: 30000 });
    const bloqueo2 = await cuerpo(page);
    check('CAPACITACION bloqueado en / con mensaje', bloqueo2.includes('Dashboard'));

    // Carga Excel real con el rol más restringido + datos visibles en su módulo
    await page.goto(`${BASE}/upload`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.setInputFiles('input[type="file"]', xlsxPath);
    await page.waitForSelector('text=Procesamiento exitoso', { timeout: 90000 });
    await page.evaluate(() => document.querySelector('nav a[href="/capacitacion"]').click());
    // Con datos cargados, la página renderiza los KPIs (sin datos solo muestra NoDataYet).
    await page.waitForSelector('text=Total Ingresos', { timeout: 60000 });
    check('CAPACITACION carga Excel y ve datos en su módulo', true);
    await context.close();
  }

  // ═══ 4) GDT: dashboard + caídas + upload; bloqueo de capacitación; sesión y logout ═══
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, USERS.gdt);
    check('GDT aterriza en /', new URL(page.url()).pathname === '/');
    await page.waitForSelector('nav a[href]', { timeout: 30000 });
    const hrefs = await navHrefs(page);
    check(
      'GDT ve exactamente dashboard, caídas y carga',
      hrefs.length === 3 && hrefs.includes('/') && hrefs.includes('/caidas') && hrefs.includes('/upload'),
      hrefs.join(', '),
    );

    await page.goto(`${BASE}/capacitacion`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForSelector('text=Acceso restringido', { timeout: 30000 });
    check('GDT bloqueado en /capacitacion con mensaje', (await cuerpo(page)).includes('Capacitación'));

    await page.goto(`${BASE}/caidas`, { waitUntil: 'networkidle', timeout: 90000 });
    check('GDT accede a /caidas', new URL(page.url()).pathname === '/caidas' && !(await cuerpo(page)).includes('Acceso restringido'));

    // Refresco de página: la sesión se cierra automáticamente (sesión única)
    await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForURL('**/login', { timeout: 30000 });
    check('Refresco cierra sesión y vuelve a /login', true);

    // Re-login para validar cookie temporal y cierre de sesión manual
    await login(page, USERS.gdt);
    await page.waitForTimeout(300); // asienta la cookie tras el login

    // Cookie de sesión: HttpOnly y de sesión del navegador (sin expiración fija)
    const cookies = await context.cookies();
    const sesion = cookies.find((c) => c.name === 'cic_session');
    check(
      'Cookie HttpOnly presente y temporal (sin expiración fija)',
      !!sesion && sesion.httpOnly === true && sesion.sameSite === 'Lax' && sesion.expires === -1,
      sesion ? `expires=${sesion.expires}` : 'sin cookie',
    );

    // Latido de pestaña: cookie no-HttpOnly que el cliente renueva; su
    // ausencia tras cerrar pestañas/navegador invalida la sesión.
    const latido = cookies.find((c) => c.name === 'cic_tab');
    check('Latido de pestaña (cic_tab) activo tras login', !!latido && latido.httpOnly === false);

    // Cierre de sesión. El botón lleva Tooltip: hay que hacer hover y dejar
    // asentar el popup antes del clic (un clic atómico hover+clic compite con
    // el mount de framer-motion y se pierde — particularidad del headless,
    // no afecta a usuarios reales).
    await page.hover('button[aria-label="Cerrar sesión"]');
    await page.waitForTimeout(600);
    await page.click('button[aria-label="Cerrar sesión"]');
    await page.waitForURL('**/login', { timeout: 30000 });
    check('Logout redirige a /login', true);
    await page.goto(`${BASE}/caidas`, { waitUntil: 'networkidle', timeout: 90000 });
    check('Sin sesión, /caidas redirige a /login', new URL(page.url()).pathname === '/login');
    const cookiesTras = await context.cookies();
    check('Logout elimina la cookie', !cookiesTras.some((c) => c.name === 'cic_session'));
    await context.close();
  }

  // ═══ 5) JEFA DE CAPACITACIÓN: acceso total (administrador operativo) ═══
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, USERS.jefa);
    check('JEFA_CAPACITACION aterriza en /', new URL(page.url()).pathname === '/');
    await page.waitForSelector('nav a[href]', { timeout: 30000 });
    const hrefs = await navHrefs(page);
    check(
      'JEFA_CAPACITACION ve los4 módulos en el menú',
      ['/', '/capacitacion', '/caidas', '/upload'].every((h) => hrefs.includes(h)),
      hrefs.join(', '),
    );
    const texto = await cuerpo(page);
    check(
      'Header muestra nombre "Jefa de Capacitación" y rol JEFA_CAPACITACION',
      texto.includes(USERS.jefa.displayName) && texto.includes(USERS.jefa.roleLabel),
    );

    // El sidebar arranca colapsado: se expande con hover para ver los chips de permisos.
    await page.hover('nav');
    await page.waitForTimeout(600);
    const textoExpandido = await cuerpo(page);
    check(
      'JEFA_CAPACITACION ve Matriz de Reclutadores y Carga Excel',
      textoExpandido.includes('Matriz de Reclutadores') && textoExpandido.includes('Carga Excel'),
    );

    for (const [path, esperado] of [
      ['/caidas', 'Dashboard Ejecutivo de Caídas'],
      ['/capacitacion', 'Capacitación'],
      ['/upload', null],
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
      const t = await cuerpo(page);
      const ok =
        new URL(page.url()).pathname === path &&
        !t.includes('Acceso restringido') &&
        (esperado === null || t.toLowerCase().includes(esperado.toLowerCase()));
      check(`JEFA_CAPACITACION accede a ${path}`, ok);
    }
    const tieneInput = await page.$('input[type="file"]');
    check('JEFA_CAPACITACION ve el input de carga en /upload', !!tieneInput);

    // Política de sesión única: el refresco cierra la sesión…
    await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForURL('**/login', { timeout: 30000 });
    check('Refresco vuelve a /login (política de sesión única)', true);

    // …y al volver a entrar conserva el acceso completo al sistema.
    await login(page, USERS.jefa);
    await page.waitForSelector('nav a[href]', { timeout: 30000 });
    const hrefsTras = await navHrefs(page);
    check(
      'JEFA_CAPACITACION conserva permisos completos tras refrescar y volver a entrar',
      ['/', '/capacitacion', '/caidas', '/upload'].every((h) => hrefsTras.includes(h)),
      hrefsTras.join(', '),
    );
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(`\nE2E RBAC: ${failures} verificación(es) fallaron.`);
  process.exit(1);
}
console.log('\nE2E RBAC: todas las verificaciones pasaron.');
