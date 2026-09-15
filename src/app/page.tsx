'use client';

import { useState } from 'react';
import { Users, MapPin, GraduationCap, CheckCircle2, TrendingUp, TrendingDown, BellRing, CalendarCheck2, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useAppData } from '@/hooks/useAppData';
import { ChartCard } from '@/components/charts/ChartCard';
import { BaseBarChart, HorizontalRankingChart, ChartEmpty } from '@/components/charts/charts';
import { AlertCards } from '@/components/alerts/AlertCards';
import { NoDataYet } from '@/components/common/NoDataYet';
import { DataTable } from '@/components/tables/DataTable';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { AttendanceControl } from '@/components/dashboard/AttendanceControl';
import { ResultadoDonut } from '@/components/dashboard/CapacitacionCharts';
import { cn } from '@/lib/utils';
import type { Promotor } from '@/types';

export default function DashboardPage() {
  const { records, filtered, kpis, jurisdiccion, zonas, sedes, capacitadores, capacitadoresReales, registrosExcluidos, resultado, asistencia, alertas, porMes } = useAppData();
  const hasData = records.length > 0;
  const [selected, setSelected] = useState<Promotor | null>(null);

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
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} title="TOTAL INGRESOS" value={kpis.totalIngresos} icon={Users} tone="brand" subtitle={`${kpis.lima} Lima · ${kpis.provincia} Provincia`} />
        <KpiCard index={1} title="LIMA" value={kpis.lima} icon={MapPin} tone="sky" suffix="" subtitle={`${kpis.totalIngresos > 0 ? ((kpis.lima / kpis.totalIngresos) * 100).toFixed(1) : 0}% del total`} />
        <KpiCard index={2} title="PROVINCIA" value={kpis.provincia} icon={MapPin} tone="violet" suffix="" subtitle={`${kpis.totalIngresos > 0 ? ((kpis.provincia / kpis.totalIngresos) * 100).toFixed(1) : 0}% del total`} />
        <KpiCard index={3} title="EN CAPACITACIÓN" value={kpis.enCapacitacion} icon={GraduationCap} tone="amber" subtitle="Proceso en curso" />
        <KpiCard index={4} title="CAPACITACIÓN FINALIZADA" value={kpis.capacitacionFinalizada} icon={CheckCircle2} tone="sky" subtitle="Procesos terminados" />
        <KpiCard index={5} title="PASAN A OPERACIONES" value={kpis.pasanAOperaciones} icon={TrendingUp} tone="emerald" subtitle={`De ${kpis.procesosFinalizados} procesos finalizados`} />
        <KpiCard index={6} title="NO PASAN A OPERACIONES" value={kpis.noPasanAOperaciones} icon={TrendingDown} tone="rose" subtitle="Registros con caída" />
        <KpiCard index={7} title="PORCENTAJE APROBACIÓN" value={kpis.porcentajeAprobacion} format="percent" icon={TrendingUp} tone="emerald" subtitle="Sin considerar pendientes" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard index={8} title="PORCENTAJE CAÍDA" value={kpis.porcentajeCaida} format="percent" icon={TrendingDown} tone="rose" subtitle="Sin considerar pendientes" />
      </div>

      {alertas.length > 0 && (
        <section className="mt-8">
          <SectionTitle icon={<BellRing className="size-4" />} title="Alertas inteligentes" />
          <AlertCards alertas={alertas} />
        </section>
      )}

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="1. INGRESOS POR JURISDICCIÓN"
          description="Cantidad y porcentaje por jurisdicción"
          icon={<MapPin className="size-4" />}
        >
          <BaseBarChart data={jurisdiccion} color="#e30613" height={240} />
        </ChartCard>

        <ChartCard title="2. INGRESOS POR ZONA COMERCIAL" description="Distribución por zona comercial" icon={<MapPin className="size-4" />}>
          <HorizontalRankingChart data={zonas.slice(0, 8)} height={280} icon={MapPin} />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="3. INGRESOS POR SEDE (RANKING)" description="Mayor a menor" icon={<MapPin className="size-4" />}>
          <HorizontalRankingChart data={sedes} icon={Building2} />
        </ChartCard>

        <ResultadoDonut data={resultado} total={kpis.totalIngresos} records={filtered} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="INGRESOS POR MES" description="Evolución de ingresos mensuales" icon={<TrendingUp className="size-4" />}>
          {porMes.length ? <BaseBarChart data={porMes} color="#ff2735" height={240} /> : <ChartEmpty />}
        </ChartCard>

        <ChartCard title="4. CARGA DE CAPACITACIÓN POR CAPACITADOR" description="Resumen de carga por capacitador" icon={<GraduationCap className="size-4" />}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-500">
              Capacitadores reales detectados: {capacitadoresReales}
            </span>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-500">
              {registrosExcluidos} registros excluidos por valor inválido
            </span>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {capacitadores.slice(0, 8).map((c) => (
              <div key={c.capacitador} className="rounded-xl border border-line bg-surface/50 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-glow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">{c.capacitador}</span>
                  <span className="shrink-0 text-xs font-semibold text-ink-soft">{c.asignados} asignados</span>
                </div>
                <div className="mt-2 flex gap-2 text-center">
                  <MiniStat label="Finalizados" value={c.finalizados} color="text-emerald-400" />
                  <MiniStat label="En proceso" value={c.enProceso} color="text-amber-400" />
                  <MiniStat label="Aprobados" value={c.aprobados} color="text-emerald-500" />
                  <MiniStat label="No aprob." value={c.noAprobados} color="text-rose-400" />
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