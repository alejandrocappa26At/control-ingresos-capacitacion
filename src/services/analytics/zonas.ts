import type { Promotor } from '@/types';
import { normalizeKey } from '@/lib/utils';
import { nivelDesercion, type NivelDesercion } from './reclutadores';

export const ZONA_SEMAFORO_RANGOS = [
  { nivel: 'excelente' as const, emoji: '🟢', label: 'Excelente', max: 3 },
  { nivel: 'bueno' as const, emoji: '🟡', label: 'Aceptable', max: 6 },
  { nivel: 'riesgo' as const, emoji: '🟠', label: 'Riesgo', max: 9 },
  { nivel: 'critico' as const, emoji: '🔴', label: 'Crítico', max: Infinity },
];

export interface ZonaDesercion {
  zona: string;
  ingresos: number;
  deserciones: number;
  tasaDesercion: number;
  pctDelTotal: number;
  nivel: NivelDesercion;
}

export interface ZonasAnalisis {
  totalZonas: number;
  totalIngresos: number;
  totalDeserciones: number;
  registrosSinZona: number;
  zonaCritica: ZonaDesercion | null;
  porCantidad: ZonaDesercion[];
  porTasa: ZonaDesercion[];
}

export function esDesercionZona(r: Promotor): boolean {
  return r.pasaAOperaciones === 0 && r.totalDias === 0;
}

export function analizarZonas(records: Promotor[]): ZonasAnalisis {
  const map = new Map<string, ZonaDesercion>();
  let registrosSinZona = 0;

  for (const r of records) {
    const key = normalizeKey(r.zonaComercial);
    if (!key || key === '—') {
      registrosSinZona += 1;
      continue;
    }
    let entry = map.get(key);
    if (!entry) {
      entry = {
        zona: key,
        ingresos: 0,
        deserciones: 0,
        tasaDesercion: 0,
        pctDelTotal: 0,
        nivel: 'excelente',
      };
      map.set(key, entry);
    }
    entry.ingresos += 1;
    if (esDesercionZona(r)) entry.deserciones += 1;
  }

  const list = Array.from(map.values());
  const totalIngresos = list.reduce((s, e) => s + e.ingresos, 0);
  const totalDeserciones = list.reduce((s, e) => s + e.deserciones, 0);

  for (const e of list) {
    e.tasaDesercion = e.ingresos > 0 ? (e.deserciones / e.ingresos) * 100 : 0;
    e.pctDelTotal = totalDeserciones > 0 ? (e.deserciones / totalDeserciones) * 100 : 0;
    e.nivel = nivelDesercion(e.tasaDesercion);
  }

  const porCantidad = [...list].sort(
    (a, b) => b.deserciones - a.deserciones || a.zona.localeCompare(b.zona),
  );
  const porTasa = [...list].sort(
    (a, b) => b.tasaDesercion - a.tasaDesercion || b.deserciones - a.deserciones,
  );

  return {
    totalZonas: list.length,
    totalIngresos,
    totalDeserciones,
    registrosSinZona,
    zonaCritica: porCantidad[0] ?? null,
    porCantidad,
    porTasa,
  };
}