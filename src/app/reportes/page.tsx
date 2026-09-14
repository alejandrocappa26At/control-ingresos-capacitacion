'use client';

import { FileSpreadsheet, FileDown, BarChart3, DownloadCloud, CalendarCheck2, TrendingDown, GraduationCap, Building2, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { NoDataYet } from '@/components/common/NoDataYet';
import { useAppData } from '@/hooks/useAppData';
import { ChartCard } from '@/components/charts/ChartCard';
import { BaseBarChart, DonutChart, HorizontalRankingChart } from '@/components/charts/charts';
import { CapacitadoresTable, ResultadoDonut } from '@/components/dashboard/CapacitacionCharts';
import { AttendanceControl } from '@/components/dashboard/AttendanceControl';
import { Button } from '@/components/ui/button';
import { exportExcel, exportCSV } from '@/services/export/exporter';
import { toast } from 'sonner';
import { ddmmyyyy, fullMonthYear } from '@/lib/dates';
import { formatNumber } from '@/lib/utils';

export default function ReportesPage() {
  const { records, filtered, kpis, jurisdiccion, zonas, sedes, capacitadores, resultado, asistencia, motivosCaida, porMes } = useAppData();

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Reportes" description="Informes analíticos consolidados del proceso de capacitación" />
        <NoDataYet />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Información consolidada · los exportables respetan los filtros activos"
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

      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard title="Total de registros analizados" value={formatNumber(kpis.totalIngresos)} detail="Conjunto de datos completo" tone="text-brand-500" />
        <ReportCard title="Registros con filtros activos" value={formatNumber(filtered.length)} detail="Base del reporte exportado" tone="text-emerald-500" />
        <ReportCard title="Tasa de aprobación" value={`${kpis.porcentajeAprobacion.toFixed(1)}%`} detail="Sobre procesos finalizados" tone="text-sky-500" />
      </section>

      <section className="mt-8">
        <SectionTitle icon={<BarChart3 className="size-4" />} title="Resumen ejecutivo de indicadores" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="1. INGRESOS POR JURISDICCIÓN" description="Cantidad y porcentaje" icon={<BarChart3 className="size-4" />}>
            <DonutChart data={jurisdiccion} centerValue={formatNumber(kpis.totalIngresos)} centerLabel="Ingresos" />
          </ChartCard>

          <ChartCard title="2. INGRESOS POR ZONA COMERCIAL" description="Distribución por zona" icon={<BarChart3 className="size-4" />}>
            <HorizontalRankingChart data={zonas.slice(0, 10)} icon={MapPin} />
          </ChartCard>

          <ChartCard title="3. INGRESOS POR SEDE" description="Ranking de sedes" icon={<BarChart3 className="size-4" />}>
            <HorizontalRankingChart data={sedes} icon={Building2} />
          </ChartCard>

          <ChartCard title="Evolución de ingresos" description="Cantidad de ingresos por mes" icon={<BarChart3 className="size-4" />}>
            {porMes.length ? <BaseBarChart data={porMes} color="#8b5cf6" height={260} /> : <p className="text-sm text-ink-soft">Sin datos mensuales</p>}
          </ChartCard>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<GraduationCap className="size-4" />} title="4. Carga de capacitación por capacitador" />
        <CapacitadoresTable data={capacitadores} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div><ResultadoDonut data={resultado} total={kpis.totalIngresos} records={filtered} /></div>
        <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:shadow-glow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-rose-500/25 to-rose-500/5 text-rose-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <TrendingDown className="size-4" />
            </span>
            <p className="text-sm font-bold text-ink">Distribución de caídas por motivo</p>
          </div>
            {motivosCaida.length > 0 ? (
            <HorizontalRankingChart data={motivosCaida.map((m) => ({ name: m.motivo, value: m.cantidad }))} />
          ) : (
            <p className="py-10 text-center text-sm text-ink-soft">No hay caídas registradas según los filtros activos.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<CalendarCheck2 className="size-4" />} title="Control de asistencia" />
        <AttendanceControl asistencia={asistencia} />
      </section>

      <section className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-line-2 bg-surface-2 p-5 shadow-card backdrop-blur transition-all duration-300 hover:border-brand-400/40 hover:shadow-glow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl gradient-brand text-white shadow-glow-sm">
            <DownloadCloud className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Exportar reporte completo</p>
            <p className="text-xs text-ink-soft">Los archivos incluyen todos los campos del detalle de capacitación y respetan los filtros aplicados.</p>
          </div>
        </div>
        <Button variant="brand" size="sm" onClick={() => { exportExcel(filtered); toast.success('Reporte completo descargado'); }}>
          <DownloadCloud className="size-4" />
          DESCARGAR
        </Button>
      </section>

      <p className="mt-4 text-center text-xs text-ink-soft">
        Reporte generado el {ddmmyyyy(new Date().toISOString())} · período {porMes.length ? fullMonthYear(porMes[0].name) + ' a ' + fullMonthYear(porMes[porMes.length - 1].name) : 'sin datos periódicos'}
      </p>
    </>
  );
}

function ReportCard({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: string }) {
  return (
    <div className="group rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-glow-sm">
      <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{title}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{detail}</p>
    </div>
  );
}