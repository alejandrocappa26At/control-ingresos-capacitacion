'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, SearchX, Loader2, Clock3, Database, FileSpreadsheet } from 'lucide-react';
import { readExcelFile } from '@/services/excel/reader';
import { useDataStore } from '@/store/useDataStore';
import { useAppData } from '@/hooks/useAppData';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatISOToDisplay } from '@/lib/dates';
import type { ExcelProgress, ExcelStage } from '@/services/excel/progress';
import { formatElapsed } from '@/services/excel/progress';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);
  const dragDepthRef = useRef(0);
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
        console.info(
          `[Dropzone] éxito: ${result.records.length} registros (Lima ${limaCount} | Provincia ${result.records.length - limaCount})`,
        );
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

  const onDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragDepthRef.current = 0;
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
        transition={{ duration: 0.4, ease: EASE }}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        data-active={dragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Cargar Excel de capacitación"
        className={cn(
          'aurora-border group relative cursor-pointer rounded-3xl px-6 py-14 text-center shadow-card outline-none transition-transform duration-300 ease-out sm:px-10 sm:py-16',
          'hover:shadow-glow-sm focus-visible:shadow-glow-sm',
          dragOver && 'scale-[1.015] shadow-glow',
          isProcessing && 'pointer-events-none',
        )}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={onSelect}
        />

        <motion.div
          animate={dragOver ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="relative mx-auto flex size-20 items-center justify-center rounded-3xl gradient-brand text-white shadow-glow"
        >
          {dragOver ? <FileSpreadsheet className="size-9" /> : <UploadCloud className="size-9" />}
          <span className="absolute inset-0 -z-10 animate-pulse-glow rounded-3xl bg-brand-500/40 blur-xl" />
        </motion.div>

        <h2 className="mt-7 text-xl font-bold tracking-tight text-ink sm:text-2xl">CARGAR EXCEL DE CAPACITACIÓN</h2>
        <p className="mx-auto mt-2.5 max-w-sm text-sm text-ink-muted">Arrastra o selecciona tu archivo.</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {['.xls', '.xlsx'].map((ext) => (
            <span
              key={ext}
              className="rounded-lg border border-line bg-surface/60 px-2.5 py-1 text-xs font-bold text-ink-soft backdrop-blur-sm transition-colors duration-300 group-hover:border-brand-400/40 group-hover:text-brand-300"
            >
              {ext}
            </span>
          ))}
        </div>

        {isProcessing && (
          <div className="mt-8">
            {progress ? (
              <>
                <Progress value={progress.percent} className="mt-4" />
                <div className="mt-3 flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Loader2 className="size-4 animate-spin text-brand-500" />
                    {progressLabelForStage(progress.stage)}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-ink-soft tabular-nums">
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
      </motion.div>

      {uploadMeta && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 shadow-card"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-emerald-400">{uploadMeta.fileName}</p>
              <p className="mt-1 text-xs text-ink-muted tabular-nums">
                {uploadMeta.totalRegistros.toLocaleString('es-PE')} registros ·{' '}
                {formatISOToDisplay(uploadMeta.uploadedAt)}
              </p>
              {filtered.length === 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400">
                  <SearchX className="size-4 shrink-0" />
                  Los filtros activos no muestran registros. Límpialos para ver toda la información.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function progressLabelForStage(stage: ExcelStage): string {
  switch (stage) {
    case 'leer':
      return 'Leyendo archivo...';
    case 'registros':
      return 'Procesando registros...';
    case 'kpis':
      return 'Calculando indicadores...';
    case 'hojas':
    case 'columnas':
    case 'fin':
      return 'Procesando...';
  }
}
