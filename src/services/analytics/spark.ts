import type { Promotor } from '@/types';

function bucket(records: Promotor[]): Array<{ key: string; count: number }> {
  const map = new Map<string, number>();
  for (const r of records) {
    const m = (r.fechaIngreso ?? '').slice(0, 7);
    if (!m) continue;
    map.set(m, (map.get(m) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([key, count]) => ({ key, count }));
}

function limit(rows: Array<{ key: string; count: number }>, n = 6): number[] {
  return rows.slice(-n).map((r) => r.count);
}

function bucketBy(records: Promotor[], match: (r: Promotor) => boolean): number[] {
  return limit(bucket(records.filter(match)));
}

export function sparkPorMes(records: Promotor[]) {
  const ingresos = limit(bucket(records));
  const capacitacion = bucketBy(records, (r) => r.estado === 'EN_CAPACITACION' || r.resultado === 'PENDIENTE');
  const finalizada = bucketBy(records, (r) => (r.resultado === 'APROBADO' || r.resultado === 'NO_APROBADO') || r.resultado === 'PENDIENTE');
  const pasan = bucketBy(records, (r) => r.resultado === 'APROBADO');
  const caidas = bucketBy(records, (r) => r.resultado === 'NO_APROBADO');
  const aprobacion = bucketBy(records, (r) => r.resultado === 'APROBADO' || r.resultado === 'NO_APROBADO');
  return { ingresos, capacitacion, finalizada, pasan, caidas, aprobacion };
}
