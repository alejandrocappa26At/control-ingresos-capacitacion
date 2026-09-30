import { useEffect, useMemo, useState } from 'react';
import { useDataStore, selectFilteredRecords } from '@/store/useDataStore';
import { computeKpis } from '@/services/analytics/kpis';
import { ingresosPorJurisdiccion, ingresosPorZonaComercial, ingresosPorSede, analizarCapacitadores, ingresosPorMes, ingresosMensualesPorJurisdiccion } from '@/services/analytics/charts';
import { computeEmbudo, rankingPorMotivo, rankingPorSubMotivo } from '@/services/analytics/falls';

export function useAppData() {
  const records = useDataStore((s) => s.records);
  const filters = useDataStore((s) => s.filters);
  const searchTerm = useDataStore((s) => s.searchTerm);
  const [prevRecords, setPrevRecords] = useState(records);
  const isNewLoad = prevRecords !== records;

  useEffect(() => {
    if (prevRecords === records) return;
    const id = requestAnimationFrame(() => setPrevRecords(records));
    return () => cancelAnimationFrame(id);
  }, [prevRecords, records]);

  return useMemo(() => {
    const shouldMeasure = isNewLoad && records.length > 0;
    if (shouldMeasure) console.time('Filtros');

    const filtered = selectFilteredRecords({ records, filters, searchTerm });

    if (shouldMeasure) {
      console.timeEnd('Filtros');
      console.time('Gráficos');
    }

    const kpis = computeKpis(filtered);
    const embudo = computeEmbudo(filtered);
    const jurisdiccion = ingresosPorJurisdiccion(filtered);
    const zonas = ingresosPorZonaComercial(filtered);
    const sedes = ingresosPorSede(filtered, 12);
    const { capacitadores, capacitadoresReales, registrosExcluidos, diferenciaTotal, desbalances } =
      analizarCapacitadores(filtered);
    const motivosCaida = rankingPorMotivo(filtered);
    const subMotivosCaida = rankingPorSubMotivo(filtered);
    const porMes = ingresosPorMes(filtered);
    const ingresosPorMesJurisdiccion = ingresosMensualesPorJurisdiccion(filtered);

    if (shouldMeasure) console.timeEnd('Gráficos');

    return {
      records,
      filtered,
      kpis,
      jurisdiccion,
      zonas,
      sedes,
      capacitadores,
      capacitadoresReales,
      registrosExcluidos,
      diferenciaTotal,
      desbalances,
      embudo,
      motivosCaida,
      subMotivosCaida,
      porMes,
      ingresosPorMesJurisdiccion,
      filters,
      searchTerm,
    };
  }, [records, filters, searchTerm, isNewLoad]);
}
