import type { Promotor } from '@/types';

/**
 * ══════════════════════════════════════════════════════════════════
 *  REGLA OFICIAL ÚNICA DE IDENTIFICACIÓN DE DESERCIÓN (fuente de verdad)
 * ══════════════════════════════════════════════════════════════════
 *
 *  DESERCIÓN (nunca asistió):
 *      PASA A OPERACIONES = No  Y  TOTAL DE DÍAS = 0
 *      (TOTAL DE DÍAS nulo/vacío también se considera nunca asistió,
 *       consistente con la categoría "Nunca asistió" del momento de salida).
 *
 *  BAJA DURANTE CAPACITACIÓN:
 *      PASA A OPERACIONES = No  Y  TOTAL DE DÍAS >= 1
 *
 *  APROBADOS / EN PROCESO:
 *      PASA A OPERACIONES = Sí / pendiente.
 *
 *  Todas las visualizaciones del módulo de caídas deben sumar exactamente
 *  `desercionesDe(records)`. Lo que no califique se reporta como excluido
 *  en la validación cruzada (ver `validacion.ts`).
 */
export function esDesercion(r: Promotor): boolean {
  return r.pasaAOperaciones === 0 && (r.totalDias == null || r.totalDias === 0);
}

export function esBajaCapacitacion(r: Promotor): boolean {
  return r.pasaAOperaciones === 0 && r.totalDias != null && r.totalDias >= 1;
}

export function desercionesDe(records: Promotor[]): Promotor[] {
  return records.filter(esDesercion);
}

export function bajasCapacitacion(records: Promotor[]): Promotor[] {
  return records.filter(esBajaCapacitacion);
}