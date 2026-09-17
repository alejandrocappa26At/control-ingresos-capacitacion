'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, FileDown, SearchX, Loader2, Clock3, Database } from 'lucide-react';
import { readExcelFile } from '@/services/excel/reader';
import { generarPlantilla } from '@/services/excel/template';
import { useDataStore } from '@/store/useDataStore';
import { useAppData } from '@/hooks/useAppData';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ExcelProgress, ExcelStage } from '@/services/excel/progress';
import { formatElapsed } from '@/services/excel/progress';

export function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<ExcelProgress | null>(null);
  const isProcessing = useDataStore((s) => s.isProcessing);
  const setIsProcessing = useDataStore((s) => s.setIsProcessing);
  const setRecords = useDataStore((s) => s.setRecords);
  const setLoadStartedAt = useDataStore((s) => s.setLoadStartedAt);
  const uploadMeta = useDataStore((s) => s.uploadMeta);
  const { filtered } = useAppData();

  const processFile = useCallback(
    async (file: File) => {
      if (isProcessing) return;
      setIsProcessing(true);
      const inicio = Date.now();
      startedAtRef.current = inicio;
      setLoadStartedAt(inicio);
      console.time('[AUDITORIA] Carga Total');
      setProgress(null);
      console.info('[Dropzone] INICIO REAL:', new Date(inicio).toISOString());

      try {
        const result = await readExcelFile(file, (payload) => {
          setProgress({
            ...payload,
            elapsedMs: Date.now() - inicio,
          });
        });
        console.timeEnd('[AUDITORIA] Carga Total');
        console.info(
          `[Dropzone] FIN XLSX: ${Date.now() - inicio} ms desde el inicio (lectura + procesamiento del archivo completados)`,
        );

        if (!result.success) {
          console.warn('[Dropzone] archivo rechazado:', result.errors);
          for (const error of result.errors) {
            toast.error(error.message);
          }
          return;
        }

        if (result.records.length === 0) {
          toast.error('El archivo fue validado correctamente, pero no contiene registros.');
          return;
        }

        setRecords(result.records, {
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          totalRegistros: result.meta?.totalRegistros ?? result.records.length,
          totalLima: result.meta?.totalLima ?? 0,
          totalProvincia: result.meta?.totalProvincia ?? 0,
          fileSizeBytes: file.size,
        });

        const limaCount = result.records.filter((r) => r.jurisdiccion === 'LIMA').length;
        console.info(
          `[Dropzone] FIN PROCESAMIENTO: ${Date.now() - inicio} ms (registros en el store, renderizado disparado)`,
        );
        console.info(`[Dropzone] éxito: ${result.records.length} registros (Lima ${limaCount} | Provincia ${result.records.length - limaCount})`);
        toast.success(
          `Procesamiento exitoso: ${result.records.length} registros cargados (Lima: ${limaCount} | Provincia: ${result.records.length - limaCount})`,
        );
      } catch (error) {
        console.error('[Dropzone] error durante el procesamiento:', error);
        const name = error instanceof Error ? error.name : '';
        if (/ChunkLoadError/i.test(name)) {
          toast.error('No se pudo cargar el motor de Excel. Recarga la página e intenta de nuevo.', {
            action: {
              label: 'Recargar',
              onClick: () => window.location.reload(),
            },
          });
        } else {
          toast.error('Ocurrió un error inesperado al procesar el archivo.');
        }
      } finally {
        console.info(`[Dropzone] FIN REAL: ${Date.now() - inicio} ms (isProcessing=false)`);
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [isProcessing, setIsProcessing, setRecords, setLoadStartedAt],
  );

  useEffect(() => {
    if (!isProcessing || !startedAtRef.current) return;
    const id = window.setInterval(() => {
      setProgress((p) => (p ? { ...p, elapsedMs: Date.now() - startedAtRef.current } : p));
    }, 50);
    return () => window.clearInterval(id);
  }, [isProcessing]);

  const descargarPlantilla = useCallback(() => {
    generarPlantilla().catch((error: unknown) => {
      console.error('[Dropzone] no se pudo generar la plantilla:', error);
      const name = error instanceof Error ? error.name : '';
      if (/ChunkLoadError/i.test(name)) {
        toast.error('No se pudo cargar el motor de Excel. Recarga la página e intenta de nuevo.', {
          action: {
            label: 'Recargar',
            onClick: () => window.location.reload(),
          },
        });
      } else {
        toast.error('No se pudo generar la plantilla. Inténtalo de nuevo.');
      }
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      e.target.value = '';
    },
    [processFile],
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed bg-surface-2/80 p-10 text-center shadow-card backdrop-blur transition-all duration-300 sm:p-14',
          dragOver
            ? 'scale-[1.02] border-brand-400 bg-brand-500/5 shadow-glow'
            : 'border-line-2 hover:border-brand-300 hover:shadow-glow-sm',
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={onSelect}
        />
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl gradient-brand text-white shadow-glow">
          <UploadCloud className="size-9" />
        </div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-ink">CARGAR EXCEL DE CAPACITACIÓN</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Arrastra y suelta tu archivo aquí, o haz clic para seleccionarlo.
          <br />
          Formatos permitidos: <span className="font-semibold text-ink">.xls</span> y{' '}
          <span className="font-semibold text-ink">.xlsx</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted">
            Requiere hojas: CAPACITACIÓN LIMA y CAPACITACIÓN PROVINCIA
          </span>
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted">
            Validación automática de columnas
          </span>
        </div>

        {isProcessing && (
          <div className="mt-6">
            {progress ? (
              <>
                <Progress value={progress.percent} className="mt-4" />
                <div className="mt-3 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Loader2 className="size-4 animate-spin text-brand-500" />
                    {progress.stage === 'registros'
                      ? `Procesando ${progress.recordsProcessed.toLocaleString('es-PE')} registros...`
                      : progressLabelForStage(progress.stage)}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-ink-soft">
                    <span>{Math.round(progress.percent)}%</span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-3" />
                      {formatElapsed(progress.elapsedMs)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="size-3" />
                      {progress.recordsProcessed.toLocaleString('es-PE')} registros
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-ink">
                <Loader2 className="size-4 animate-spin text-brand-500" />
                Procesando...
              </div>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            descargarPlantilla();
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand-300/50 bg-brand-500/8 px-4 py-2.5 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-500/15"
        >
          <FileDown className="size-4" />
          Descargar plantilla de ejemplo
        </button>
      </motion.div>

      {uploadMeta && !isProcessing && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 shadow-card transition-all duration-300 hover:shadow-glow-emerald">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Archivo procesado correctamente
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {uploadMeta.totalRegistros.toLocaleString('es-PE')} registros procesados · Ahora puedes filtrar, buscar y
                analizar los datos desde el Dashboard y las demás secciones.
              </p>
              {filtered.length === 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <SearchX className="size-4" />
                  Los filtros activos actualmente no muestran registros. Limpia los filtros para ver toda la información.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function progressLabelForStage(stage: ExcelStage): string {
  switch (stage) {
    case 'leer':
      return 'Leyendo archivo...';
    case 'hojas':
      return 'Validando hojas...';
    case 'columnas':
      return 'Validando columnas...';
    case 'registros':
      return 'Procesando registros...';
    case 'kpis':
      return 'Calculando KPIs...';
    case 'fin':
      return 'Finalizado.';
  }
}