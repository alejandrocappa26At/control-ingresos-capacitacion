import type { ValidationIssue } from '@/types';
import { REQUIRED_SHEETS, MAX_DAYS } from '@/lib/constants';

export function normalizeHeader(text: unknown): string {
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

export function normalizeSheetName(text: unknown): string {
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

export interface ColumnField {
  id: string;
  label: string;
  aliases: string[];
  required: boolean;
}

export const COLUMN_FIELDS: ColumnField[] = [
  { id: 'jurisdiccion', label: 'JURIDICCION', required: false, aliases: ['JURIDICCION', 'JURISDICCION', 'PLAZA', 'REGION', 'DEPARTAMENTO', 'CIUDAD'] },
  { id: 'fechaIngreso', label: 'FECHA DE INGRESO', required: true, aliases: ['FECHA DE INGRESO', 'FECHA INGRESO', 'F. DE INGRESO', 'F INGRESO', 'INGRESO'] },
  { id: 'zonaComercial', label: 'ZONA COMERCIAL', required: true, aliases: ['ZONA COMERCIAL', 'ZONA COMERCIALIZACION', 'ZONA'] },
  { id: 'sede', label: 'SEDE', required: true, aliases: ['SEDE', 'LOCAL', 'CENTRO'] },
  { id: 'distrito', label: 'DISTRITO', required: true, aliases: ['DISTRITO', 'DISTRITOS'] },
  { id: 'tienda', label: 'NOMBRE DE TIENDA', required: true, aliases: ['NOMBRE DE TIENDA', 'NOMBRE TIENDA', 'TIENDA'] },
  { id: 'supervisor', label: 'SUPERVISOR', required: true, aliases: ['SUPERVISOR', 'SUPERVISOR/A&E', 'SUPERVISOR A&E'] },
  { id: 'responsable', label: 'RESPONSABLE A&S', required: true, aliases: ['RESPONSABLE A&S', 'RESPONSABLE AS', 'RESPONSABEL A&S', 'RESPONSABEL AS', 'RESPONSABLE'] },
  { id: 'dni', label: 'DNI', required: true, aliases: ['DNI', 'NUMERO DE DNI', 'NUMERO DNI', 'N DE DNI', 'N DNI', 'DOCUMENTO'] },
  { id: 'apellidos', label: 'APELLIDOS Y NOMBRES', required: true, aliases: ['APELLIDOS Y NOMBRES', 'APELLIDOS Y NOMBRE', 'NOMBRES Y APELLIDOS', 'NOMBRE COMPLETO', 'NOMBRES COMPLETOS', 'APELLIDOS'] },
  { id: 'modalidad', label: 'MODALIDAD', required: true, aliases: ['MODALIDAD', 'TIPO DE SESION', 'TIPO SESION'] },
  { id: 'capacitador', label: 'CAPACITADOR', required: true, aliases: ['CAPACITADOR', 'CAPACITADORA', 'FACILITADOR', 'FORMADOR'] },
  { id: 'inicio', label: 'F. INICIO CAPACITACIÓN', required: true, aliases: ['F. INICIO CAPACITACION', 'F INICIO CAPACITACION', 'FECHA DE INICIO CAPACITACION', 'FECHA INICIO CAPACITACION', 'INICIO CAPACITACION', 'F. INICIO', 'INICIO'] },
  { id: 'fin', label: 'F. FIN DE CAPACITACIÓN', required: true, aliases: ['F. FIN DE CAPACITACION', 'F FIN DE CAPACITACION', 'FECHA DE FIN DE CAPACITACION', 'FECHA FIN CAPACITACION', 'FIN DE CAPACITACION', 'FIN CAPACITACION', 'F. FIN', 'FIN'] },
  { id: 'entrega', label: 'F. ENTREGA A OPERACIONES', required: true, aliases: ['F. ENTREGA A OPERACIONES', 'F ENTREGA A OPERACIONES', 'FECHA ENTREGA A OPERACIONES', 'FECHA DE ENTREGA A OPERACIONES', 'ENTREGA A OPERACIONES', 'ENTREGA'] },
  { id: 'subMotivo', label: 'SUB MOTIVO DE CAIDA', required: true, aliases: ['SUB MOTIVO DE CAIDA', 'SUB MOTIVO DE CAÍDA', 'SUBMOTIVO DE CAIDA', 'SUB MOTIVO', 'SUBMOTIVO', 'DETALLE CAIDA'] },
  { id: 'motivo', label: 'MOTIVO DE CAIDA', required: true, aliases: ['MOTIVO DE CAIDA', 'MOTIVO DE CAÍDA', 'MOTIVO CAIDA', 'CAUSA DE CAIDA', 'MOTIVO'] },
  { id: 'pasa', label: 'PASA A OPERACIONES', required: true, aliases: ['PASA A OPERACIONES', 'PASO A OPERACIONES', 'PASA OPERACIONES', 'PASA'] },
];

export function asistenciaFieldId(day: number): string {
  return `asistencia_D${day}`;
}

export function isAsistenciaFieldId(id: string): boolean {
  return /^asistencia_D[1-9][0-9]*$/.test(id);
}

export interface ResolvedColumns {
  map: Map<string, number>;
}

interface Entry {
  norm: string;
  idx: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function startsWithToken(norm: string, alias: string): boolean {
  if (!norm.startsWith(alias) || norm.length === alias.length) return norm.startsWith(alias);
  const next = norm[alias.length];
  return next !== undefined && /[\s/()\-_]/.test(next);
}

function containsToken(norm: string, alias: string): boolean {
  return new RegExp(`(^|[\\s/()\\-_])${escapeRegExp(alias)}([\\s/()\\-_]|$)`).test(norm);
}

function findInStage(
  mode: 'exact' | 'startsWith' | 'contains',
  aliases: string[],
  entries: Entry[],
  used: Set<number>,
): number {
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

export function parseAsistenciaDay(norm: string): number | null {
  const match = norm.match(/^(?:ASISTENCIA[\s_/-]*)?(?:DIA[\s_/-]*|D[\s_/-]*)?(\d{1,2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  if (Number.isNaN(day)) return null;
  return day;
}

export function resolveColumns(headers: unknown[]): ResolvedColumns {
  const entries: Entry[] = [];
  headers.forEach((header, idx) => {
    const norm = normalizeHeader(header);
    if (!norm) return;
    entries.push({ norm, idx });
  });

  const used = new Set<number>();
  const map = new Map<string, number>();

  for (const field of COLUMN_FIELDS) {
    const idx = findInStage('exact', field.aliases, entries, used);
    if (idx !== -1) {
      used.add(idx);
      map.set(field.id, idx);
    }
  }
  for (const field of COLUMN_FIELDS) {
    if (map.has(field.id)) continue;
    const idx = findInStage('startsWith', field.aliases, entries, used);
    if (idx !== -1) {
      used.add(idx);
      map.set(field.id, idx);
    }
  }
  for (const field of COLUMN_FIELDS) {
    if (map.has(field.id)) continue;
    const idx = findInStage('contains', field.aliases, entries, used);
    if (idx !== -1) {
      used.add(idx);
      map.set(field.id, idx);
    }
  }

  for (const entry of entries) {
    if (used.has(entry.idx)) continue;
    const day = parseAsistenciaDay(entry.norm);
    if (day !== null && day >= 1 && day <= MAX_DAYS && !map.has(asistenciaFieldId(day))) {
      used.add(entry.idx);
      map.set(asistenciaFieldId(day), entry.idx);
    }
  }

  return { map };
}

export function findHeaderRow(sheetRows: unknown[][]): number {
  let best = 0;
  let bestScore = 0;
  const limit = Math.min(sheetRows.length, MAX_DAYS + 2);
  for (let i = 0; i < limit; i++) {
    const row = sheetRows[i];
    if (!row) continue;
    const score = resolveColumns(row).map.size;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return bestScore >= 3 ? best : 0;
}

export const SEPARATE_SHEETS = [...REQUIRED_SHEETS] as const;
export const PROCESSABLE_SHEETS = [...SEPARATE_SHEETS] as const;

export function validateSheets(sheetNames: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const present = sheetNames.map((s) => normalizeSheetName(s));

  const hasSeparate = SEPARATE_SHEETS.some((s) => present.includes(normalizeSheetName(s)));

  if (!hasSeparate) {
    console.error('Hojas encontradas:', sheetNames);
    console.error('Hojas normalizadas:', present);
    issues.push({
      type: 'sheet',
      message: `No se puede procesar el archivo. No se encontró ninguna hoja válida. Hojas encontradas: ${sheetNames.join(', ') || '(ninguna)'}. Debe existir CAPACITACIÓN LIMA y CAPACITACIÓN PROVINCIA.`,
    });
  }
  return issues;
}

export function validateColumns(resolved: ResolvedColumns): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const field of COLUMN_FIELDS) {
    if (!field.required) continue;
    if (resolved.map.has(field.id)) continue;
    issues.push({
      type: 'column',
      message: `No se puede procesar el archivo porque falta la columna [${field.label}]`,
    });
  }
  return issues;
}