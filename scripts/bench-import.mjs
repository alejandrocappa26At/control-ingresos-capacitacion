/**
 * bench-import.mjs — Medición del rendimiento de importación de Excel (Fase 2).
 *
 * Genera (o reutiliza desde caché) libros .xlsx representativos del uso real
 * con las hojas requeridas (CAPACITACIÓN LIMA / CAPACITACIÓN PROVINCIA) y hojas
 * distractores reales (CONSOLIDADO, BD_TIENDAS, MOTIVOS_DE_BAJA), luego mide:
 *
 *   1. Cada etapa de parseWorkbookBuffer (lectura, validación, parseo, KPIs).
 *   2. El recálculo de analíticas que React ejecuta tras setRecords (useAppData).
 *   3. selectFilteredRecords (filtros por registro).
 *
 * No registra datos sensibles: solo tiempos, conteos y KPI agregados.
 * Los datos generados son sintéticos (DNIs de prueba, nombres ficticios).
 *
 * Uso:
 *   npm run bench:import                 # tamaños por defecto (10k, 30k, 60k filas)
 *   node --import ./scripts/ts-resolve.mjs scripts/bench-import.mjs 5000 20000
 *
 * Los archivos se cachean en %TEMP%/opencode/atpeople-bench para poder
 * reutilizarlos también en pruebas manuales de la UI (arrastrar al Dropzone).
 */
import XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';

import { parseWorkbookBuffer } from '../src/services/excel/parseWorkbook.ts';
import { computeKpis } from '../src/services/analytics/kpis.ts';
import {
  computeEmbudo,
  rankingPorMotivo,
  rankingPorSubMotivo,
} from '../src/services/analytics/falls.ts';
import {
  ingresosPorJurisdiccion,
  ingresosPorZonaComercial,
  ingresosPorSede,
  analizarCapacitadores,
  ingresosPorMes,
  ingresosMensualesPorJurisdiccion,
} from '../src/services/analytics/charts.ts';
import { selectFilteredRecords, EMPTY_FILTERS } from '../src/store/useDataStore.ts';

const CACHE_DIR = path.join(os.tmpdir(), 'opencode', 'atpeople-bench');
const SCHEMA_TAG = 'v2';

const DEFAULT_SIZES = [10_000, 30_000, 60_000];

// ---------------------------------------------------------------------------
// Generación de datos sintéticos deterministas (LCG) — mismo archivo siempre.
// ---------------------------------------------------------------------------
function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const ZONAS = ['ZONA 1 LIMA', 'ZONA 2 LIMA', 'ZONA 3 NORTE', 'ZONA 4 SUR', 'ZONA 5 CENTRO'];
const SEDES = ['JOCKEY', 'MIRAFLORES', 'SAN ISIDRO', 'SURCO', 'CREMACION', 'BELLAVISTA', 'PIURA', 'TRUJILLO', 'AREQUIPA', 'CUSCO'];
const MODALIDADES = ['PRESENCIAL', 'VIRTUAL', 'MIXTO'];
const MOTIVOS = ['DESISTIMIENTO', 'NO ASISTENCIA', 'BAJA VOLUNTARIA', 'REUBICACIÓN', 'CAMBIO DE HORARIO', 'DESFASE', 'PROBLEMAS DE SALUD'];
const SUB_MOTIVOS = ['RENUNCIA', 'ABANDONO', 'NO CUMPLE REQUISITOS', 'FALTA DE DOCUMENTO', 'DISTANCIA', 'OTRO'];
const APELLIDOS = ['GARCIA LOPEZ', 'MARTINEZ TORRES', 'SANCHEZ RAMOS', 'VEGA CRUZ', 'FLORES MORA', 'DIAZ PAREDES', 'ROJAS CHAVEZ', 'HUAMAN QUISPE', 'TAPIA LEON', 'SOTO VARGAS'];
const NOMBRES = ['ANA', 'LUIS', 'MARIA', 'JORGE', 'CARLA', 'PEDRO', 'ROCIO', 'MIGUEL', 'VALERIA', 'DIEGO'];

const TITLE_ROW = ['PLANILLA DE CAPACITACIÓN — REPORTE MENSUAL'];

const HEADERS = [
  'JURIDICCION',
  'FECHA DE INGRESO',
  'ZONA COMERCIAL',
  'SEDE',
  'DISTRITO',
  'NOMBRE DE TIENDA',
  'SUPERVISOR',
  'RESPONSABEL A&S',
  'DNI',
  'APELLIDOS Y NOMBRES',
  'MODALIDAD',
  'CAPACITADOR',
  'F. INICIO CAPACITACIÓN',
  'F. FIN DE CAPACITACIÓN',
  'F. ENTREGA A OPERACIONES',
  'ASISTENCIA DÍA 1',
  'ASISTENCIA DÍA 2',
  'ASISTENCIA DÍA 3',
  'ASISTENCIA DÍA 4',
  'ASISTENCIA DÍA 5',
  'ASISTENCIA DÍA 6',
  'ASISTENCIA DÍA 7',
  'ASISTENCIA DÍA 8',
  'ASISTENCIA DÍA 9',
  'ASISTENCIA DÍA 10',
  'TOTAL DE DÍAS',
  'PASA A OPERACIONES',
  'MOTIVO DE CAIDA',
  'SUB MOTIVO DE CAIDA',
];

function buildDataRows(rows, jurisdiccion, rng, dniPool) {
  const out = [TITLE_ROW.slice(), HEADERS.slice()];
  const base = new Date(2026, 0, 5);
  for (let i = 0; i < rows; i++) {
    // DNI con colisiones intencionales (~30%): ejercita la detección de duplicados.
    const dni = rng() < 0.7
      ? String(10_000_000 + Math.floor(rng() * 9_000_000))
      : dniPool[Math.floor(rng() * dniPool.length)];
    const nombre = `${APELLIDOS[Math.floor(rng() * APELLIDOS.length)]} ${NOMBRES[Math.floor(rng() * NOMBRES.length)]} ${NOMBRES[Math.floor(rng() * NOMBRES.length)]}`;
    const capacitador = `${APELLIDOS[Math.floor(rng() * APELLIDOS.length)]} ${NOMBRES[Math.floor(rng() * NOMBRES.length)]}`;
    const ingreso = new Date(base.getTime() + Math.floor(rng() * 270) * 86_400_000);
    const tieneCap = rng() > 0.12;
    const inicio = tieneCap ? new Date(ingreso.getTime() + Math.floor(rng() * 7) * 86_400_000) : '';
    const fin = tieneCap && rng() > 0.35 ? new Date(inicio.getTime() + 9 * 86_400_000) : '';
    const entrega = fin && rng() > 0.5 ? new Date(fin.getTime() + 86_400_000) : '';

    const totalDias = tieneCap ? (rng() < 0.08 ? 0 : 1 + Math.floor(rng() * 12)) : 0;
    // Regla de negocio: pasa solo cuando hay al menos 1 día de capacitación.
    const pasa = totalDias === 0 ? 0 : rng() < 0.6 ? 1 : rng() < 0.7 ? 0 : '';
    const caida = pasa === 0;
    const motivo = caida ? MOTIVOS[Math.floor(rng() * MOTIVOS.length)] : '';
    const subMotivo = caida ? SUB_MOTIVOS[Math.floor(rng() * SUB_MOTIVOS.length)] : '';

    const asistencia = [];
    for (let d = 1; d <= 10; d++) {
      asistencia.push(d <= totalDias ? (rng() < 0.85 ? 1 : 0) : '');
    }

    out.push([
      jurisdiccion,
      ingreso,
      ZONAS[Math.floor(rng() * ZONAS.length)],
      SEDES[Math.floor(rng() * SEDES.length)],
      `DISTRITO ${1 + Math.floor(rng() * 40)}`,
      `TIENDA ${1 + Math.floor(rng() * 300)}`,
      `SUP ${1 + Math.floor(rng() * 25)}`,
      `RESP ${1 + Math.floor(rng() * 30)}`,
      dni,
      nombre,
      MODALIDADES[Math.floor(rng() * MODALIDADES.length)],
      capacitador,
      inicio,
      fin,
      entrega,
      ...asistencia,
      totalDias,
      pasa,
      motivo,
      subMotivo,
    ]);
  }
  return out;
}

function buildDistractorSheets(totalRows, rng) {
  const consolidado = [['CONSOLIDADO ANUAL']];
  const cols = 16;
  for (let i = 0; i < Math.round(totalRows * 0.6); i++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(rng() < 0.5 ? ZONAS[c % ZONAS.length] : Math.floor(rng() * 10_000));
    consolidado.push(row);
  }
  const tiendas = [['Sede', 'Distrito', 'Tienda', 'Estado']];
  for (let i = 0; i < 800; i++) {
    tiendas.push([SEDES[i % SEDES.length], `DISTRITO ${i}`, `TIENDA ${i}`, i % 3 ? 'ACTIVA' : 'CERRADA']);
  }
  const motivos = [['MOTIVO', 'SUB MOTIVO']];
  for (const m of MOTIVOS) for (const s of SUB_MOTIVOS) motivos.push([m, s]);
  return { consolidado, tiendas, motivos };
}

function generateWorkbook(totalRows) {
  const rng = makeRng(20261016);
  const limaRows = Math.round(totalRows * 0.6);
  const provRows = totalRows - limaRows;
  // Pool pequeño de DNIs para provocar duplicados entre hojas (~10% de colisión).
  const dniPool = Array.from({ length: Math.max(16, Math.round(totalRows * 0.12)) }, (_, i) => String(20_000_000 + i));

  const wb = XLSX.utils.book_new();
  const lima = XLSX.utils.aoa_to_sheet(buildDataRows(limaRows, 'LIMA', rng, dniPool));
  const prov = XLSX.utils.aoa_to_sheet(buildDataRows(provRows, 'PROVINCIA', rng, dniPool));
  XLSX.utils.book_append_sheet(wb, lima, 'CAPACITACIÓN LIMA');
  XLSX.utils.book_append_sheet(wb, prov, 'CAPACITACIÓN PROVINCIA');

  const { consolidado, tiendas, motivos } = buildDistractorSheets(totalRows, rng);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(consolidado), 'CONSOLIDADO');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(consolidado), 'CONSOLIDADO_Anterior');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tiendas), 'BD_TIENDAS');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(motivos), 'MOTIVOS_DE_BAJA');

  const t0 = performance.now();
  // type:'buffer' evita el límite de String.fromCharCode de type:'array' en libros grandes.
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  const genMs = performance.now() - t0;
  const ab = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  return { buffer: ab, genMs };
}

function workbookFor(totalRows) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `atpeople-${SCHEMA_TAG}-${totalRows}.xlsx`);
  if (fs.existsSync(file)) {
    const { size } = fs.statSync(file);
    return { buffer: fs.readFileSync(file).buffer, size, generated: false, genMs: 0 };
  }
  const { buffer, genMs } = generateWorkbook(totalRows);
  fs.writeFileSync(file, Buffer.from(buffer));
  console.log(`  (archivo generado y cacheado: ${file})`);
  return { buffer, size: buffer.byteLength, generated: true, genMs };
}

// ---------------------------------------------------------------------------
// Instrumentación de consola: captura duraciones de console.time/timeEnd y
// silencia el ruido (logs de auditoría) durante la medición.
// ---------------------------------------------------------------------------
function makeConsoleCapture() {
  const durations = new Map();
  const starts = new Map();
  const restore = { log: console.log, info: console.info, warn: console.warn, time: console.time, timeEnd: console.timeEnd, groupCollapsed: console.groupCollapsed, groupEnd: console.groupEnd, table: console.table, error: console.error };
  console.log = console.info = console.warn = () => {};
  console.groupCollapsed = console.groupEnd = console.table = () => {};
  console.time = (k) => { starts.set(k, performance.now()); };
  console.timeEnd = (k) => {
    const s = starts.get(k);
    if (s !== undefined) durations.set(k, performance.now() - s);
    starts.delete(k);
  };
  return {
    durations,
    restore() {
      Object.assign(console, restore);
    },
  };
}

const fmt = (n) => `${Math.round(n).toLocaleString('es-PE')} ms`;
const kb = (n) => (n / 1024 / 1024).toFixed(1);

/**
 * Atribuye el tiempo de 'Lectura Excel': envuelve XLSX.read y
 * XLSX.utils.sheet_to_json (el paquete xlsx es CJS y sus propiedades son
 * mutables, así que el mismo módulo instanceado por parseWorkbook queda
 * interceptado). Devuelve la función de restauración con las llamadas.
 */
function instrumentXlsx() {
  const reads = [];
  const sheets = [];
  const origRead = XLSX.read;
  const origSheetJson = XLSX.utils.sheet_to_json;
  XLSX.read = function instrumentedRead(...args) {
    const t = performance.now();
    try {
      return origRead.apply(XLSX, args);
    } finally {
      const opts = args[1] ?? {};
      const kind = opts.bookSheets ? 'bookSheets (índice de hojas)' : `completo (${(opts.sheets ?? []).length} hojas)`;
      reads.push({ kind, ms: performance.now() - t });
    }
  };
  XLSX.utils.sheet_to_json = function instrumentedSheetJson(...args) {
    const t = performance.now();
    try {
      return origSheetJson.apply(XLSX.utils, args);
    } finally {
      sheets.push(performance.now() - t);
    }
  };
  return {
    restore() {
      XLSX.read = origRead;
      XLSX.utils.sheet_to_json = origSheetJson;
      return { reads, sheets };
    },
  };
}

async function benchSize(totalRows) {
  console.log(`\n═══ ${totalRows.toLocaleString('es-PE')} filas de datos (2 hojas requeridas + distractores) ═══`);
  const { buffer, size, genMs } = workbookFor(totalRows);
  if (genMs > 0) console.log(`  generación del archivo (excluida de la medición): ${fmt(genMs)}`);
  console.log(`  tamaño del archivo: ${kb(size)} MB`);

  const cap = makeConsoleCapture();
  const calls = instrumentXlsx();
  const t0 = performance.now();
  const result = await parseWorkbookBuffer(buffer, () => {});
  const parseMs = performance.now() - t0;
  const { reads, sheets } = calls.restore();
  const times = new Map(cap.durations);
  cap.restore();

  if (!result.success) {
    console.error('  ✗ parseo falló:', result.errors);
    process.exitCode = 1;
    return null;
  }

  // Recálculo completo que ejecuta useAppData al recibir setRecords.
  const capA = makeConsoleCapture();
  const analytics = {};
  const tA = performance.now();
  const filtered = selectFilteredRecords({ records: result.records, filters: EMPTY_FILTERS, searchTerm: '' });
  analytics['selectFilteredRecords (filtros)'] = performance.now() - tA;

  const kpi = {};
  let t = performance.now();
  kpi.computeKpis = computeKpis(filtered);
  kpi.computeKpisMs = performance.now() - t;
  t = performance.now();
  kpi.computeEmbudo = computeEmbudo(filtered);
  kpi.computeEmbudoMs = performance.now() - t;
  t = performance.now();
  kpi.jurisdiccion = ingresosPorJurisdiccion(filtered);
  kpi.zonas = ingresosPorZonaComercial(filtered);
  kpi.sedes = ingresosPorSede(filtered, Number.POSITIVE_INFINITY);
  kpi.porMes = ingresosPorMes(filtered);
  kpi.mensuales = ingresosMensualesPorJurisdiccion(filtered);
  analytics['charts (series)'] = performance.now() - t;
  t = performance.now();
  const capRes = analizarCapacitadores(filtered);
  analytics['analizarCapacitadores'] = performance.now() - t;
  t = performance.now();
  kpi.motivos = rankingPorMotivo(filtered);
  kpi.subMotivos = rankingPorSubMotivo(filtered);
  analytics['rankings de caída'] = performance.now() - t;
  capA.restore();

  const analyticsTotal = Object.values(analytics).reduce((a, b) => a + b, 0);

  console.log('  ── Etapas del parseo (parseWorkbookBuffer) ──');
  for (const [name, ms] of times) console.log(`    ${name.padEnd(24)} ${fmt(ms)}`);
  console.log(`    ${'TOTAL PARSE'.padEnd(24)} ${fmt(parseMs)}`);
  console.log('  ── Atribución de llamadas xlsx ──');
  for (const r of reads) console.log(`    XLSX.read ${r.kind.padEnd(28)} ${fmt(r.ms)}`);
  const sheetsTotal = sheets.reduce((a, b) => a + b, 0);
  console.log(`    sheet_to_json x${sheets.length}                     ${fmt(sheetsTotal)}`);
  console.log('  ── Recálculo posterior (useAppData en React) ──');
  for (const [name, ms] of Object.entries(analytics)) console.log(`    ${name.padEnd(24)} ${fmt(ms)}`);
  console.log(`    ${'TOTAL ANALYTICS'.padEnd(24)} ${fmt(analyticsTotal)}`);
  console.log(`    ${'TOTAL IMPORTACIÓN'.padEnd(24)} ${fmt(parseMs + analyticsTotal)}`);

  const dupAudit = countDuplicated(result.records);
  // Huella determinista de TODOS los registros: cualquier cambio funcional en el
  // parseo (fechas, normalización, orden) altera el hash y rompe la paridad.
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify(result.records)).digest('hex').slice(0, 16);
  console.log('  ── Paridad de resultados (referencia antes/después) ──');
  console.log(`    huella registros sha256: ${fingerprint}`);
  console.log(
    `    registros=${result.records.length} lima=${result.meta.totalLima} provincia=${result.meta.totalProvincia} dnisDuplicados=${dupAudit.duplicatedDnis} registrosDuplicados=${dupAudit.extraRows}`,
  );
  console.log(
    `    kpis: total=${kpi.computeKpis.totalIngresos} inician=${kpi.computeKpis.inicianCapacitacion} aprobados=${kpi.computeKpis.pasanAOperaciones} desercion=${kpi.computeKpis.desercion} bajas=${kpi.computeKpis.bajasCapacitacion} enCap=${kpi.computeKpis.enCapacitacion} sinClasif=${kpi.computeKpis.sinClasificar} %Apr=${kpi.computeKpis.porcentajeAprobacion.toFixed(4)}`,
  );
  console.log(
    `    embudo: integridad=${kpi.computeEmbudo.integridad} diferencia=${kpi.computeEmbudo.diferencia} | capacitadores=${capRes.capacitadores.length} excluidos=${capRes.registrosExcluidos}`,
  );

  return { totalRows, size, parseMs, analyticsTotal, times, records: result.records.length, kpi: kpi.computeKpis, capCount: capRes.capacitadores.length };
}

function countDuplicated(records) {
  const cuenta = new Map();
  for (const r of records) cuenta.set(r.dni, (cuenta.get(r.dni) ?? 0) + 1);
  let duplicatedDnis = 0;
  let extraRows = 0;
  for (const [, c] of cuenta) {
    if (c > 1) {
      duplicatedDnis++;
      extraRows += c - 1;
    }
  }
  return { duplicatedDnis, extraRows };
}

const sizes = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n) && n > 0);
const list = sizes.length > 0 ? sizes : DEFAULT_SIZES;

console.log('AT People — benchmark de importación de Excel');
console.log(`node ${process.version} · caché: ${CACHE_DIR}`);

const summary = [];
for (const size of list) {
  const r = await benchSize(size);
  if (r) summary.push(r);
}

if (summary.length > 1) {
  console.log('\n═══ RESUMEN ═══');
  console.log('  filas      archivo   parse     analytics  total');
  for (const r of summary) {
    console.log(
      `  ${String(r.totalRows).padStart(7)}  ${kb(r.size).padStart(6)}MB  ${fmt(r.parseMs).padStart(9)}  ${fmt(r.analyticsTotal).padStart(9)}  ${fmt(r.parseMs + r.analyticsTotal).padStart(9)}`,
    );
  }
}
