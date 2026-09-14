'use client';

import type { ParseResult } from '@/types';
import { isValidFileType, parseWorkbookBuffer } from '@/services/excel/parseWorkbook';
import type { ExcelWorkerRequest, ExcelWorkerResponse, ProgressPayload } from './progress';

export { ALLOWED_EXTENSIONS, isValidFileType, type XlsxModule } from '@/services/excel/parseWorkbook';

export async function loadXlsxModule(): Promise<typeof import('xlsx')> {
  return import('xlsx');
}

export async function readExcelFile(
  file: File,
  onProgress?: (payload: ProgressPayload) => void,
): Promise<ParseResult> {
  console.info('[readExcelFile] inicio de procesamiento:', file.name, `${(file.size / 1024).toFixed(0)} KB`);

  if (!isValidFileType(file.name)) {
    return {
      success: false,
      records: [],
      errors: [
        {
          type: 'column',
          message: 'No se puede procesar el archivo. Solo se permiten archivos .xls o .xlsx',
        },
      ],
    };
  }

  const target = typeof window !== 'undefined' ? window : null;

  if (target && typeof target.Worker === 'function') {
    const workerResult = await runWithWorker(file, onProgress);
    if (workerResult.used && workerResult.result) return workerResult.result;
  }

  const buffer = await file.arrayBuffer();
  return parseWorkbookBuffer(buffer, (payload) => onProgress?.(payload), true);
}

async function runWithWorker(
  file: File,
  onProgress?: (payload: ProgressPayload) => void,
): Promise<{ used: boolean; result?: ParseResult }> {
  let worker: Worker;
  try {
    worker = new Worker(new URL('./reader.worker.ts', import.meta.url), { type: 'module' });
  } catch (error) {
    console.warn('[readExcelFile] no se pudo crear Web Worker, uso el hilo principal:', error);
    return { used: false };
  }

  return new Promise<{ used: boolean; result?: ParseResult }>((resolve) => {
    let responded = false;
    const timeout = setTimeout(() => {
      if (responded) return;
      responded = true;
      console.warn('[readExcelFile] Web Worker tardó demasiado en responder, uso el hilo principal.');
      worker.terminate();
      resolve({ used: false });
    }, 5000);

    worker.addEventListener('message', (event: MessageEvent<ExcelWorkerResponse>) => {
      const message = event.data;
      if (!message) return;
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
      }

      if (message.type === 'progress') {
        onProgress?.({
          stage: message.stage,
          percent: message.percent,
          recordsProcessed: message.recordsProcessed,
          totalRecords: message.totalRecords,
        });
        return;
      }

      if (message.type === 'result') {
        worker.terminate();
        resolve({ used: true, result: message });
        return;
      }

      if (message.type === 'error') {
        worker.terminate();
        console.error('[readExcelFile] error desde el worker:', message.message);
        resolve({
          used: true,
          result: {
            success: false,
            records: [],
            errors: [{ type: 'sheet', message: message.message }],
          },
        });
      }
    });

    worker.addEventListener('error', (error) => {
      worker.terminate();
      console.error('[readExcelFile] error del Web Worker:', error.message ?? error);
      resolve({ used: false });
    });

    void file.arrayBuffer().then((buffer) => {
      worker.postMessage({ type: 'process', buffer, fileName: file.name } as ExcelWorkerRequest, [buffer]);
    });
  });
}