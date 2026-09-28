import type { Promotor } from '@/types';

/**
 * ══════════════════════════════════════════════════════════════════
 *  LÓGICA DE NEGOCIO DE LOS KPIs (fuente de verdad única)
 * ══════════════════════════════════════════════════════════════════
 *
 *  TOTAL INGRESOS
 *      Todos los registros filtrados.
 *
 *  INICIAN CAPACITACIÓN
 *      TOTAL DE DÍAS >= 1
 *
 *  DESERCIÓN  (nunca inició capacitación)
 *      TOTAL DE DÍAS = 0  Y  PASA A OPERACIONES = 0
 *
 *  EN CAPACITACIÓN  (sigue en capacitación)
 *      TOTAL DE DÍAS >= 1  Y  PASA A OPERACIONES vacío
 *
 *  CAPACITACIÓN FINALIZADA  (el proceso ya concluyó)
 *      TOTAL DE DÍAS >= 1  Y  (PASA A OPERACIONES = 1 O = 0)
 *
 *  APROBADOS
 *      TOTAL DE DÍAS >= 1  Y  PASA A OPERACIONES = 1
 *
 *  BAJAS DURANTE CAPACITACIÓN
 *      TOTAL DE DÍAS >= 1  Y  PASA A OPERACIONES = 0
 *
 *  ── VALIDACIONES ──────────────────────────────────────────────
 *  INICIAN CAPACITACIÓN = APROBADOS + BAJAS + EN CAPACITACIÓN
 *  TOTAL INGRESOS       = DESERCIÓN   + INICIAN CAPACITACIÓN
 *
 *  Las tres ramas de "INICIAN CAPACITACIÓN" son excluyentes y cubren
 *  todo `TOTAL DE DÍAS >= 1`, por lo que la primera validación siempre
 *  se cumple. La segunda se cumple siempre que no existan registros con
 *  TOTAL DE DÍAS nulo, ni con 0 días y PASA distinto de 0; esos casos
 *  se aíslan en `sinClasificar` para poder corregirlos en el origen.
 * ══════════════════════════════════════════════════════════════════
 */

/** Registró al menos un día: inició la capacitación. */
export function iniciaCapacitacion(r: Promotor): boolean {
  return r.totalDias != null && r.totalDias >= 1;
}

/** Nunca inició capacitación. */
export function esDesercion(r: Promotor): boolean {
  return r.totalDias === 0 && r.pasaAOperaciones === 0;
}

/** Inició y aprobó. */
export function esAprobado(r: Promotor): boolean {
  return iniciaCapacitacion(r) && r.pasaAOperaciones === 1;
}

/** Inició y se dio de baja antes de aprobar. */
export function esBajaCapacitacion(r: Promotor): boolean {
  return iniciaCapacitacion(r) && r.pasaAOperaciones === 0;
}

/** Inició y sigue en proceso. */
export function esEnCapacitacion(r: Promotor): boolean {
  return iniciaCapacitacion(r) && r.pasaAOperaciones == null;
}

/** Inició y el proceso ya concluyó (aprobado o baja). */
export function esCapacitacionFinalizada(r: Promotor): boolean {
  return iniciaCapacitacion(r) && (r.pasaAOperaciones === 1 || r.pasaAOperaciones === 0);
}

/** No encaja en ninguna regla: sin días registrados y no marcado como baja. */
export function esSinClasificar(r: Promotor): boolean {
  return !iniciaCapacitacion(r) && !esDesercion(r);
}

export function inicianCapacitacion(records: Promotor[]): Promotor[] {
  return records.filter(iniciaCapacitacion);
}

export function desercionesDe(records: Promotor[]): Promotor[] {
  return records.filter(esDesercion);
}

export function bajasCapacitacion(records: Promotor[]): Promotor[] {
  return records.filter(esBajaCapacitacion);
}

/** Totales de cada rama, para validar la partición sobre los datos reales. */
export function diagnosticoClasificacion(records: Promotor[]) {
  let inician = 0;
  let desercion = 0;
  let aprobados = 0;
  let bajas = 0;
  let enCapacitacion = 0;
  let sinClasificar = 0;
  let sinDias = 0;
  let sinDiasAprobados = 0;

  for (const r of records) {
    if (r.totalDias == null) sinDias += 1;
    if (r.pasaAOperaciones === 1 && !iniciaCapacitacion(r)) sinDiasAprobados += 1;
    if (esAprobado(r)) aprobados += 1;
    else if (esBajaCapacitacion(r)) bajas += 1;
    else if (esEnCapacitacion(r)) enCapacitacion += 1;
    else if (esDesercion(r)) desercion += 1;
    else sinClasificar += 1;
    if (iniciaCapacitacion(r)) inician += 1;
  }

  const sumaIniciaron = aprobados + bajas + enCapacitacion;
  const diferenciaIniciaron = inician - sumaIniciaron;
  const diferenciaTotal = records.length - (desercion + inician);

  return {
    inician,
    desercion,
    aprobados,
    bajas,
    enCapacitacion,
    sinClasificar,
    sinDias,
    sinDiasAprobados,
    validacionIniciaron: diferenciaIniciaron === 0,
    validacionTotal: diferenciaTotal === 0,
    diferenciaIniciaron,
    diferenciaTotal,
  };
}
