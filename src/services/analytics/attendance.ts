import type { AsistenciaSummary, Promotor } from '@/types';
import { MAX_DAYS } from '@/lib/constants';

export function computeAsistencia(records: Promotor[]): AsistenciaSummary {
  const porDia = Array.from({ length: MAX_DAYS }, (_, i) => ({
    dia: i + 1,
    asistieron: 0,
    faltaron: 0,
    sinRegistro: 0,
    porcentaje: 0,
  }));

  let totalAsistidos = 0;
  let totalRegistrados = 0;

  for (const r of records) {
    r.asistencia.forEach((value, idx) => {
      if (idx >= MAX_DAYS) return;
      if (value === 1) {
        porDia[idx].asistieron += 1;
        totalAsistidos += 1;
        totalRegistrados += 1;
      } else if (value === 0) {
        porDia[idx].faltaron += 1;
        totalRegistrados += 1;
      } else {
        porDia[idx].sinRegistro += 1;
      }
    });
  }

  for (const dia of porDia) {
    const registrados = dia.asistieron + dia.faltaron;
    dia.porcentaje = registrados > 0 ? (dia.asistieron / registrados) * 100 : 0;
  }

  const promedioGeneral = totalRegistrados > 0 ? (totalAsistidos / totalRegistrados) * 100 : 0;

  return { porDia, promedioGeneral };
}

export function getAsistenciaEmoji(value: 1 | 0 | null): string {
  if (value === 1) return '🟢';
  if (value === 0) return '🔴';
  return '⚪';
}