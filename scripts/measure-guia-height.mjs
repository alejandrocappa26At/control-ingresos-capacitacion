/**
 * Mide la altura REAL del bloque "Guía de interpretación de indicadores"
 * (módulo Matriz de Reclutadores, página /caidas) en un Chromium headless.
 *
 * Usa el Microsoft Edge del sistema (channel: 'msedge') vía playwright-core,
 * por lo que NO descarga navegadores. Los datos NO se persisten en el store,
 * así que el script genera un Excel sintético válido, lo sube por /upload y
 * navega al módulo por el link del sidebar (navegación SPA, sin recarga).
 *
 * Uso:
 *   npm run dev en otra terminal y luego:
 *   node scripts/measure-guia-height.mjs --label=DESPUES [--width=1440] [--height=900]
 *
 * Salida: JSON con altura del bloque, alturas por card, alto total de página
 * (scrollHeight) y altura del modal de metodología (si existe).
 */
import { chromium } from 'playwright-core';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// ── Args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const LABEL = getArg('label', 'MEDICION');
const BASE = getArg('base', 'http://localhost:3000');
const WIDTH = Number(getArg('width', '1440'));
const HEIGHT = Number(getArg('height', '900'));

// ── Excel sintético válido para el parser del proyecto ────────────────
const RECLUTADORES = ['ANA TORRES', 'LUIS RAMOS', 'MARIA CHAVEZ', 'JORGE PEÑA', 'CARMEN LOZA', 'PEDRO VEGA', 'SOFIA RIOS', 'DIEGO MARIN'];
const SEDES = ['LARCOMAR', 'JOCKEY PLAZA', 'MALL PLAZA', 'REAL PLAZA', 'OPEN PLAZA'];

function buildWorkbook() {
  const wb = XLSX.utils.book_new();
  const headers = [
    'JURIDICCION', 'FECHA DE INGRESO', 'ZONA COMERCIAL', 'SEDE', 'DISTRITO',
    'NOMBRE DE TIENDA', 'SUPERVISOR', 'RESPONSABLE A&S', 'DNI', 'APELLIDOS Y NOMBRES',
    'MODALIDAD', 'CAPACITADOR', 'F. INICIO CAPACITACIÓN', 'F. FIN DE CAPACITACIÓN',
    'F. ENTREGA A OPERACIONES', 'TOTAL DE DÍAS', 'PASA A OPERACIONES',
    'MOTIVO DE CAIDA', 'SUB MOTIVO DE CAIDA',
    ...Array.from({ length: 10 }, (_, i) => `ASISTENCIA DÍA ${i + 1}`),
  ];

  for (const [sheetName, jurisdiccion] of [['CAPACITACIÓN LIMA', 'LIMA'], ['CAPACITACIÓN PROVINCIA', 'PROVINCIA']]) {
    const rows = [headers];
    for (let i = 0; i < 160; i++) {
      const r = i % 10;
      // Mezcla de estados: deserción (días 0), baja (días>=1 y pasa=No),
      // aprobado (pasa=Sí) y en capacitación (pasa vacío).
      const totalDias = r < 3 ? 0 : 3 + (i % 5);
      const pasa = r < 3 ? 'No' : r < 5 ? 'No' : r < 8 ? 'Sí' : '';
      const asistencia = Array.from({ length: 10 }, (_, d) => (totalDias > d ? 1 : 0));
      rows.push([
        jurisdiccion, '15/04/2026', `ZONA ${1 + (i % 4)}`, SEDES[i % SEDES.length],
        `DISTRITO ${1 + (i % 7)}`, `TIENDA ${i % 20}`, `SUP ${1 + (i % 5)}`,
        RECLUTADORES[i % RECLUTADORES.length], String(10000000 + i), `APELLIDO${i} NOMBRE${i}`,
        'PRESENCIAL', `CAP ${1 + (i % 3)}`, '16/04/2026', totalDias > 0 ? '20/04/2026' : 'Pendiente',
        pasa === 'Sí' ? '25/04/2026' : 'Pendiente', totalDias, pasa,
        pasa === 'No' ? 'ABANDONO VOLUNTARIO' : '—', pasa === 'No' ? 'NO ASISTE' : '—',
        ...asistencia,
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  }
  return wb;
}

// ── Main ──────────────────────────────────────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'guia-measure-'));
const xlsxPath = join(dir, 'datos-sinteticos.xlsx');
XLSX.writeFile(buildWorkbook(), xlsxPath);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });

// Autenticación: login real vía UI. La sesión vive en una cookie HttpOnly
// firmada (ver src/proxy.ts y src/app/api/auth/*); usa un usuario con
// permisos "caidas" y "upload_excel" (p. ej. Gdt.At o Mauricio.Guerra).
const TEST_USER = process.env.CIC_TEST_USER;
const TEST_PASS = process.env.CIC_TEST_PASS;
if (!TEST_USER || !TEST_PASS) {
  console.error(
    'Defina CIC_TEST_USER y CIC_TEST_PASS (credenciales de un usuario con permisos "caidas" y "upload_excel").',
  );
  process.exit(1);
}

const page = await context.newPage();
try {
  // 0) Login por el formulario real.
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.fill('#login-user', TEST_USER);
  await page.fill('#login-password', TEST_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 });

  // 1) Subir Excel sintético (los datos viven solo en memoria del store).
  await page.goto(`${BASE}/upload`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.setInputFiles('input[type="file"]', xlsxPath);
  await page.waitForSelector('text=Procesamiento exitoso', { timeout: 90000 });

  // 2) Navegar al módulo por el sidebar (SPA: conserva el store en memoria).
  //    Se usa click sintético: el disparo físico de Playwright no activa el
  //    Link de next/link en este sidebar colapsado (el svg central intercepta).
  await page.evaluate(() => document.querySelector('a[href="/caidas"]').click());
  await page.waitForSelector('[data-testid="guia-indicadores"]', { timeout: 60000 });
  await page.waitForTimeout(1200); // asentarse animaciones de entrada

  // 3) Medir bloque, cards y alto total de página.
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="guia-indicadores"]');
    if (!root) return null;
    const grid = root.lastElementChild;
    const cards = grid ? [...grid.children] : [];
    const rect = root.getBoundingClientRect();
    return {
      blockHeightPx: Math.round(rect.height),
      blockWidthPx: Math.round(rect.width),
      cardHeightsPx: cards.map((c) => Math.round(c.getBoundingClientRect().height)),
      guideTopPx: Math.round(rect.top + window.scrollY),
      pageScrollHeightPx: document.documentElement.scrollHeight,
      viewportHeightPx: window.innerHeight,
    };
  });
  if (!metrics) throw new Error('No se encontró [data-testid="guia-indicadores"] en /caidas');

  // 4) Modal de metodología (solo existe en la versión nueva).
  let modalHeightPx = null;
  try {
    await page.click('button:has-text("VER METODOLOGÍA KPI")', { timeout: 3000 });
    await page.waitForSelector('text=Metodología de los indicadores', { timeout: 5000 });
    await page.waitForTimeout(600);
    modalHeightPx = await page.evaluate(() => {
      // El portal del Modal usa z-[100] (ver src/components/ui/modal.tsx);
      // .fixed.inset-0 alcanzaría también el fondo aurora del AppShell.
      const fixed = document.querySelector('div[class*="z-[100]"]');
      const panel = fixed?.lastElementChild;
      return panel ? Math.round(panel.getBoundingClientRect().height) : null;
    });
    await page.keyboard.press('Escape');
  } catch {
    modalHeightPx = null; // versión sin modal
  }

  const result = { label: LABEL, measuredAt: new Date().toISOString(), url: BASE, ...metrics, modalHeightPx };
  console.log(JSON.stringify(result, null, 2));
  writeFileSync(join(dir, `${LABEL}.json`), JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
