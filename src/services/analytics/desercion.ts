import type { Promotor } from '@/types';
import { normalizeKey } from '@/lib/utils';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export interface ResumenMes {
  mes: string;
  cantidad: number;
  porcentaje: number;
}

export interface TendenciaMensual {
  mes: string;
  ingresos: number;
  deserciones: number;
  tasa: number;
}

export interface MesRanking {
  name: string;
  value: number;
  porcentaje: number;
  tasa: number;
}

export interface HeatmapDesercion {
  sedes: string[];
  meses: string[];
  celdas: number[][];
  totalPorSede: number[];
  totalPorMes: number[];
}

export interface DesercionAnalisis {
  totalIngresos: number;
  totalDeserciones: number;
  tasaDesercion: number;
  bajas: number;
  bajasPct: number;
  pasanOperaciones: number;
  pasanPct: number;
  mesMayor: ResumenMes | null;
  mesMenor: ResumenMes | null;
  promedioMensual: number;
  mesesSinDesercion: number;
  pctMesesSinDesercion: number;
  tendencia: TendenciaMensual[];
  porMes: MesRanking[];
  ranking: MesRanking[];
  heatmap: HeatmapDesercion;
}

export function deserciones(records: Promotor[]): Promotor[] {
  return records.filter((r) => r.totalDias === 0);
}

function mesDeIngreso(r: Promotor): number {
  const iso = r.fechasISO.fechaIngreso || '';
  const match = /^\d{4}-(\d{2})/.exec(iso);
  if (!match) return -1;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < 12 ? index : -1;
}

export function analizarDesercion(records: Promotor[]): DesercionAnalisis {
  const totalIngresos = records.length;
  const deser = deserciones(records);
  const totalDeserciones = deser.length;

  let bajas = 0;
  let pasanOperaciones = 0;
  for (const r of records) {
    if (r.pasaAOperaciones === 1) {
      pasanOperaciones += 1;
    } else if (r.pasaAOperaciones === 0 && r.totalDias != null && r.totalDias >= 1) {
      bajas += 1;
    }
  }

  const pctTotal = (n: number) => (totalIngresos > 0 ? (n / totalIngresos) * 100 : 0);

  const ingresosPorMes = new Array<number>(12).fill(0);
  const desercionesPorMes = new Array<number>(12).fill(0);

  for (const r of records) {
    const m = mesDeIngreso(r);
    if (m >= 0) ingresosPorMes[m] += 1;
  }
  for (const r of deser) {
    const m = mesDeIngreso(r);
    if (m >= 0) desercionesPorMes[m] += 1;
  }

  const tendencia: TendenciaMensual[] = MONTH_NAMES.map((name, i) => ({
    mes: name,
    ingresos: ingresosPorMes[i],
    deserciones: desercionesPorMes[i],
    tasa: ingresosPorMes[i] > 0 ? (desercionesPorMes[i] / ingresosPorMes[i]) * 100 : 0,
  }));

  const ordenados = tendencia
    .filter((t) => t.deserciones > 0)
    .sort((a, b) => b.deserciones - a.deserciones);

  const pctDelTotal = (n: number) => (totalDeserciones > 0 ? (n / totalDeserciones) * 100 : 0);

  const porMes: MesRanking[] = ordenados.map((t) => ({
    name: t.mes,
    value: t.deserciones,
    porcentaje: pctDelTotal(t.deserciones),
    tasa: t.tasa,
  }));

  const ranking = porMes.slice(0, 5);

  const mesMayor: ResumenMes | null =
    porMes.length > 0 ? { mes: porMes[0].name, cantidad: porMes[0].value, porcentaje: porMes[0].porcentaje } : null;

  const menor = porMes.length > 0 ? porMes[porMes.length - 1] : null;
  const mesMenor: ResumenMes | null = menor
    ? { mes: menor.name, cantidad: menor.value, porcentaje: menor.porcentaje }
    : null;

  const promedioMensual = totalDeserciones / 12;
  const mesesSinDesercion = 12 - ordenados.length;
  const pctMesesSinDesercion = (mesesSinDesercion / 12) * 100;

  const porSede = new Map<string, number[]>();
  for (const r of deser) {
    const m = mesDeIngreso(r);
    if (m < 0) continue;
    const sede = normalizeKey(r.sede);
    if (!sede || sede === '—') continue;
    if (!porSede.has(sede)) porSede.set(sede, new Array<number>(12).fill(0));
    porSede.get(sede)![m] += 1;
  }

  const sedes = Array.from(porSede.entries())
    .map(([sede, row]) => ({ sede, total: row.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .map((entry) => entry.sede);

  const celdas = sedes.map((sede) => porSede.get(sede)!);
  const totalPorSede = celdas.map((row) => row.reduce((a, b) => a + b, 0));
  const totalPorMes = MONTH_NAMES.map((_, i) => celdas.reduce((acc, row) => acc + (row[i] ?? 0), 0));

  return {
    totalIngresos,
    totalDeserciones,
    tasaDesercion: totalIngresos > 0 ? (totalDeserciones / totalIngresos) * 100 : 0,
    bajas,
    bajasPct: pctTotal(bajas),
    pasanOperaciones,
    pasanPct: pctTotal(pasanOperaciones),
    mesMayor,
    mesMenor,
    promedioMensual,
    mesesSinDesercion,
    pctMesesSinDesercion,
    tendencia,
    porMes,
    ranking,
    heatmap: { sedes, meses: Array.from(MONTH_NAMES), celdas, totalPorSede, totalPorMes },
  };
}