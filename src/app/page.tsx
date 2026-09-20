'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, GraduationCap, CheckCircle2, TrendingUp, TrendingDown, CalendarCheck2, Building2, FileSpreadsheet, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { sparkPorMes } from '@/services/analytics/spark';
import { useAppData } from '@/hooks/useAppData';
import { useDataStore } from '@/store/useDataStore';
import { Button } from '@/components/ui/button';
import { exportExcel, exportCSV } from '@/services/export/exporter';
import { toast } from 'sonner';
import { ChartCard } from '@/components/charts/ChartCard';
import { BaseBarChart, ChartEmpty } from '@/components/charts/charts';
import { CrystalBarChart, ExecutiveLeaderboard, PremiumBubbleChart } from '@/components/charts/premium';
import { NoDataYet } from '@/components/common/NoDataYet';
import { DataTable } from '@/components/tables/DataTable';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { AttendanceControl } from '@/components/dashboard/AttendanceControl';
import { ResultadoDonut } from '@/components/dashboard/CapacitacionCharts';
import { cn } from '@/lib/utils';
import type { Promotor } from '@/types';

export default function DashboardPage() {
  const { records, filtered, kpis, jurisdiccion, zonas, sedes, capacitadores, capacitadoresReales, registrosExcluidos, resultado, asistencia, porMes } = useAppData();
  const sparks = sparkPorMes(filtered);
  const hasData = records.length > 0;
  const [selected, setSelected] = useState<Promotor | null>(null);
  const loadStartedAt = useDataStore((s) => s.loadStartedAt);

  useEffect(() => {
    if (!hasData || !loadStartedAt) return;
    console.info(
      `[Dashboard] TIEMPO REAL HASTA QUE EL DASHBOARD SE MUESTRA: ${Date.now() - loadStartedAt} ms desde el inicio de la carga (${records.length} registros)`,
    );
  }, [hasData, loadStartedAt, records.length]);

  if (!hasData) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Resumen general del proceso de ingresos y capacitación de promotores"
        />
        <NoDataYet />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visión general de los indicadores de ingresos y capacitación"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="brand" size="sm" onClick={() => { exportExcel(filtered); toast.success(`Reporte Excel generado (${filtered.length} registros)`); }}>
              <FileSpreadsheet className="size-4" />
              EXPORTAR EXCEL
            </Button>
            <Button variant="outline" size="sm" onClick={() => { exportCSV(filtered); toast.success(`Reporte CSV generado (${filtered.length} registros)`); }}>
              <FileDown className="size-4" />
              EXPORTAR CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2">
        <KpiCard index={0} title="Total Ingresos" value={kpis.totalIngresos} icon={Users} tone="brand" subtitle={`${kpis.lima} Lima · ${kpis.provincia} Provincia`} spark={sparks.ingresos} />
        <KpiCard index={1} title="En Capacitación" value={kpis.enCapacitacion} icon={GraduationCap} tone="amber" subtitle="Proceso en curso" spark={sparks.capacitacion} />
        <KpiCard index={2} title="Capacitación Finalizada" value={kpis.capacitacionFinalizada} icon={CheckCircle2} tone="slate" subtitle="Procesos terminados" spark={sparks.finalizada} />
        <KpiCard index={3} title="Pasan a Operaciones" value={kpis.pasanAOperaciones} icon={TrendingUp} tone="emerald" subtitle={`De ${kpis.procesosFinalizados} procesos finalizados`} spark={sparks.pasan} />
        <KpiCard index={4} title="No Pasan a Operaciones" value={kpis.noPasanAOperaciones} icon={TrendingDown} tone="rose" subtitle={`${kpis.porcentajeCaida.toFixed(1)}% de caída`} spark={sparks.caidas} />
        <KpiCard index={5} title="Porcentaje de Aprobación" value={kpis.porcentajeAprobacion} format="percent" icon={TrendingUp} tone="emerald" subtitle="Sin considerar pendientes" spark={sparks.aprobacion} />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="1. INGRESOS POR JURISDICCIÓN"
          description="Cantidad y porcentaje por jurisdicción"
          icon={<MapPin className="size-4" />}
        >
          <CrystalBarChart data={jurisdiccion} color="#2563eb" height={300} />
        </ChartCard>

        <ChartCard title="2. INGRESOS POR ZONA COMERCIAL" description="Distribución por zona comercial" icon={<MapPin className="size-4" />}>
          <ExecutiveLeaderboard data={zonas.slice(0, 8)} height={320} color="#2563eb" />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="3. INGRESOS POR SEDE" description="Volumen de ingresos por sede (área = cantidad)" icon={<Building2 className="size-4" />}>
          <PremiumBubbleChart data={sedes} height={300} />
        </ChartCard>

        <ChartCard title="4. INGRESOS POR MES" description="Evolución de ingresos mensuales" icon={<TrendingUp className="size-4" />}>
          {porMes.length ? <BaseBarChart data={porMes} color="#2563eb" height={300} /> : <ChartEmpty />}
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <ResultadoDonut data={resultado} total={kpis.totalIngresos} records={filtered} />

        <ChartCard title="6. CARGA DE CAPACITACIÓN POR CAPACITADOR" description="Resumen de carga por capacitador" icon={<GraduationCap className="size-4" />}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600">
              Capacitadores reales detectados: {capacitadoresReales}
            </span>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-600">
              {registrosExcluidos} registros excluidos por valor inválido
            </span>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {capacitadores.slice(0, 10).map((c) => (
              <div key={c.capacitador} className="rounded-xl border border-line bg-surface/50 p-3 transition-colors duration-300 hover:border-ink/15 hover:bg-surface-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">{c.capacitador}</span>
                  <span className="shrink-0 text-xs font-semibold text-ink-soft">{c.asignados} asignados</span>
                </div>
                <div className="mt-2 flex gap-2 text-center">
                  <MiniStat label="Finalizados" value={c.finalizados} color="text-emerald-600" />
                  <MiniStat label="En proceso" value={c.enProceso} color="text-amber-600" />
                  <MiniStat label="Aprobados" value={c.aprobados} color="text-emerald-600" />
                  <MiniStat label="No aprob." value={c.noAprobados} color="text-rose-600" />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<CalendarCheck2 className="size-4" />} title="Resumen de asistencia" />
        <AttendanceControl asistencia={asistencia} />
      </section>

      <section className="mt-8">
        <SectionTitle
          icon={<Users className="size-4" />}
          title="Ingresos en capacitación"
          subtitle={`${filtered.length} registros (con filtros activos)`}
        />
        <DataTable data={filtered.slice(0, 50)} onRowClick={setSelected} pageSize={10} />
      </section>

      <PromotorDetailModal promotor={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 rounded-lg bg-surface-2/70 py-1.5 transition-colors hover:bg-surface-3">
      <p className={cn('text-lg font-bold leading-none tabular-nums', color)}>{value}</p>
      <p className="mt-1 text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{label}</p>
    </div>
  );
}