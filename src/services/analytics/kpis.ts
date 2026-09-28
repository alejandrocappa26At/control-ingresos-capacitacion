import type { Kpis, Promotor } from '@/types';
import {
  diagnosticoClasificacion,
  esAprobado,
  esBajaCapacitacion,
  esCapacitacionFinalizada,
  esDesercion,
  esEnCapacitacion,
  esSinClasificar,
  iniciaCapacitacion,
} from './desercionBase';

export function computeKpis(records: Promotor[]): Kpis {
  const totalIngresos = records.length;

  let lima = 0;
  let inicianCapacitacion = 0;
  let desercion = 0;
  let enCapacitacion = 0;
  let capacitacionFinalizada = 0;
  let pasanAOperaciones = 0;
  let bajasCapacitacion = 0;
  let sinClasificar = 0;

  for (const r of records) {
    if (r.jurisdiccion === 'LIMA') lima += 1;

    // INICIAN CAPACITACIÓN: TOTAL DE DÍAS >= 1
    if (iniciaCapacitacion(r)) inicianCapacitacion += 1;
    if (esCapacitacionFinalizada(r)) capacitacionFinalizada += 1;
    if (esAprobado(r)) pasanAOperaciones += 1;
    else if (esBajaCapacitacion(r)) bajasCapacitacion += 1;
    else if (esEnCapacitacion(r)) enCapacitacion += 1;
    else if (esDesercion(r)) desercion += 1;
    else if (esSinClasificar(r)) sinClasificar += 1;
  }

  const provincia = totalIngresos - lima;

  // % Aprobación = APROBADOS / INICIAN CAPACITACIÓN x 100
  const porcentajeAprobacion = inicianCapacitacion > 0 ? (pasanAOperaciones / inicianCapacitacion) * 100 : 0;
  const porcentajeBajas = inicianCapacitacion > 0 ? (bajasCapacitacion / inicianCapacitacion) * 100 : 0;
  const porcentajeDesercion = totalIngresos > 0 ? (desercion / totalIngresos) * 100 : 0;

  if (process.env.NODE_ENV === 'development' && sinClasificar > 0) {
    const d = diagnosticoClasificacion(records);
    console.warn(
      `[KPIs] Partición incompleta -> Total ${totalIngresos} ≠ Deserción ${desercion} + Inician ${inicianCapacitacion}` +
        ` (diferencia ${d.diferenciaTotal}). Registros con TOTAL DE DÍAS vacío: ${d.sinDias}.` +
        ' Revisar esas filas del Excel.',
    );
  }

  return {
    totalIngresos,
    lima,
    provincia,
    inicianCapacitacion,
    enCapacitacion,
    capacitacionFinalizada,
    pasanAOperaciones,
    desercion,
    bajasCapacitacion,
    sinClasificar,
    porcentajeAprobacion,
    porcentajeBajas,
    porcentajeDesercion,
    procesosFinalizados: capacitacionFinalizada,
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