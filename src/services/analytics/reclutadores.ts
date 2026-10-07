import type { Promotor } from '@/types';
import { normalizeKey } from '@/lib/utils';

export type NivelDesercion = 'excelente' | 'bueno' | 'riesgo' | 'critico';

export const RANGOS_SEMAFORO = [
  { nivel: 'excelente' as const, emoji: '🟢', label: 'Excelente', max: 5, rango: '0-5%' },
  { nivel: 'bueno' as const, emoji: '🟡', label: 'Bueno', max: 10, rango: '>5-10%' },
  { nivel: 'riesgo' as const, emoji: '🟠', label: 'Riesgo', max: 15, rango: '>10-15%' },
  { nivel: 'critico' as const, emoji: '🔴', label: 'Crítico', max: Infinity, rango: '>15%' },
];

export const SEMAFORO_STYLES: Record<NivelDesercion, { emoji: string; label: string; color: string; dim: string }> = {
  excelente: { emoji: '🟢', label: 'Excelente', color: '#22c55e', dim: 'rgba(34,197,94,0.9)' },
  bueno: { emoji: '🟡', label: 'Bueno', color: '#eab308', dim: 'rgba(234,179,8,0.9)' },
  riesgo: { emoji: '🟠', label: 'Riesgo', color: '#f97316', dim: 'rgba(249,115,22,0.9)' },
  critico: { emoji: '🔴', label: 'Crítico', color: '#dc2626', dim: 'rgba(220,38,38,0.9)' },
};

export function nivelDesercion(tasa: number): NivelDesercion {
  if (tasa < 3) return 'excelente';
  if (tasa < 6) return 'bueno';
  if (tasa < 9) return 'riesgo';
  return 'critico';
}

export function nivelSemaforo(tasa: number): NivelDesercion {
  if (tasa <= 5) return 'excelente';
  if (tasa <= 10) return 'bueno';
  if (tasa <= 15) return 'riesgo';
  return 'critico';
}

/* ══════════════════════════════════════════════════════════════════
 *  REGLAS DE NEGOCIO DEL MÓDULO DE CAÍDAS (fuente de verdad)
 * ══════════════════════════════════════════════════════════════════
 *
 *  DESERCIÓN (nunca inició capacitación)
 *      TOTAL DE DÍAS = 0  O  TOTAL DE DÍAS vacío
 *
 *  CAÍDA DURANTE CAPACITACIÓN (sí inició y abandonó / fue retirado)
 *      TOTAL DE DÍAS >= 1  Y  PASA A OPERACIONES = 0
 *
 *  APROBADO
 *      TOTAL DE DÍAS >= 1  Y  PASA A OPERACIONES = 1
 *
 *  EN CAPACITACIÓN
 *      TOTAL DE DÍAS >= 1  Y  PASA A OPERACIONES vacío
 *
 *  ── FÓRMULAS ───────────────────────────────────────────────────
 *  TOTAL INGRESOS A CAPACITACIÓN = APROBADOS + CAÍDAS EN CAPACITACIÓN + CAÍDAS POR DESERCIÓN + EN CAPACITACIÓN
 *  TASA DESERCIÓN  = CAÍDAS POR DESERCIÓN / TOTAL INGRESOS × 100
 *  TASA BAJA       = CAÍDAS EN CAPACITACIÓN / TOTAL INGRESOS × 100
 *  TASA TOTAL      = (CAÍDAS POR DESERCIÓN + CAÍDAS EN CAPACITACIÓN) / TOTAL INGRESOS × 100
 *  PERMANENCIA     = (APROBADOS + EN CAPACITACIÓN) / TOTAL INGRESOS × 100
 * ══════════════════════════════════════════════════════════════════
 */

/** DESERCIÓN: TOTAL DE DÍAS = 0 o vacío → nunca inició capacitación. */
export function esDesercion(r: Promotor): boolean {
  return r.totalDias == null || r.totalDias === 0;
}

/** CAÍDA DURANTE CAPACITACIÓN: TOTAL DE DÍAS >= 1 y PASA A OPERACIONES = 0. */
export function esCaidaCapacitacion(r: Promotor): boolean {
  return r.totalDias != null && r.totalDias >= 1 && r.pasaAOperaciones === 0;
}

/** APROBADO: TOTAL DE DÍAS >= 1 y PASA A OPERACIONES = 1. */
export function esAprobado(r: Promotor): boolean {
  return r.totalDias != null && r.totalDias >= 1 && r.pasaAOperaciones === 1;
}

/** EN CAPACITACIÓN: TOTAL DE DÍAS >= 1 y PASA A OPERACIONES vacío. */
export function esEnCapacitacion(r: Promotor): boolean {
  return r.totalDias != null && r.totalDias >= 1 && r.pasaAOperaciones == null;
}

/** Reserva de seguridad: días < 1 con PASA = Sí (dato contradictorio). */
export function esAnomaliaEstados(r: Promotor): boolean {
  return esDesercion(r) && r.pasaAOperaciones === 1;
}

export interface ResumenReclutador {
  responsable: string;
  ingresos: number;
  /** TOTAL DE DÍAS = 0 o vacío. */
  deserciones: number;
  /** TOTAL DE DÍAS >= 1 y PASA = 0. */
  caidasCapacitacion: number;
  /** TOTAL DE DÍAS >= 1 y PASA = 1. */
  aprobados: number;
  /** TOTAL DE DÍAS >= 1 y PASA vacío. */
  enCapacitacion: number;
  /** APROBADOS + CAÍDAS EN CAPACITACIÓN: proceso concluido. */
  procesosFinalizados: number;
  /** DESERCIONES / INGRESOS × 100. */
  tasaDesercion: number;
  /** CAÍDAS EN CAPACITACIÓN / INGRESOS × 100. */
  tasaBaja: number;
  /** (DESERCIONES + CAÍDAS EN CAPACITACIÓN) / INGRESOS × 100: pérdida total. */
  tasaTotal: number;
  tasaPermanencia: number;
  pctDelTotal: number;
  pctDeserciones: number;
  nivel: NivelDesercion;
}

export interface ReclutadoresAnalisis {
  totalReclutadores: number;
  totalIngresos: number;
  totalDeserciones: number;
  totalCaidasCapacitacion: number;
  totalAprobados: number;
  totalEnCapacitacion: number;
  registrosSinResponsable: number;
  productividad: ResumenReclutador[];
  desercion: ResumenReclutador[];
}

export function analizarReclutadores(records: Promotor[]): ReclutadoresAnalisis {
  const map = new Map<string, ResumenReclutador>();
  let registrosSinResponsable = 0;

  for (const r of records) {
    const key = normalizeKey(r.responsableAS);
    if (!key || key === '—') {
      registrosSinResponsable += 1;
      continue;
    }
    let entry = map.get(key);
    if (!entry) {
      entry = {
        responsable: key,
        ingresos: 0,
        deserciones: 0,
        caidasCapacitacion: 0,
        aprobados: 0,
        enCapacitacion: 0,
        procesosFinalizados: 0,
        tasaDesercion: 0,
        tasaBaja: 0,
        tasaTotal: 0,
        tasaPermanencia: 0,
        pctDelTotal: 0,
        pctDeserciones: 0,
        nivel: 'excelente',
      };
      map.set(key, entry);
    }
    entry.ingresos += 1;
    if (esDesercion(r)) entry.deserciones += 1;
    else if (esCaidaCapacitacion(r)) entry.caidasCapacitacion += 1;
    else if (esAprobado(r)) entry.aprobados += 1;
    else entry.enCapacitacion += 1;
  }

  const list = Array.from(map.values());
  const totalIngresos = list.reduce((s, e) => s + e.ingresos, 0);
  const totalDeserciones = list.reduce((s, e) => s + e.deserciones, 0);

  for (const e of list) {
    e.procesosFinalizados = e.aprobados + e.caidasCapacitacion;
    e.tasaDesercion = e.ingresos > 0 ? (e.deserciones / e.ingresos) * 100 : 0;
    e.tasaBaja = e.ingresos > 0 ? (e.caidasCapacitacion / e.ingresos) * 100 : 0;
    e.tasaTotal =
      e.ingresos > 0 ? ((e.deserciones + e.caidasCapacitacion) / e.ingresos) * 100 : 0;
    e.tasaPermanencia = e.ingresos > 0 ? ((e.aprobados + e.enCapacitacion) / e.ingresos) * 100 : 0;
    e.pctDelTotal = totalIngresos > 0 ? (e.ingresos / totalIngresos) * 100 : 0;
    e.pctDeserciones = totalDeserciones > 0 ? (e.deserciones / totalDeserciones) * 100 : 0;
    e.nivel = nivelSemaforo(e.tasaDesercion);
  }

  const productividad = [...list].sort((a, b) => b.ingresos - a.ingresos);
  const desercion = [...list].sort(
    (a, b) => b.tasaDesercion - a.tasaDesercion || b.deserciones - a.deserciones,
  );

  return {
    totalReclutadores: list.length,
    totalIngresos,
    totalDeserciones,
    totalCaidasCapacitacion: list.reduce((s, e) => s + e.caidasCapacitacion, 0),
    totalAprobados: list.reduce((s, e) => s + e.aprobados, 0),
    totalEnCapacitacion: list.reduce((s, e) => s + e.enCapacitacion, 0),
    registrosSinResponsable,
    productividad,
    desercion,
  };
}

/**
 * VALIDACIÓN OBLIGATORIA (consola del navegador).
 *
 * 1) Audita los estados reales registrados en el Excel:
 *    TOTAL DE DÍAS, PASA A OPERACIONES y MOTIVO DE CAÍDA.
 * 2) Imprime la tabla por reclutador para contrastarla con el Excel:
 *    RECLUTADOR · INGRESOS · DESERCIONES · CAÍDAS_CAPACITACION ·
 *    APROBADOS · EN_CAPACITACION · TASA_DESERCION · TASA_BAJA · TASA_TOTAL · PERMANENCIA
 * 3) Valida que la partición por reclutador cierre contra los ingresos.
 */
export function validarCalculosReclutadores(records: Promotor[]): void {
  const a = analizarReclutadores(records);

  console.groupCollapsed(`[MÓDULO CAÍDAS · RECLUTADORES] Validación de cálculos (${records.length} registros)`);

  console.log('REGLA DESERCIÓN             : TOTAL DE DÍAS = 0 o vacío (nunca inició)');
  console.log('REGLA CAÍDAS EN CAPACITACIÓN: TOTAL DE DÍAS >= 1 y PASA A OPERACIONES = 0');

  const diasMayorIgual1 = records.filter((r) => r.totalDias != null && r.totalDias >= 1).length;
  const diasCero = records.filter((r) => r.totalDias === 0).length;
  const diasVacio = records.filter((r) => r.totalDias == null).length;
  const pasaSi = records.filter((r) => r.pasaAOperaciones === 1).length;
  const pasaNo = records.filter((r) => r.pasaAOperaciones === 0).length;
  const pasaVacio = records.filter((r) => r.pasaAOperaciones == null).length;
  const anomalias = records.filter(esAnomaliaEstados).length;

  console.log('\n1) ESTADOS REALES REGISTRADOS');
  console.table({
    'TOTAL DE DÍAS': { '>= 1 (inició)': diasMayorIgual1, '= 0': diasCero, 'vacío': diasVacio },
    'PASA A OPERACIONES': { 'Sí (=1)': pasaSi, 'No (=0)': pasaNo, 'vacío': pasaVacio },
  });

  console.log('\n2) CLASIFICACIÓN POR DEFINICIÓN DE NEGOCIO');
  console.table({
    DESERCIÓN: registrosCon(a.totalDeserciones, 'TOTAL DE DÍAS = 0 o vacío'),
    'CAÍDAS EN CAPACITACIÓN': registrosCon(a.totalCaidasCapacitacion, 'TOTAL DE DÍAS >= 1 y PASA = 0'),
    APROBADOS: registrosCon(a.totalAprobados, 'TOTAL DE DÍAS >= 1 y PASA = 1'),
    'EN CAPACITACIÓN': registrosCon(a.totalEnCapacitacion, 'TOTAL DE DÍAS >= 1 y PASA vacío'),
  });
  if (anomalias > 0) {
    console.warn(`ANOMALÍAS (TOTAL DE DÍAS < 1 con PASA A OPERACIONES = Sí): ${anomalias} → contadas como DESERCIÓN.`);
  }

  const motivos = new Map<string, number>();
  for (const r of records) {
    const motivo = (r.motivoCaida ?? '').trim();
    if (!motivo || motivo === '—') continue;
    motivos.set(motivo, (motivos.get(motivo) ?? 0) + 1);
  }
  if (motivos.size > 0) {
    console.log('\n2b) MOTIVO DE CAÍDA REGISTRADOS EN EL EXCEL');
    console.table(
      [...motivos.entries()]
        .sort((x, y) => y[1] - x[1])
        .map(([motivo, cantidad]) => ({ MOTIVO: motivo, REGISTROS: cantidad })),
    );
  }

  const tabla = a.productividad.map((r) => ({
    RECLUTADOR: r.responsable,
    INGRESOS: r.ingresos,
    DESERCIONES: r.deserciones,
    'CAÍDAS_CAPACITACION': r.caidasCapacitacion,
    APROBADOS: r.aprobados,
    EN_CAPACITACION: r.enCapacitacion,
    TASA_DESERCION: `${r.tasaDesercion.toFixed(1)}%`,
    TASA_BAJA: `${r.tasaBaja.toFixed(1)}%`,
    TASA_TOTAL: `${r.tasaTotal.toFixed(1)}%`,
    PERMANENCIA: `${r.tasaPermanencia.toFixed(1)}%`,
  }));

  console.log('\n3) VALIDACIÓN POR RECLUTADOR (contrastar contra el Excel)');
  console.table(tabla);

  const totales = {
    RECLUTADOR: 'TOTAL',
    INGRESOS: a.totalIngresos,
    DESERCIONES: a.totalDeserciones,
    'CAÍDAS_CAPACITACION': a.totalCaidasCapacitacion,
    APROBADOS: a.totalAprobados,
    EN_CAPACITACION: a.totalEnCapacitacion,
    TASA_DESERCION: `${a.totalIngresos > 0 ? ((a.totalDeserciones / a.totalIngresos) * 100).toFixed(1) : '0.0'}%`,
    TASA_BAJA: `${a.totalIngresos > 0 ? ((a.totalCaidasCapacitacion / a.totalIngresos) * 100).toFixed(1) : '0.0'}%`,
    TASA_TOTAL: `${
      a.totalIngresos > 0
        ? (((a.totalDeserciones + a.totalCaidasCapacitacion) / a.totalIngresos) * 100).toFixed(1)
        : '0.0'
    }%`,
    PERMANENCIA: `${a.totalIngresos > 0 ? (((a.totalAprobados + a.totalEnCapacitacion) / a.totalIngresos) * 100).toFixed(1) : '0.0'}%`,
  };
  console.table([totales]);

  const sumaPartes =
    a.totalDeserciones + a.totalCaidasCapacitacion + a.totalAprobados + a.totalEnCapacitacion;
  const coincide = sumaPartes === a.totalIngresos;

  console.log('\n4) ECUACIONES');
  console.log(
    `INGRESOS = APROBADOS + CAÍDAS_CAPACITACION + DESERCIONES + EN_CAPACITACIÓN → ` +
      `${a.totalAprobados} + ${a.totalCaidasCapacitacion} + ${a.totalDeserciones} + ${a.totalEnCapacitacion} = ${sumaPartes} vs ${a.totalIngresos} → ` +
      (coincide ? 'OK ✔' : `NO COINCIDE ✘ (diferencia ${a.totalIngresos - sumaPartes})`),
  );
  console.log(
    `TASA_DESERCION = DESERCIONES / INGRESOS × 100 → ${a.totalDeserciones} / ${a.totalIngresos} × 100 = ${totales.TASA_DESERCION}`,
  );
  console.log(
    `TASA_BAJA = CAÍDAS_CAPACITACIÓN / INGRESOS × 100 → ` +
      `${a.totalCaidasCapacitacion} / ${a.totalIngresos} × 100 = ${totales.TASA_BAJA}`,
  );
  console.log(
    `TASA_TOTAL = (DESERCIONES + CAÍDAS_CAPACITACIÓN) / INGRESOS × 100 → ` +
      `(${a.totalDeserciones} + ${a.totalCaidasCapacitacion}) / ${a.totalIngresos} × 100 = ${totales.TASA_TOTAL}`,
  );
  console.log(
    `PERMANENCIA = (APROBADOS + EN_CAPACITACIÓN) / INGRESOS × 100 → ` +
      `${a.totalAprobados} + ${a.totalEnCapacitacion} / ${a.totalIngresos} × 100 = ${totales.PERMANENCIA}`,
  );
  if (a.registrosSinResponsable > 0) {
    console.warn(
      `${a.registrosSinResponsable} registro(s) sin RESPONSABLE A&S quedan fuera de la matriz.`,
    );
  }

  console.groupEnd();
}

function registrosCon(cantidad: number, regla: string) {
  return { REGISTROS: cantidad, REGLA: regla };
}
