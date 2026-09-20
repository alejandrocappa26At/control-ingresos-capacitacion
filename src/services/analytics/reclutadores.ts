import type { Promotor } from '@/types';
import { normalizeKey } from '@/lib/utils';

export type NivelDesercion = 'excelente' | 'bueno' | 'riesgo' | 'critico';

export const RANGOS_SEMAFORO = [
  { nivel: 'excelente' as const, emoji: '🟢', label: 'Excelente', max: 3 },
  { nivel: 'bueno' as const, emoji: '🟡', label: 'Bueno', max: 6 },
  { nivel: 'riesgo' as const, emoji: '🟠', label: 'Riesgo', max: 9 },
  { nivel: 'critico' as const, emoji: '🔴', label: 'Crítico', max: Infinity },
];

export const SEMAFORO_STYLES: Record<NivelDesercion, { emoji: string; label: string; color: string; dim: string }> = {
  excelente: { emoji: '🟢', label: 'Excelente', color: '#22c55e', dim: 'rgba(34,197,94,0.9)' },
  bueno: { emoji: '🟡', label: 'Bueno', color: '#eab308', dim: 'rgba(234,179,8,0.9)' },
  riesgo: { emoji: '🟠', label: 'Riesgo', color: '#f97316', dim: 'rgba(249,115,22,0.9)' },
  critico: { emoji: '🔴', label: 'Crítico', color: '#dc2626', dim: 'rgba(220,38,38,0.9)' },
};

export function nivelDesercion(tasa: number): NivelDesercion {
  if (tasa < 3) return 'excelente';
  if (tasa < 6) return 'bueno';
  if (tasa < 9) return 'riesgo';
  return 'critico';
}

export interface ResumenReclutador {
  responsable: string;
  ingresos: number;
  deserciones: number;
  bajas: number;
  pasanOperaciones: number;
  pendientes: number;
  procesosFinalizados: number;
  tasaDesercion: number;
  tasaPermanencia: number;
  pctDelTotal: number;
  pctDeserciones: number;
  nivel: NivelDesercion;
}

export interface ReclutadoresAnalisis {
  totalReclutadores: number;
  totalIngresos: number;
  totalDeserciones: number;
  totalBajas: number;
  totalPasanOperaciones: number;
  registrosSinResponsable: number;
  productividad: ResumenReclutador[];
  desercion: ResumenReclutador[];
}

export function esDesercion(r: Promotor): boolean {
  return r.pasaAOperaciones === 0 && r.totalDias === 0;
}

export function analizarReclutadores(records: Promotor[]): ReclutadoresAnalisis {
  const map = new Map<string, ResumenReclutador>();
  let registrosSinResponsable = 0;

  for (const r of records) {
    const key = normalizeKey(r.responsableAS);
    if (!key || key === '—') {
      registrosSinResponsable += 1;
      continue;
    }
    let entry = map.get(key);
    if (!entry) {
      entry = {
        responsable: key,
        ingresos: 0,
        deserciones: 0,
        bajas: 0,
        pasanOperaciones: 0,
        pendientes: 0,
        procesosFinalizados: 0,
        tasaDesercion: 0,
        tasaPermanencia: 0,
        pctDelTotal: 0,
        pctDeserciones: 0,
        nivel: 'excelente',
      };
      map.set(key, entry);
    }
    entry.ingresos += 1;
    if (r.pasaAOperaciones === 1) {
      entry.pasanOperaciones += 1;
    } else if (r.pasaAOperaciones === 0) {
      if (r.totalDias != null && r.totalDias >= 1) entry.bajas += 1;
      else entry.deserciones += 1;
    } else {
      entry.pendientes += 1;
    }
  }

  const list = Array.from(map.values());
  const totalIngresos = list.reduce((s, e) => s + e.ingresos, 0);
  const totalDeserciones = list.reduce((s, e) => s + e.deserciones, 0);

  for (const e of list) {
    e.procesosFinalizados = e.pasanOperaciones + e.bajas + e.deserciones;
    e.tasaDesercion = e.ingresos > 0 ? (e.deserciones / e.ingresos) * 100 : 0;
    e.tasaPermanencia = e.procesosFinalizados > 0 ? (e.pasanOperaciones / e.procesosFinalizados) * 100 : 0;
    e.pctDelTotal = totalIngresos > 0 ? (e.ingresos / totalIngresos) * 100 : 0;
    e.pctDeserciones = totalDeserciones > 0 ? (e.deserciones / totalDeserciones) * 100 : 0;
    e.nivel = nivelDesercion(e.tasaDesercion);
  }

  const productividad = [...list].sort((a, b) => b.ingresos - a.ingresos);
  const desercion = [...list].sort(
    (a, b) => b.tasaDesercion - a.tasaDesercion || b.deserciones - a.deserciones,
  );

  return {
    totalReclutadores: list.length,
    totalIngresos,
    totalDeserciones,
    totalBajas: list.reduce((s, e) => s + e.bajas, 0),
    totalPasanOperaciones: list.reduce((s, e) => s + e.pasanOperaciones, 0),
    registrosSinResponsable,
    productividad,
    desercion,
  };
}