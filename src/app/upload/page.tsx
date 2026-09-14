'use client';

import { FileSpreadsheet, MapPin, Clock3, CheckCircle2, ShieldCheck, Database, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Dropzone } from '@/components/upload/Dropzone';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useDataStore } from '@/store/useDataStore';
import { formatNumber } from '@/lib/utils';
import { formatISOToDisplay } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function UploadPage() {
  const uploadMeta = useDataStore((s) => s.uploadMeta);

  return (
    <>
      <PageHeader
        title="Cargar Excel"
        description="Validación automática de hojas y columnas · procesamiento 100% en el navegador"
      />

      <ErrorBoundary fallbackTitle="No se pudo cargar el área de carga de Excel">
        <Dropzone />
      </ErrorBoundary>

      {uploadMeta && (
        <div className="mx-auto mt-6 w-full max-w-3xl">
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ink uppercase">Detalle del último archivo cargado</h3>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-glow-sm">
            <div className="border-b border-line bg-surface px-5 py-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-brand-500" />
                <span className="truncate text-sm font-bold text-ink">{uploadMeta.fileName}</span>
                <Badge tone="success" className="ml-auto">
                  <CheckCircle2 className="size-3" /> Procesado
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              <MetaCell icon={Clock3} label="Fecha de carga" value={formatISOToDisplay(uploadMeta.uploadedAt)} />
              <MetaCell icon={Database} label="Total registros" value={formatNumber(uploadMeta.totalRegistros)} />
              <MetaCell icon={MapPin} label="Total Lima" value={formatNumber(uploadMeta.totalLima)} />
              <MetaCell icon={MapPin} label="Total Provincia" value={formatNumber(uploadMeta.totalProvincia)} />
            </div>
          </Card>
        </div>
      )}

      <div className="mx-auto mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <RequirementCard
          icon={ListChecks}
          title="Validación de hojas"
          items={['CAPACITACIÓN LIMA', 'CAPACITACIÓN PROVINCIA', 'Cualquier otra hoja se ignora']}
        />
        <RequirementCard
          icon={ShieldCheck}
          title="Validación de columnas"
          items={[
            'Datos personales y de ubicación',
            'Fechas del proceso de capacitación',
            'Asistencia día 1 a día 10',
            'Resultado, motivo y submotivo de caída',
          ]}
        />
        <RequirementCard
          icon={Database}
          title="Reglas de procesamiento"
          items={[
            'Texto vacío → —',
            'Fecha vacía → Pendiente',
            'Asistencia vacía → Sin registro',
            '1 = Asistió · 0 = No asistió',
          ]}
        />
      </div>
    </>
  );
}

function MetaCell({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-surface-2 p-4 transition-colors hover:bg-surface-3/40">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}

function RequirementCard({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-ink uppercase">
        <span className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-gradient-to-b from-brand-500/25 to-brand-500/5 text-brand-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Icon className="size-3.5" />
        </span>
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-ink-muted">
            <span className="mt-1 size-1 shrink-0 rounded-full bg-brand-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}