import XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

/*
 * AUDITORÍA DE TOTAL DE DÍAS
 * Replica EXACTAMENTE la interpretación del sistema (toTotalDias / toPasa / resolveColumns)
 * contra el Excel, y la compara con la interpretación numérica de Excel (validación manual).
 *
 * Uso: node scripts/audit-total-dias.mjs <ruta-al-excel.xlsx>
 */

const EMPTY_TEXT = '—';

function normalizeHeader(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/[ÁÀÂÃÄ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕÖ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U');
}

function normalizeSheetName(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .toUpperCase()
    .replace(/[ÁÀÂÃÄ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕÖ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U')
    .replace(/_/g, ' ')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function startsWithToken(norm, alias) {
  if (!norm.startsWith(alias) || norm.length === alias.length) return norm.startsWith(alias);
  const next = norm[alias.length];
  return next !== undefined && /[\s/()\-_]/.test(next);
}
function containsToken(norm, alias) {
  return new RegExp(`(^|[\\s/()\\-_])${escapeRegExp(alias)}([\\s/()\\-_]|$)`).test(norm);
}
function findInStage(mode, aliases, entries, used) {
  for (const alias of aliases) {
    for (const entry of entries) {
      if (used.has(entry.idx)) continue;
      if (mode === 'exact' && entry.norm === alias) return entry.idx;
      if (mode === 'startsWith' && startsWithToken(entry.norm, alias)) return entry.idx;
      if (mode === 'contains' && containsToken(entry.norm, alias)) return entry.idx;
    }
  }
  return -1;
}

const COLUMN_ALIASES = {
  totalDias: ['TOTAL DE DIAS', 'TOTAL DIAS', 'TOTAL DE DIAS DE CAPACITACION', 'TOTAL DIAS DE CAPACITACION', 'N DE DIAS', 'N DIAS'],
  pasa: ['PASA A OPERACIONES', 'PASO A OPERACIONES', 'PASA OPERACIONES', 'PASA'],
  apellidos: ['APELLIDOS Y NOMBRES', 'APELLIDOS Y NOMBRE', 'NOMBRES Y APELLIDOS', 'NOMBRE COMPLETO', 'NOMBRES COMPLETOS', 'APELLIDOS'],
  supervisor: ['SUPERVISOR', 'SUPERVISOR/A&E', 'SUPERVISOR A&E'],
  zonaComercial: ['ZONA COMERCIAL', 'ZONA COMERCIALIZACION', 'ZONA'],
  sede: ['SEDE', 'LOCAL', 'CENTRO'],
  dni: ['DNI', 'NUMERO DE DNI', 'NUMERO DNI', 'N DE DNI', 'N DNI', 'DOCUMENTO'],
};

function resolveColumns(headers) {
  const entries = [];
  headers.forEach((header, idx) => {
    const norm = normalizeHeader(header);
    if (!norm) return;
    entries.push({ norm, idx });
  });
  const used = new Set();
  const map = new Map();
  const fields = Object.keys(COLUMN_ALIASES);
  for (const mode of ['exact', 'startsWith', 'contains']) {
    for (const field of fields) {
      if (map.has(field)) continue;
      const idx = findInStage(mode, COLUMN_ALIASES[field], entries, used);
      if (idx !== -1) {
        used.add(idx);
        map.set(field, idx);
      }
    }
  }
  return map;
}

function findHeaderRow(rows) {
  let best = 0;
  let bestScore = 0;
  const limit = Math.min(rows.length, 12 + 2);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row) continue;
    const score = resolveColumns(row).size;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return bestScore >= 3 ? best : 0;
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

function categoriaRaw(value) {
  if (value === null || value === undefined) return 'NULL/VACIO';
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0) return `NUMERO ${value}`;
    return `NUMERO ANOMALO (${value})`;
  }
  const text = String(value);
  if (text.trim() === '') return 'STR_VACIO';
  if (/^(pendiente|sin registro|n\/a|-)/i.test(text.trim())) return 'STR_PENDIENTE';
  const n = Number(text.replace(/[^\d.]/g, ''));
  if (Number.isFinite(n)) return `STR_NUMERICO (${JSON.stringify(text)} -> ${n})`;
  return `STR_TEXTO (${JSON.stringify(text)})`;
}

const [, , filePath] = process.argv;
if (!filePath) {
  console.error('Uso: node scripts/audit-total-dias.mjs <ruta-al-excel.xlsx>');
  process.exit(1);
}

const buffer = readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
const requiredSheets = ['CAPACITACION LIMA', 'CAPACITACION PROVINCIA'];

const sheetNames = workbook.SheetNames.map((n) => ({ raw: n, norm: normalizeSheetName(n) }));
console.log('=== HOJAS ENCONTRADAS ===');
sheetNames.forEach((s) => console.log(`  ${s.norm}`));

const targetSheets = sheetNames.filter((s) => requiredSheets.includes(s.norm));
if (targetSheets.length === 0) {
  console.error('No se encontraron hojas CAPACITACION LIMA / CAPACITACION PROVINCIA');
  process.exit(1);
}

let allRows = [];
for (const { raw } of targetSheets) {
  const sheet = workbook.Sheets[raw];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headerRowIndex = findHeaderRow(rows);
  const map = resolveColumns(rows[headerRowIndex] ?? []);
  const getField = (id, row) => {
    const col = map.get(id);
    return col !== undefined && col >= 0 ? row[col] : null;
  };

  console.log(`\n=== HOJA "${raw}" ===`);
  console.log(`  Fila de encabezado: ${headerRowIndex}`);
  const headerLabels = {};
  for (const id of Object.keys(COLUMN_ALIASES)) {
    const col = map.get(id);
    headerLabels[id] = col !== undefined ? rows[headerRowIndex][col] : null;
  }
  console.log('  Columnas resueltas:', JSON.stringify(headerLabels, null, 2).replace(/\n/g, '\n  '));
  console.log(`  Columnas sin resolver: ${Object.keys(COLUMN_ALIASES).filter((k) => !map.has(k)).join(', ') || '(ninguna)'}`);

  const jurisdiccion = headerLabels.apellidos || null;
  void jurisdiccion;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === '')) continue;
    const dni = normalizeCellEmpty(getField('dni', row));
    const apellidos = normalizeCellEmpty(getField('apellidos', row));
    if (dni === EMPTY_TEXT && apellidos === EMPTY_TEXT) continue;

    allRows.push({
      origenHoja: raw,
      rowIndex: i + 1,
      dni,
      apellidos,
      supervisor: String(getField('supervisor', row) ?? '').trim(),
      zonaComercial: String(getField('zonaComercial', row) ?? '').trim(),
      sede: String(getField('sede', row) ?? '').trim(),
      raw: getField('totalDias', row),
      pasa: toPasa(getField('pasa', row)),
      totalDias: toTotalDias(getField('totalDias', row)),
    });
  }
}

function normalizeCellEmpty(value) {
  if (value === null || value === undefined || value === '') return EMPTY_TEXT;
  if (typeof value === 'number') return String(value);
  return String(value).replace(/\s+/g, ' ').trim() || EMPTY_TEXT;
}

console.log(`\n=== TOTAL REGISTROS PARSEADOS (sistema): ${allRows.length} ===`);

console.log('\n=== AUDITORÍA DE CATEGORÍAS (VALOR CRUDO de TOTAL DE DÍAS en Excel) ===');
const catCounts = {};
for (const r of allRows) {
  const cat = categoriaRaw(r.raw);
  catCounts[cat] = (catCounts[cat] ?? 0) + 1;
}
for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

console.log('\n=== AUDITORÍA solicitada (sobre el valor interpretado por el sistema) ===');
const c = {
  MasDeCero: allRows.filter((r) => Number(r.totalDias) > 0).length,
  IgualCero: allRows.filter((r) => Number(r.totalDias) === 0).length,
  NullOIndefinido: allRows.filter((r) => r.totalDias === null || r.totalDias === undefined).length,
};
console.log('  TOTAL INGRESOS', allRows.length);
console.log('  TOTAL_DIAS > 0', c.MasDeCero);
console.log('  TOTAL_DIAS = 0', c.IgualCero);
console.log('  TOTAL_DIAS VACIO/NULL/UNDEFINED', c.NullOIndefinido);
console.log('  (Nota: Number(null)=0 y Number("")=0, por eso se debe auditar el valor CRUDO)');

console.log('\n=== EMBUDO (interpretación del sistema, reglas oficiales) ===');
const embudo = { inician: 0, desercion: 0, bajas: 0, pasan: 0, enCapacitacion: 0 };
for (const r of allRows) {
  if (r.pasa === 1) embudo.pasan += 1;
  else if (r.pasa === 0 && r.totalDias != null && r.totalDias >= 1) embudo.bajas += 1;
  else if (r.totalDias != null && r.totalDias >= 1) embudo.enCapacitacion += 1;
}
embudo.inician = allRows.filter((r) => r.totalDias != null && r.totalDias >= 1).length;
embudo.desercion = allRows.filter((r) => r.totalDias != null && r.totalDias === 0).length;
console.log('  TOTAL INGRESOS         ', allRows.length);
console.log('  INICIAN CAPACITACION   ', embudo.inician);
console.log('  DESERCION              ', embudo.desercion);
console.log('  BAJAS CAPACITACION     ', embudo.bajas);
console.log('  PASAN A OPERACIONES    ', embudo.pasan);
console.log('  EN CAPACITACION        ', embudo.enCapacitacion);

console.log('\n=== EMBUDO (interpretación numérica Excel, validación manual) ===');
const ex = { inician: 0, cero: 0, otros: 0 };
const exDetalle = { inician: [], cero: [] };
for (const r of allRows) {
  const n = typeof r.raw === 'number' ? r.raw : Number(r.raw);
  if (typeof r.raw === 'number' && n >= 1) {
    ex.inician += 1;
    exDetalle.inician.push(r);
  } else if (typeof r.raw === 'number' && n === 0) {
    ex.cero += 1;
    exDetalle.cero.push(r);
  } else {
    ex.otros += 1;
  }
}
console.log('  INICIAN (raw numerico >= 1)     ', ex.inician);
console.log('  DESERCION  (raw numerico = 0)   ', ex.cero);
console.log('  Otros (no numerico)             ', ex.otros);

console.log('\n=== REGISTROS DONDE EXCEL DICE >= 1 PERO EL SISTEMA NO ===');
const perdidosInician = allRows.filter((r) => typeof r.raw === 'number' && r.raw >= 1 && !(r.totalDias != null && r.totalDias >= 1));
console.log(`  Total: ${perdidosInician.length}`);
perdidosInician.forEach((r) => {
  console.log(`  ${r.apellidos} | ${r.supervisor} | ${r.zonaComercial} | ${r.sede} | PASA=${r.pasa} | TOTAL_DIAS(raw)=${r.raw} | SISTEMA=${r.totalDias}`);
});

console.log('\n=== REGISTROS PROBLEMÁTICOS (TOTAL_DE_DIAS no numérico >= 0 o texto no convertible) ===');
const problematicos = allRows.filter((r) => !(typeof r.raw === 'number' && Number.isInteger(r.raw) && r.raw >= 0));
console.log(`  Total: ${problematicos.length}`);
problematicos.forEach((r) => {
  console.log(`  ${categoriaRaw(r.raw)} | ${r.apellidos} | ${r.supervisor} | ${r.zonaComercial} | ${r.sede} | PASA=${r.pasa} | SISTEMA=${r.totalDias}`);
});

console.log('\n=== RESUMEN DE LAS DIFERENCIAS 660/45 vs SISTEMA ===');
const diffInician = (typeof ex.inician === 'number' ? ex.inician : 0) - allRows.filter((r) => r.totalDias >= 1).length;
const diffDesercion = ex.cero - embudo.desercion;
console.log(`  Diferencia INICIAN: ${diffInician > 0 ? '+' : ''}${diffInician}`);
console.log(`  Diferencia DESERCION: ${diffDesercion > 0 ? '+' : ''}${diffDesercion}`);