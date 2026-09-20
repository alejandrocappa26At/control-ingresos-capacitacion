export const REQUIRED_SHEETS = ['CAPACITACIÓN LIMA', 'CAPACITACIÓN PROVINCIA'] as const;

export const REQUIRED_COLUMNS = [
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
  'PASA A OPERACIONES',
  'MOTIVO DE CAIDA',
  'SUB MOTIVO DE CAIDA',
] as const;

export type ColumnName = (typeof REQUIRED_COLUMNS)[number];

export const ASISTENCIA_COLUMNS: string[] = Array.from(
  { length: 10 },
  (_, i) => `ASISTENCIA DÍA ${i + 1}`,
);

export const ESTADO_LABELS: Record<string, string> = {
  EN_CAPACITACION: 'EN CAPACITACIÓN',
  APROBADO: 'APROBADO',
  NO_APROBADO: 'NO APROBADO',
  PENDIENTE: 'PENDIENTE',
};

export const ESTADO_DOT: Record<string, string> = {
  EN_CAPACITACION: 'bg-amber-400',
  APROBADO: 'bg-emerald-500',
  NO_APROBADO: 'bg-rose-500',
  PENDIENTE: 'bg-slate-400',
};

export const EMPTY_TEXT = '—';
export const PENDING_TEXT = 'Pendiente';
export const NO_REGISTRO_TEXT = 'Sin registro';

export const MAX_DAYS = 10;
export const MAX_TOTAL_DIAS = 12;