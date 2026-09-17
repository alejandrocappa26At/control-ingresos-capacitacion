import type { Jurisdiccion, ParseResult, Promotor, ValidationIssue } from '@/types';
import type { WorkBook } from 'xlsx';
import { MAX_DAYS, EMPTY_TEXT, PENDING_TEXT } from '@/lib/constants';
import { normalizeDateValue } from '@/lib/dates';
import { format, formatISO } from 'date-fns';
import { normalizeKey } from '@/lib/utils';
import {
  normalizeHeader,
  normalizeSheetName,
  findHeaderRow,
  resolveColumns,
  validateColumns,
  validateSheets,
  SEPARATE_SHEETS,
  type ResolvedColumns,
} from '@/services/validators/excelValidator';
import { computeKpis } from '@/services/analytics/kpis';
import { EXCEL_CHUNK_SIZE, type ProgressPayload } from './progress';

export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'] as const;

export function isValidFileType(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export type XlsxModule = typeof import('xlsx');

let xlsxPromise: Promise<XlsxModule> | null = null;

async function loadXlsx(): Promise<XlsxModule> {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx').catch((error) => {
      console.error('[xlsx] no se pudo cargar el motor Excel:', error);
      xlsxPromise = null;
      throw error;
    });
  }
  return xlsxPromise;
}

function toText(value: unknown): string {
  if (value === null || value === undefined || value === '') return EMPTY_TEXT;
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return String(Math.trunc(value));
  }
  return String(value).replace(/\s+/g, ' ').trim() || EMPTY_TEXT;
}

function toFecha(value: unknown): { display: string; iso: string } {
  if (value === null || value === undefined || value === '') {
    return { display: PENDING_TEXT, iso: '' };
  }
  const text = String(value).trim();
  if (/^(pendiente|sin registro|n\/a|-)$/i.test(text)) {
    return { display: PENDING_TEXT, iso: '' };
  }
  const date = normalizeDateValue(value);
  if (!date) return { display: PENDING_TEXT, iso: '' };
  return { display: format(date, 'dd/MM/yyyy'), iso: formatISO(date, { representation: 'date' }) };
}

function toAsistencia(value: unknown): 1 | 0 | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value === 1 ? 1 : value === 0 ? 0 : null;
  const text = String(value).trim().toUpperCase();
  if (/^(1|SI|SÍ|ASISTIO|ASISTIÓ|X|PRESENTE)$/.test(text)) return 1;
  if (/^(0|NO|FALTO|FALTÓ)$/.test(text)) return 0;
  return null;
}

function toPasa(value: unknown): 1 | 0 | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value === 1 ? 1 : value === 0 ? 0 : null;
  const text = String(value).trim().toUpperCase();
  if (/^(1|SI|SÍ|PASA|APROBADO|OK)$/.test(text)) return 1;
  if (/^(0|NO|NO PASA|DESAPROBADO|CAIDO|CAÍDO|CÁIDO)$/.test(text)) return 0;
  return null;
}

function toTotalDias(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= MAX_DAYS) return value;
    return null;
  }
  const text = String(value).trim();
  if (/^(pendiente|sin registro|n\/a|-)$/i.test(text)) return null;
  const n = Number(text.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  return int >= 0 && int <= MAX_DAYS ? int : null;
}

interface ParsedRecord {
  jurisdiccion: Jurisdiccion;
  origenHoja: string;
  fechaIngreso: string;
  fechaIngresoISO: string;
  zonaComercial: string;
  sede: string;
  distrito: string;
  nombreTienda: string;
  supervisor: string;
  responsableAS: string;
  dni: string;
  apellidosNombres: string;
  modalidad: string;
  capacitador: string;
  inicioCapacitacion: string;
  inicioISO: string;
  finCapacitacion: string;
  finISO: string;
  entregaOperaciones: string;
  entregaISO: string;
  asistencia: Array<1 | 0 | null>;
  diasAsistidos: number;
  pasaAOperaciones: 1 | 0 | null;
  totalDias: number | null;
  motivoCaida: string;
  subMotivoCaida: string;
}

interface ChunkState {
  rowsProcessed: number;
  rowsInSheet: number;
  promoted: number;
}

async function parseRowsChunked(
  rows: unknown[][],
  headerRowIndex: number,
  resolved: ResolvedColumns,
  jurisdiccion: Jurisdiccion | null,
  origenHoja: string,
  startIndex: number,
  onChunk: (state: ChunkState) => void,
  yieldChunks: boolean,
): Promise<{ records: Promotor[]; skippedJurisdiccion: number; nextIndex: number }> {
  const parsed: ParsedRecord[] = [];
  let skippedJurisdiccion = 0;

  const dataStart = headerRowIndex + 1;
  const rowsInSheet = Math.max(0, rows.length - dataStart);
  const totalChunks = rowsInSheet > 0 ? Math.ceil(rowsInSheet / EXCEL_CHUNK_SIZE) : 0;

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const from = dataStart + chunk * EXCEL_CHUNK_SIZE;
    const to = Math.min(from + EXCEL_CHUNK_SIZE, rows.length);

    for (let i = from; i < to; i++) {
      const row = rows[i];
      if (!row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) {
        continue;
      }

      const getField = (fieldId: string): unknown => {
        const column = resolved.map.get(fieldId);
        return column !== undefined && column >= 0 ? row[column] : null;
      };

      let recordJurisdiccion = jurisdiccion;
      if (recordJurisdiccion === null) {
        const value = normalizeHeader(getField('jurisdiccion'));
        if (value.includes('LIMA')) recordJurisdiccion = 'LIMA';
        else if (value.includes('PROVINCIA')) recordJurisdiccion = 'PROVINCIA';
        else {
          skippedJurisdiccion++;
          continue;
        }
      }

      const dni = toText(getField('dni'));
      const apellidos = toText(getField('apellidos'));
      if (dni === EMPTY_TEXT && apellidos === EMPTY_TEXT) continue;

      const fechaIngreso = toFecha(getField('fechaIngreso'));
      const inicio = toFecha(getField('inicio'));
      const fin = toFecha(getField('fin'));
      const entrega = toFecha(getField('entrega'));

      const asistencia = Array.from({ length: MAX_DAYS }, (_, d) =>
        toAsistencia(getField(`asistencia_D${d + 1}`)),
      );
      const diasAsistidos = asistencia.filter((a) => a === 1).length;
      const pasa = toPasa(getField('pasa'));
      const totalDias = toTotalDias(getField('totalDias'));

      parsed.push({
        jurisdiccion: recordJurisdiccion,
        origenHoja,
        fechaIngreso: fechaIngreso.display,
        fechaIngresoISO: fechaIngreso.iso,
        zonaComercial: normalizeKey(toText(getField('zonaComercial'))),
        sede: toText(getField('sede')),
        distrito: toText(getField('distrito')),
        nombreTienda: toText(getField('tienda')),
        supervisor: toText(getField('supervisor')),
        responsableAS: toText(getField('responsable')),
        dni,
        apellidosNombres: apellidos,
        modalidad: toText(getField('modalidad')),
        capacitador: normalizeKey(toText(getField('capacitador'))),
        inicioCapacitacion: inicio.display,
        inicioISO: inicio.iso,
        finCapacitacion: fin.display,
        finISO: fin.iso,
        entregaOperaciones: entrega.display,
        entregaISO: entrega.iso,
        asistencia,
        pasaAOperaciones: pasa,
        totalDias,
        motivoCaida: toText(getField('motivo')),
        subMotivoCaida: toText(getField('subMotivo')),
        diasAsistidos,
      });
    }

    onChunk({ rowsProcessed: to - dataStart, rowsInSheet, promoted: parsed.length });

    if (yieldChunks && chunk < totalChunks - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  const records: Promotor[] = [];
  for (let k = 0; k < parsed.length; k++) {
    records.push(toPromotor(parsed[k], startIndex + k));
  }

  return { records, skippedJurisdiccion, nextIndex: startIndex + records.length };
}

function toPromotor(record: ParsedRecord, index: number): Promotor {
  let resultado: Promotor['resultado'] = 'PENDIENTE';
  if (record.pasaAOperaciones === 1) resultado = 'APROBADO';
  else if (record.pasaAOperaciones === 0) resultado = 'NO_APROBADO';

  let estado: Promotor['estado'] = 'EN_CAPACITACION';
  if (resultado === 'APROBADO') estado = 'APROBADO';
  else if (resultado === 'NO_APROBADO') estado = 'NO_APROBADO';

  return {
    id: `${record.jurisdiccion}-${index}-${record.dni}`,
    origenHoja: record.origenHoja,
    jurisdiccion: record.jurisdiccion,
    fechaIngreso: record.fechaIngreso,
    zonaComercial: record.zonaComercial,
    sede: record.sede,
    distrito: record.distrito,
    nombreTienda: record.nombreTienda,
    supervisor: record.supervisor,
    responsableAS: record.responsableAS,
    dni: record.dni,
    apellidosNombres: record.apellidosNombres,
    modalidad: record.modalidad,
    capacitador: record.capacitador,
    inicioCapacitacion: record.inicioCapacitacion,
    finCapacitacion: record.finCapacitacion,
    entregaOperaciones: record.entregaOperaciones,
    asistencia: record.asistencia,
    diasAsistidos: record.diasAsistidos,
    diasFaltantes: MAX_DAYS - record.diasAsistidos,
    totalDias: record.totalDias,
    pasaAOperaciones: record.pasaAOperaciones,
    motivoCaida: record.motivoCaida,
    subMotivoCaida: record.subMotivoCaida,
    resultado,
    estado,
    fechasISO: {
      fechaIngreso: record.fechaIngresoISO,
      inicio: record.inicioISO,
      fin: record.finISO,
      entrega: record.entregaISO,
    },
  };
}

export async function parseWorkbookBuffer(
  buffer: ArrayBuffer,
  emit: (payload: ProgressPayload) => void,
  yieldChunks = false,
): Promise<ParseResult> {
  emit({ stage: 'leer', percent: 10, recordsProcessed: 0, totalRecords: 0 });
  console.time('Carga Total');

  const stages: Array<{ name: string; start: number; end?: number }> = [];
  const stageStart = (name: string) => stages.push({ name, start: performance.now() });
  const stageEnd = (name: string) => {
    const entry = stages.find((s) => s.name === name && s.end === undefined);
    if (entry) entry.end = performance.now();
  };

  let XLSX: XlsxModule;
  try {
    XLSX = await loadXlsx();
  } catch (error) {
    console.error('[parseWorkbook] fallo al cargar motor xlsx:', error);
    console.timeEnd('Carga Total');
    return {
      success: false,
      records: [],
      errors: [
        {
          type: 'column',
          message:
            'No se pudo cargar el motor de Excel. Revisa tu conexión y vuelve a intentar; si persiste, recarga la página.',
        },
      ],
    };
  }

  let workbook: WorkBook;
  console.time('Lectura Excel');
  stageStart('Lectura Excel');
  try {
    // 2 pases para evitar convertir TODAS las celdas del archivo: primero enumeramos
    // solo los nombres de hojas (bookSheets) y luego re-leemos únicamente las hojas
    // requeridas (CAPACITACIÓN LIMA y CAPACITACIÓN PROVINCIA). Las demás
    // (CONSOLIDADO, CONSOLIDADO_Anterior, ASIGNACIÓN, MOTIVOS_DE_BAJA, BD_TIENDAS, etc.)
    // se ignoran por completo y ya no se transforman a celdas.
    const bookIndex: WorkBook = XLSX.read(buffer, { type: 'array', bookSheets: true });

    console.time('Validación Hojas');
    stageStart('Validación Hojas');
    const sheetErrors = validateSheets(bookIndex.SheetNames);
    console.timeEnd('Validación Hojas');
    stageEnd('Validación Hojas');
    if (sheetErrors.length > 0) {
      stageEnd('Lectura Excel');
      console.timeEnd('Lectura Excel');
      console.timeEnd('Carga Total');
      return { success: false, records: [], errors: sheetErrors };
    }

    const requiredSheets = new Map<string, string>();
    for (const name of bookIndex.SheetNames) {
      const norm = normalizeSheetName(name);
      if (SEPARATE_SHEETS.some((canonical) => normalizeSheetName(canonical) === norm)) {
        requiredSheets.set(norm, name);
      }
    }

    workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      bookVBA: false,
      bookFiles: false,
      bookProps: false,
      cellText: false,
      cellNF: false,
      cellStyles: false,
      sheets: Array.from(requiredSheets.values()),
    });

    const skipped = bookIndex.SheetNames.filter((name) => !requiredSheets.has(normalizeSheetName(name)));
    console.info(
      `[parseWorkbook] lectura: ${requiredSheets.size} hoja(s) procesada(s), ${skipped.length} ignorada(s) (${skipped.join(', ') || 'ninguna'})`,
    );
  } catch {
    stageEnd('Lectura Excel');
    console.timeEnd('Lectura Excel');
    console.timeEnd('Carga Total');
    return {
      success: false,
      records: [],
      errors: [
        {
          type: 'sheet',
          message: 'El archivo no pudo ser leído. Verifique que sea un Excel válido.',
        },
      ],
    };
  }
  console.timeEnd('Lectura Excel');
  stageEnd('Lectura Excel');

  emit({ stage: 'hojas', percent: 20, recordsProcessed: 0, totalRecords: 0 });
  emit({ stage: 'columnas', percent: 40, recordsProcessed: 0, totalRecords: 0 });

  const sheetDescriptors: Array<{ canonical: string; jurisdiccion: Jurisdiccion | null }> = [
    ...SEPARATE_SHEETS.map((canonical) => ({
      canonical,
      jurisdiccion: (
        normalizeHeader(canonical).includes('LIMA') ? 'LIMA' : 'PROVINCIA'
      ) as Jurisdiccion,
    })),
  ];

  interface SheetTask {
    sheetName: string;
    rows: unknown[][];
    headerRowIndex: number;
    resolved: ResolvedColumns;
    jurisdiccion: Jurisdiccion | null;
    dataRows: number;
  }

  const sheetTasks: SheetTask[] = [];
  const allIssues: ValidationIssue[] = [];
  let totalDataRows = 0;

  console.time('Validación Columnas');
  stageStart('Validación Columnas');
  for (const desc of sheetDescriptors) {
    const sheetName = workbook.SheetNames.find(
      (name) => normalizeSheetName(name) === normalizeSheetName(desc.canonical),
    );
    if (!sheetName) continue;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const headerRowIndex = findHeaderRow(rows);
    const resolved = resolveColumns(rows[headerRowIndex] ?? []);
    console.info(
      `[parseWorkbook] hoja "${sheetName}": fila de encabezados ${headerRowIndex}, ${resolved.map.size} columnas reconocidas`,
    );

    const columnIssues = validateColumns(resolved);

    if (columnIssues.length > 0) {
      allIssues.push(...columnIssues);
      continue;
    }

    const dataRows = Math.max(0, rows.length - headerRowIndex - 1);
    console.info(
      `[parseWorkbook] hoja "${sheetName}": total filas=${rows.length}, filas con datos=${dataRows}`,
    );

    totalDataRows += dataRows;
    sheetTasks.push({ sheetName, rows, headerRowIndex, resolved, jurisdiccion: desc.jurisdiccion, dataRows });
  }

  console.timeEnd('Validación Columnas');
  stageEnd('Validación Columnas');

  if (allIssues.length > 0) {
    console.warn('[parseWorkbook] validación rechazada:', allIssues);
    console.timeEnd('Carga Total');
    return { success: false, records: [], errors: allIssues };
  }

  const allRecords: Promotor[] = [];
  let globalIndex = 0;
  let baseRows = 0;

  console.time('Procesamiento');
  stageStart('Procesamiento');
  for (const task of sheetTasks) {
    const parsed = await parseRowsChunked(
      task.rows,
      task.headerRowIndex,
      task.resolved,
      task.jurisdiccion,
      task.sheetName,
      globalIndex,
      (state) => {
        const rowsProcessedGlobal = baseRows + state.rowsProcessed;
        const recordsProcessed = globalIndex + state.promoted;
        const percent = 40 + Math.round((rowsProcessedGlobal * 20) / Math.max(1, totalDataRows));
        emit({
          stage: 'registros',
          percent,
          recordsProcessed,
          totalRecords: totalDataRows,
        });
      },
      yieldChunks,
    );
    globalIndex = parsed.nextIndex;
    baseRows += task.dataRows;
    allRecords.push(...parsed.records);

    if (parsed.skippedJurisdiccion > 0) {
      console.info(
        `[parseWorkbook] hoja: ${parsed.records.length} registros parseados (${parsed.skippedJurisdiccion} filas sin jurisdicción válida)`,
      );
    } else {
      console.info(`[parseWorkbook] hoja: ${parsed.records.length} registros parseados`);
    }
  }
  console.timeEnd('Procesamiento');
  stageEnd('Procesamiento');

  console.log('[AUDITORIA] Dataset final:', allRecords.length);

  const totalLima = allRecords.filter((r) => r.jurisdiccion === 'LIMA').length;
  const totalProvincia = allRecords.filter((r) => r.jurisdiccion === 'PROVINCIA').length;

  const cuentaPorDni = new Map<string, number>();
  for (const r of allRecords) {
    cuentaPorDni.set(r.dni, (cuentaPorDni.get(r.dni) ?? 0) + 1);
  }
  const dniesDuplicados = Array.from(cuentaPorDni.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
  const registrosDuplicados = dniesDuplicados.reduce((acc, [, count]) => acc + (count - 1), 0);

  console.log(`[AUDITORIA] Provincia: ${totalProvincia}`);
  console.log(`[AUDITORIA] Lima: ${totalLima}`);
  console.log(`[AUDITORIA] DNIs repetidos: ${dniesDuplicados.length}`);
  console.log(`[AUDITORIA] Registros duplicados: ${registrosDuplicados}`);
  console.log(`[AUDITORIA] Registros únicos: ${allRecords.length - registrosDuplicados}`);

  if (dniesDuplicados.length > 0) {
    console.warn(
      `[AUDITORIA] DNIs duplicados (${dniesDuplicados.length}):`,
      dniesDuplicados.slice(0, 20).map(([dni, count]) => `${dni} (x${count})`).join(', '),
      dniesDuplicados.length > 20 ? ` ... y ${dniesDuplicados.length - 20} más` : '',
    );
  }

  emit({ stage: 'kpis', percent: 80, recordsProcessed: allRecords.length, totalRecords: allRecords.length });

  console.time('KPIs');
  stageStart('KPIs');
  const kpis = computeKpis(allRecords);
  console.timeEnd('KPIs');
  stageEnd('KPIs');

  emit({ stage: 'fin', percent: 100, recordsProcessed: allRecords.length, totalRecords: allRecords.length });

  console.info(
    `[parseWorkbook] éxito: ${allRecords.length} registros (Lima ${totalLima} | Provincia ${totalProvincia})`,
  );

  const sorted = stages
    .filter((s) => s.end !== undefined && s.end >= s.start)
    .map((s) => ({ Fase: s.name, Tiempo: `${Math.round(s.end! - s.start)} ms` }))
    .sort((a, b) => parseFloat(b.Tiempo) - parseFloat(a.Tiempo));
  console.groupCollapsed('[AUDITORÍA] Cuello de botella (peor → mejor)');
  console.table(sorted);
  const dominant = sorted.find((s) => s.Fase !== 'Lectura Excel') ?? sorted[0];
  if (dominant) {
    console.log(`>>> Fase dominante: ${dominant.Fase} (${dominant.Tiempo})`);
  }
  console.groupEnd();

  console.timeEnd('Carga Total');

  return {
    success: true,
    records: allRecords,
    errors: [],
    meta: {
      totalRegistros: allRecords.length,
      totalLima,
      totalProvincia,
      kpis,
    },
  };
}