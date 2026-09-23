import type { Kpis, Promotor } from '@/types';
import { esDesercion, esBajaCapacitacion } from './desercionBase';

export function computeKpis(records: Promotor[]): Kpis {
  const totalIngresos = records.length;

  let lima = 0;
  let pasanAOperaciones = 0;
  let desercion = 0;
  let bajasCapacitacion = 0;

  for (const r of records) {
    if (r.jurisdiccion === 'LIMA') lima += 1;
    if (r.pasaAOperaciones === 1) pasanAOperaciones += 1;
    else if (esDesercion(r)) desercion += 1;
    else if (esBajaCapacitacion(r)) bajasCapacitacion += 1;
  }

  const provincia = totalIngresos - lima;
  const enCapacitacion = totalIngresos - pasanAOperaciones - desercion - bajasCapacitacion;
  const procesosFinalizados = pasanAOperaciones + desercion + bajasCapacitacion;

  const porcentajeAprobacion = procesosFinalizados > 0
    ? (pasanAOperaciones / procesosFinalizados) * 100
    : 0;

  const porcentajeCaida = procesosFinalizados > 0
    ? ((desercion + bajasCapacitacion) / procesosFinalizados) * 100
    : 0;

  return {
    totalIngresos,
    lima,
    provincia,
    enCapacitacion,
    capacitacionFinalizada: procesosFinalizados,
    pasanAOperaciones,
    desercion,
    bajasCapacitacion,
    porcentajeAprobacion,
    porcentajeCaida,
    procesosFinalizados,
  };
}

export function countBy(records: Promotor[], getter: (r: Promotor) => string): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = getter(r) || '—';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}