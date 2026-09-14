import type { ParseResult } from '@/types';
import { formatNumber } from '@/lib/utils';

export const EXCEL_CHUNK_SIZE = 1000;

export type ExcelStage = 'leer' | 'hojas' | 'columnas' | 'registros' | 'kpis' | 'fin';

export interface ProgressPayload {
  stage: ExcelStage;
  percent: number;
  recordsProcessed: number;
  totalRecords: number;
}

export interface ExcelProgress extends ProgressPayload {
  elapsedMs: number;
}

export function progressMessage(pick: { stage: ExcelStage; recordsProcessed: number; totalRecords: number }): string {
  switch (pick.stage) {
    case 'leer':
      return 'Leyendo archivo...';
    case 'hojas':
      return 'Validando hojas...';
    case 'columnas':
      return 'Validando columnas...';
    case 'registros':
      return pick.recordsProcessed > 0
        ? `Procesando ${formatNumber(pick.recordsProcessed)} registros...`
        : 'Procesando registros...';
    case 'kpis':
      return 'Calculando KPIs...';
    case 'fin':
      return pick.totalRecords > 0
        ? `Finalizado. ${formatNumber(pick.totalRecords)} registros procesados.`
        : 'Finalizado.';
  }
}

export function formatElapsed(ms: number): string {
  if (!isFinite(ms)) return '';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return seconds < 10 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest > 0 ? `${minutes} min ${rest} s` : `${minutes} min`;
}

export type ExcelWorkerRequest = { type: 'process'; buffer: ArrayBuffer; fileName: string };

export type ExcelWorkerResponse =
  | ({ type: 'progress' } & ProgressPayload & { message: string })
  | ({ type: 'result' } & ParseResult)
  | { type: 'error'; message: string };