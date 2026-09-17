import type { Kpis, Promotor } from '@/types';

export function computeKpis(records: Promotor[]): Kpis {
  const totalIngresos = records.length;

  let lima = 0;
  let pasanAOperaciones = 0;
  let noPasanAOperaciones = 0;

  for (const r of records) {
    if (r.jurisdiccion === 'LIMA') lima += 1;
    if (r.pasaAOperaciones === 1) pasanAOperaciones += 1;
    else if (r.pasaAOperaciones === 0) noPasanAOperaciones += 1;
  }

  const provincia = totalIngresos - lima;
  const enCapacitacion = totalIngresos - pasanAOperaciones - noPasanAOperaciones;
  const procesosFinalizados = pasanAOperaciones + noPasanAOperaciones;

  const porcentajeAprobacion = procesosFinalizados > 0
    ? (pasanAOperaciones / procesosFinalizados) * 100
    : 0;

  const porcentajeCaida = procesosFinalizados > 0
    ? (noPasanAOperaciones / procesosFinalizados) * 100
    : 0;

  return {
    totalIngresos,
    lima,
    provincia,
    enCapacitacion,
    capacitacionFinalizada: procesosFinalizados,
    pasanAOperaciones,
    noPasanAOperaciones,
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