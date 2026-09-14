import { parseWorkbookBuffer } from './parseWorkbook';
import { progressMessage, type ExcelWorkerRequest, type ProgressPayload } from './progress';

const ctx = self as unknown as Worker;

ctx.addEventListener('message', (event: MessageEvent<ExcelWorkerRequest>) => {
  const message = event.data;
  if (!message || message.type !== 'process') return;
  void (async () => {
    try {
      const result = await parseWorkbookBuffer(message.buffer, (payload) => {
        const progress: ProgressPayload = { ...payload };
        ctx.postMessage({
          type: 'progress',
          ...progress,
          message: progressMessage(progress),
        });
      });
      ctx.postMessage({ type: 'result', ...result });
    } catch (error) {
      console.error('[reader.worker] error inesperado:', error);
      ctx.postMessage({
        type: 'error',
        message: 'Ocurrió un error inesperado al procesar el archivo. Verifica el contenido y vuelve a intentarlo.',
      });
    }
  })();
});