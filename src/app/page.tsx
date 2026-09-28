'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, GraduationCap, CheckCircle2, TrendingUp, TrendingDown, Trophy, FileSpreadsheet, FileDown, AlertCircle, Clock, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useAppData } from '@/hooks/useAppData';
import { useDataStore } from '@/store/useDataStore';
import { formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { exportExcel, exportCSV } from '@/services/export/exporter';
import { toast } from 'sonner';
import { ChartCard } from '@/components/charts/ChartCard';
import { CrystalBarChart, ExecutiveLeaderboard } from '@/components/charts/premium';
import { SedeRanking } from '@/components/charts/SedeRanking';
import { IngresosPorMes } from '@/components/charts/IngresosPorMes';
import { SedeDetailModal } from '@/components/dashboard/sedes/SedeDetailModal';
import { NoDataYet } from '@/components/common/NoDataYet';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import type { Promotor } from '@/types';

export default function DashboardPage() {
  const { records, filtered, kpis, jurisdiccion, zonas, sedes, ingresosPorMesJurisdiccion } = useAppData();
  const hasData = records.length > 0;
  const [selected, setSelected] = useState<Promotor | null>(null);
  const [sedeSel, setSedeSel] = useState<string | null>(null);
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
          description="Resumen ejecutivo del proceso de ingresos y capacitación"
        />
        <NoDataYet />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen ejecutivo de los ingresos. El seguimiento operativo del proceso vive en el módulo Capacitación."
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          index={0}
          title="Total Ingresos"
          value={kpis.totalIngresos}
          icon={Users}
          tone="blue"
          subtitle={`${kpis.lima} Lima · ${kpis.provincia} Provincia`}
        />
        <KpiCard
          index={1}
          title="Inician Capacitación"
          value={kpis.inicianCapacitacion}
          icon={GraduationCap}
          tone="indigo"
          subtitle="TOTAL DE DÍAS ≥ 1"
        />
        <KpiCard
          index={2}
          title="En Capacitación"
          value={kpis.enCapacitacion}
          icon={Clock}
          tone="orange"
          subtitle="Iniciaron y siguen en proceso"
        />
        <KpiCard
          index={3}
          title="Capacitación Finalizada"
          value={kpis.capacitacionFinalizada}
          icon={CheckCircle2}
          tone="slate"
          subtitle="El proceso ya concluyó"
        />
        <KpiCard
          index={4}
          title="Aprobados"
          value={kpis.pasanAOperaciones}
          icon={UserCheck}
          tone="green"
          subtitle="Pasan a Operaciones"
        />
        <KpiCard
          index={5}
          title="Bajas durante Capacitación"
          value={kpis.bajasCapacitacion}
          icon={AlertCircle}
          tone="amber"
          subtitle={`${kpis.porcentajeBajas.toFixed(1)}% de los que iniciaron`}
        />
        <KpiCard
          index={6}
          title="Deserción"
          value={kpis.desercion}
          icon={TrendingDown}
          tone="rose"
          subtitle={`${kpis.porcentajeDesercion.toFixed(1)}% del total · nunca inició`}
        />
        <KpiCard
          index={7}
          title="% Aprobación"
          value={kpis.porcentajeAprobacion}
          format="percent"
          icon={TrendingUp}
          tone="emerald"
          subtitle={`${formatNumber(kpis.pasanAOperaciones)} de ${formatNumber(kpis.inicianCapacitacion)} que iniciaron`}
        />
      </section>

      <section className="mt-6">
        <ChartCard title="1. INGRESOS POR MES" description="Evolución mensual de ingresos comparando Lima vs Provincia" icon={<TrendingUp className="size-4" />}>
          <IngresosPorMes data={ingresosPorMesJurisdiccion} height={400} />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <CrystalBarChart data={jurisdiccion} height={380} title="2. INGRESOS POR JURISDICCIÓN" />
        <ChartCard title="3. INGRESOS POR ZONA COMERCIAL" description="Distribución por zona comercial" icon={<MapPin className="size-4" />}>
          <ExecutiveLeaderboard data={zonas.slice(0, 8)} height={380} color="#e30613" />
        </ChartCard>
      </section>

      <section className="mt-4">
        <ChartCard title="4. INGRESOS POR SEDE" description="Haz clic en una sede para abrir su detalle ejecutivo" icon={<Trophy className="size-4" />}>
          <SedeRanking data={sedes} onSelect={setSedeSel} />
        </ChartCard>
      </section>

      <SedeDetailModal
        key={sedeSel ?? 'sin-sede'}
        sede={sedeSel}
        records={filtered}
        onClose={() => setSedeSel(null)}
        onSelectPromotor={setSelected}
      />

      <PromotorDetailModal promotor={selected} onClose={() => setSelected(null)} />
    </>
  );
}
