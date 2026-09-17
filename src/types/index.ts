export type Jurisdiccion = 'LIMA' | 'PROVINCIA';

export type Estado = 'EN_CAPACITACION' | 'APROBADO' | 'NO_APROBADO' | 'PENDIENTE';

export type ResultadoCapacitacion = 'APROBADO' | 'NO_APROBADO' | 'PENDIENTE';

export interface FechasISO {
  fechaIngreso: string;
  inicio: string;
  fin: string;
  entrega: string;
}

export interface Promotor {
  id: string;
  origenHoja: string;
  jurisdiccion: Jurisdiccion;
  fechaIngreso: string;
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
  finCapacitacion: string;
  entregaOperaciones: string;
  asistencia: Array<1 | 0 | null>;
  diasAsistidos: number;
  diasFaltantes: number;
  totalDias: number | null;
  pasaAOperaciones: 1 | 0 | null;
  motivoCaida: string;
  subMotivoCaida: string;
  resultado: ResultadoCapacitacion;
  estado: Estado;
  fechasISO: FechasISO;
}

export interface DateFilterValue {
  type: 'all' | 'day' | 'month' | 'year' | 'range';
  day?: string;
  month?: string;
  year?: string;
  from?: string;
  to?: string;
}

export interface FilterState {
  jurisdiccion: string;
  fechaIngreso: DateFilterValue;
  zonaComercial: string;
  sede: string;
  distrito: string;
  tienda: string;
  supervisor: string;
  responsableAS: string;
  modalidad: string;
  capacitador: string[];
  inicioCapacitacion: DateFilterValue;
  finCapacitacion: DateFilterValue;
  entregaOperaciones: DateFilterValue;
  pasaAOperaciones: string;
  motivoCaida: string;
  subMotivoCaida: string;
}

export interface UploadMeta {
  fileName: string;
  uploadedAt: string;
  totalRegistros: number;
  totalLima: number;
  totalProvincia: number;
  fileSizeBytes: number;
}

export interface ValidationIssue {
  type: 'sheet' | 'column';
  message: string;
}

export interface ParseMeta {
  totalRegistros: number;
  totalLima: number;
  totalProvincia: number;
  kpis?: Kpis;
}

export interface ParseResult {
  success: boolean;
  records: Promotor[];
  errors: ValidationIssue[];
  meta?: ParseMeta;
}

export interface Kpis {
  totalIngresos: number;
  lima: number;
  provincia: number;
  enCapacitacion: number;
  capacitacionFinalizada: number;
  pasanAOperaciones: number;
  noPasanAOperaciones: number;
  porcentajeAprobacion: number;
  porcentajeCaida: number;
  procesosFinalizados: number;
}

export type SerieItem = {
  name: string;
  value: number;
  porcentaje: number;
};

export interface CapacitadorSummary {
  capacitador: string;
  asignados: number;
  finalizados: number;
  enProceso: number;
  aprobados: number;
  noAprobados: number;
}

export interface DiaAsistencia {
  dia: number;
  asistieron: number;
  faltaron: number;
  sinRegistro: number;
  porcentaje: number;
}

export interface AsistenciaSummary {
  porDia: DiaAsistencia[];
  promedioGeneral: number;
}

export interface CaidaRanking {
  motivo: string;
  cantidad: number;
  porcentaje: number;
}

export interface Alerta {
  id: string;
  tipo: 'baja-asistencia' | 'proxima-finalizacion' | 'pendiente-entrega' | 'incremento-caidas' | 'riesgo-desaprobacion';
  nivel: 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  cantidad: number;
  recordsIds: string[];
}

export type ChartMode = 'cantidad' | 'porcentaje';

export interface DetallePromotor {
  promotor: Promotor;
}