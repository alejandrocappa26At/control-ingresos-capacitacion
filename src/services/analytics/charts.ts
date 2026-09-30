import type { CapacitadorSummary, Promotor, SerieItem } from '@/types';
import { countBy } from './kpis';
import { normalizeKey, esCapacitadorGenerico } from '@/lib/utils';
import { esAprobado, esBajaCapacitacion, esDesercion, esEnCapacitacion } from './desercionBase';

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
  /**
   * Residual de la partición por capacitador: `desercion + inicianCapacitacion
   * + sinClasificar - asignados`. Siempre 0 mientras el Excel esté completo;
   * sirve para detectar registros "faltantes" en la fuente.
   */
  diferenciaTotal: number;
  /** Capacitadores cuya partición interna no cuadra. */
  desbalances: Array<{ capacitador: string; diferencia: number }>;
}

/**
 * Agrupa por capacitador replicando las reglas de `desercionBase`, de modo que
 * la suma de las ramas por capacitador siempre cierra contra el total:
 *
 *   INICIAN = APROBADOS + BAJAS + EN CAPACITACIÓN
 *   TOTAL   = DESERCIÓN + INICIAN + SIN CLASIFICAR
 */
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
      inicianCapacitacion: 0,
      aprobados: 0,
      bajasCapacitacion: 0,
      enCapacitacion: 0,
      desercion: 0,
      sinClasificar: 0,
      finalizados: 0,
    };
    entry.asignados += 1;
    if (esAprobado(r)) {
      entry.inicianCapacitacion += 1;
      entry.aprobados += 1;
      entry.finalizados += 1;
    } else if (esBajaCapacitacion(r)) {
      entry.inicianCapacitacion += 1;
      entry.bajasCapacitacion += 1;
      entry.finalizados += 1;
    } else if (esEnCapacitacion(r)) {
      entry.inicianCapacitacion += 1;
      entry.enCapacitacion += 1;
    } else if (esDesercion(r)) {
      entry.desercion += 1;
    } else {
      entry.sinClasificar += 1;
    }
    map.set(key, entry);
  }

  const capacitadores = Array.from(map.values()).sort((a, b) => b.asignados - a.asignados);

  const desbalances: Array<{ capacitador: string; diferencia: number }> = [];
  let diferenciaTotal = 0;
  for (const c of capacitadores) {
    const dif = c.asignados - (c.desercion + c.inicianCapacitacion + c.sinClasificar);
    const difRamas = c.inicianCapacitacion - (c.aprobados + c.bajasCapacitacion + c.enCapacitacion);
    if (dif !== 0 || difRamas !== 0) {
      desbalances.push({ capacitador: c.capacitador, diferencia: dif + difRamas });
      diferenciaTotal += dif + difRamas;
    }
  }

  return {
    capacitadores,
    capacitadoresReales: map.size,
    registrosExcluidos,
    diferenciaTotal,
    desbalances,
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