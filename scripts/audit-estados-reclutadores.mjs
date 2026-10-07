import { readFileSync } from 'node:fs';
import XLSX from 'xlsx';
import { resolveColumns, findHeaderRow, normalizeSheetName, SEPARATE_SHEETS } from '../src/services/validators/excelValidator.ts';

/*
 * PASO 1 — AUDITORÍA DE ESTADOS REALES (MÓDULO DE CAÍDAS)
 *
 * Lee el Excel con las MISMAS reglas de interpretación de la app
 * (resolveColumns / findHeaderRow / toTotalDias / toPasa) y reporta cómo
 * están registrados los estados reales:
 *   - TOTAL DE DÍAS
 *   - PASA A OPERACIONES
 *   - MOTIVO DE CAÍDA
 * y cuántos registros caen en cada definición de negocio:
 *   DESERCIÓN             = TOTAL DE DÍAS = 0 o vacío
 *   CAÍDA EN CAPACITACIÓN = TOTAL DE DÍAS >= 1 y PASA = 0
 *   APROBADO              = TOTAL DE DÍAS >= 1 y PASA = 1
 *   EN CAPACITACIÓN       = TOTAL DE DÍAS >= 1 y PASA vacío
 *
 * Uso: node --import ./scripts/ts-resolve.mjs scripts/audit-estados-reclutadores.mjs <ruta-al-excel.xlsx>
 */

const [, , filePath] = process.argv;
if (!filePath) {
  console.error('Uso: node --import ./scripts/ts-resolve.mjs scripts/audit-estados-reclutadores.mjs <ruta-al-excel.xlsx>');
  process.exit(1);
}

function toPasa(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value === 1 ? 1 : value === 0 ? 0 : null;
  const text = String(value).trim().toUpperCase();
  if (/^(1|SI|SÍ|PASA|APROBADO|OK)$/.test(text)) return 1;
  if (/^(0|NO|NO PASA|DESAPROBADO|CAIDO|CAÍDO|CÁIDO)$/.test(text)) return 0;
  return null;
}

function toTotalDias(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (Number.isFinite(value) && Number.isInteger(value) && value >= 0) return value;
    return null;
  }
  const text = String(value).trim();
  if (/^(pendiente|sin registro|n\/a|-)$/i.test(text)) return null;
  const n = Number(text.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  return int >= 0 ? int : null;
}

function lastDataRow(sheet) {
  let maxRow = -1;
  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!')) continue;
    const r = XLSX.utils.decode_cell(key).r;
    if (r > maxRow) maxRow = r;
  }
  return maxRow;
}

const buffer = readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

const targetSheets = workbook.SheetNames.filter((name) =>
  SEPARATE_SHEETS.some((canonical) => normalizeSheetName(canonical) === normalizeSheetName(name)),
);
if (targetSheets.length === 0) {
  console.error('No se encontraron hojas CAPACITACIÓN LIMA / CAPACITACIÓN PROVINCIA');
  process.exit(1);
}

const records = [];
for (const sheetName of targetSheets) {
  const sheet = workbook.Sheets[sheetName];
  const endRow = lastDataRow(sheet);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false, range: `A1:${XLSX.utils.encode_col(XLSX.utils.decode_range(sheet['!ref']).e.c)}${endRow + 1}` });
  const headerRowIndex = findHeaderRow(rows);
  const resolved = resolveColumns(rows[headerRowIndex] ?? []);
  const get = (id, row) => {
    const col = resolved.map.get(id);
    return col !== undefined && col >= 0 ? row[col] : null;
  };
  console.log(`Hoja "${sheetName}": encabezado fila ${headerRowIndex} · ${resolved.map.size} columnas · ${rows.length - headerRowIndex - 1} filas de datos`);

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === '')) continue;
    const dni = get('dni', row);
    const apellidos = get('apellidos', row);
    if ((dni === null || String(dni).trim() === '') && (apellidos === null || String(apellidos).trim() === '')) continue;
    records.push({
      hoja: sheetName,
      fila: i + 1,
      apellidos: apellidos == null ? '' : String(apellidos).trim(),
      responsable: get('responsable', row),
      totalDiasRaw: get('totalDias', row),
      pasaRaw: get('pasa', row),
      motivoRaw: get('motivo', row),
      totalDias: toTotalDias(get('totalDias', row)),
      pasa: toPasa(get('pasa', row)),
      motivo: get('motivo', row) == null ? '' : String(get('motivo', row)).trim(),
    });
  }
}

const cuenta = (fn) => records.filter(fn).length;
const dias = (r) => r.totalDias;
const pasa = (r) => r.pasa;
const nuncaInicio = (r) => dias(r) == null || dias(r) === 0;
const inicio = (r) => dias(r) != null && dias(r) >= 1;

console.log('\n================ PASO 1 · AUDITORÍA DE ESTADOS REALES ================');
console.log('Archivo :', filePath);
console.log('INGRESOS:', records.length);

console.log('\n--- TOTAL DE DÍAS (interpretado por el sistema) ---');
console.log('  >= 1 (inició)  :', cuenta(inicio));
console.log('  = 0            :', cuenta((r) => dias(r) === 0));
console.log('  vacío / null   :', cuenta((r) => dias(r) == null));

console.log('\n--- PASA A OPERACIONES (interpretado por el sistema) ---');
console.log('  1 (Sí)         :', cuenta((r) => pasa(r) === 1));
console.log('  0 (No)         :', cuenta((r) => pasa(r) === 0));
console.log('  vacío / null   :', cuenta((r) => pasa(r) == null));

console.log('\n--- CRUCE  TOTAL DE DÍAS × PASA A OPERACIONES ---');
const cruces = [
  ['días >= 1 & pasa = 1   → APROBADO', (r) => inicio(r) && pasa(r) === 1],
  ['días >= 1 & pasa = 0   → CAÍDA CAP.', (r) => inicio(r) && pasa(r) === 0],
  ['días >= 1 & pasa vacío → EN CAPAC.', (r) => inicio(r) && pasa(r) == null],
  ['días 0/vac & pasa = 1  → ANOMALÍA', (r) => nuncaInicio(r) && pasa(r) === 1],
  ['días 0/vac & pasa = 0  → DESERCIÓN', (r) => nuncaInicio(r) && pasa(r) === 0],
  ['días 0/vac & pasa vac. → DESERCIÓN', (r) => nuncaInicio(r) && pasa(r) == null],
];
for (const [label, fn] of cruces) console.log(`  ${label.padEnd(36)}: ${cuenta(fn)}`);

console.log('\n--- ESTADOS SEGÚN DEFINICIÓN DE NEGOCIO ---');
const desercion = cuenta(nuncaInicio);
const caidaCap = cuenta((r) => inicio(r) && pasa(r) === 0);
const aprobado = cuenta((r) => inicio(r) && pasa(r) === 1);
const enCap = cuenta((r) => inicio(r) && pasa(r) == null);
console.log('  1. DESERCIÓN (nunca inició)     :', desercion);
console.log('  2. CAÍDA EN CAPACITACIÓN       :', caidaCap);
console.log('  3. APROBADO                    :', aprobado);
console.log('  4. EN CAPACITACIÓN             :', enCap);
console.log('  SUMA (debe = INGRESOS)         :', desercion + caidaCap + aprobado + enCap, 'vs', records.length);
console.log('  Anomalías (días < 1 & pasa=1)  :', cuenta((r) => nuncaInicio(r) && pasa(r) === 1));

console.log('\n--- MOTIVO DE CAÍDA (PASA A OPERACIONES = 0) ---');
const motivos = new Map();
for (const r of records.filter((r) => pasa(r) === 0)) {
  const key = r.motivo || '(vacío)';
  motivos.set(key, (motivos.get(key) ?? 0) + 1);
}
for (const [k, v] of [...motivos.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);

console.log('\n--- MOTIVO DE CAÍDA (NUNCA INICIÓ) ---');
const motivosDes = new Map();
for (const r of records.filter(nuncaInicio)) {
  const key = r.motivo || '(vacío)';
  motivosDes.set(key, (motivosDes.get(key) ?? 0) + 1);
}
for (const [k, v] of [...motivosDes.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
