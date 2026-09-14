import type { Kpis, Promotor } from '@/types';

export function computeKpis(records: Promotor[]): Kpis {
  const totalIngresos = records.length;
  const lima = records.filter((r) => r.jurisdiccion === 'LIMA').length;
  const provincia = records.filter((r) => r.jurisdiccion === 'PROVINCIA').length;

  const pasanAOperaciones = records.filter((r) => r.pasaAOperaciones === 1).length;
  const noPasanAOperaciones = records.filter((r) => r.pasaAOperaciones === 0).length;
  const enCapacitacion = records.filter((r) => r.pasaAOperaciones !== 1 && r.pasaAOperaciones !== 0).length;

  const procesosFinalizados = pasanAOperaciones + noPasanAOperaciones;

  const porcentajeAprobacion = procesosFinalizados > 0
    ? (pasanAOperaciones / procesosFinalizados) * 100
    : 0;

  const porcentajeCaida = procesosFinalizados > 0
    ? (noPasanAOperaciones / procesosFinalizados) * 100
    : 0;

  console.log('[KPI] Total registros:', totalIngresos);
  console.log('[KPI] Total aprobados:', pasanAOperaciones);
  console.log('[KPI] Total no aprobados:', noPasanAOperaciones);
  console.log('[KPI] Total en capacitación:', enCapacitacion);
  console.log('[KPI] Lima:', lima);
  console.log('[KPI] Provincia:', provincia);

  const suma = pasanAOperaciones + noPasanAOperaciones + enCapacitacion;
  if (suma !== totalIngresos) {
    console.error(
      `[KPI] ERROR DE INTEGRIDAD DE DATOS: aprobados (${pasanAOperaciones}) + no aprobados (${noPasanAOperaciones}) + en capacitación (${enCapacitacion}) = ${suma} ≠ total registros (${totalIngresos})`,
    );
  } else {
    console.log(
      `[KPI] Validación OK: aprobados + no aprobados + en capacitación = ${suma} = total (${totalIngresos})`,
    );
  }

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