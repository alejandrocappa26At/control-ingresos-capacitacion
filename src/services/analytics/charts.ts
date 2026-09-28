import type { CapacitadorSummary, Promotor, SerieItem } from '@/types';
import { countBy } from './kpis';
import { normalizeKey, esCapacitadorGenerico } from '@/lib/utils';
import { esDesercion, esBajaCapacitacion } from './desercionBase';

function toSerie(items: Array<{ name: string; value: number }>, total: number): SerieItem[] {
  return items.map(({ name, value }) => ({
    name,
    value,
    porcentaje: total > 0 ? (value / total) * 100 : 0,
  }));
}

export function ingresosPorJurisdiccion(records: Promotor[]): SerieItem[] {
  const items = countBy(records, (r) => r.jurisdiccion);
  return toSerie(items, records.length);
}

export function ingresosPorZonaComercial(records: Promotor[]): SerieItem[] {
  const items = countBy(records, (r) => normalizeKey(r.zonaComercial));
  return toSerie(items, records.length).slice(0, 15);
}

export function ingresosPorSede(records: Promotor[], limit = 10): SerieItem[] {
  const items = countBy(records, (r) => r.sede);
  return toSerie(items, records.length).slice(0, limit);
}

export interface CapacitadoresResumen {
  capacitadores: CapacitadorSummary[];
  capacitadoresReales: number;
  registrosExcluidos: number;
}

export function analizarCapacitadores(records: Promotor[]): CapacitadoresResumen {
  const map = new Map<string, CapacitadorSummary>();
  let registrosExcluidos = 0;
  for (const r of records) {
    const key = normalizeKey(r.capacitador);
    if (esCapacitadorGenerico(key)) {
      registrosExcluidos += 1;
      continue;
    }
    const entry = map.get(key) ?? {
      capacitador: key,
      asignados: 0,
      finalizados: 0,
      enProceso: 0,
      aprobados: 0,
      desercion: 0,
      bajasCapacitacion: 0,
    };
    entry.asignados += 1;
    if (r.pasaAOperaciones === 1) {
      entry.finalizados += 1;
      entry.aprobados += 1;
    } else if (esDesercion(r)) {
      entry.finalizados += 1;
      entry.desercion += 1;
    } else if (esBajaCapacitacion(r)) {
      entry.finalizados += 1;
      entry.bajasCapacitacion += 1;
    } else {
      entry.enProceso += 1;
    }
    map.set(key, entry);
  }
  return {
    capacitadores: Array.from(map.values()).sort((a, b) => b.asignados - a.asignados),
    capacitadoresReales: map.size,
    registrosExcluidos,
  };
}

export function cargaPorCapacitador(records: Promotor[]): CapacitadorSummary[] {
  return analizarCapacitadores(records).capacitadores;
}

export function ingresosPorMes(records: Promotor[]): SerieItem[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const iso = r.fechasISO.fechaIngreso;
    if (!iso) continue;
    const mes = iso.slice(0, 7);
    map.set(mes, (map.get(mes) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, porcentaje: 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface IngresoMensual {
  mes: number;
  lima: number;
  provincia: number;
  total: number;
}

/**
 * Serie mensual fija de enero a diciembre, siempre 12 registros (con 0 en los
 * meses sin datos), separada por jurisdicción. La suma lima + provincia
 * coincide con los KPIs porque replica el mismo criterio de `computeKpis`
 * (LIMA explícito, el resto cuenta como Provincia).
 */
export function ingresosMensualesPorJurisdiccion(records: Promotor[]): IngresoMensual[] {
  const lima = Array.from({ length: 12 }, () => 0);
  const provincia = Array.from({ length: 12 }, () => 0);

  for (const r of records) {
    const iso = r.fechasISO.fechaIngreso;
    if (!iso) continue;
    const idx = Number(iso.slice(5, 7)) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx > 11) continue;
    if (r.jurisdiccion === 'LIMA') lima[idx] += 1;
    else provincia[idx] += 1;
  }

  return lima.map((value, i) => ({
    mes: i + 1,
    lima: value,
    provincia: provincia[i],
    total: value + provincia[i],
  }));
}