'use client';

import { useState } from 'react';
import { GraduationCap, CheckCircle2, UserCheck, UserX, Clock3 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DataTable } from '@/components/tables/DataTable';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { NoDataYet } from '@/components/common/NoDataYet';
import { CapacitadoresTable, ResultadoDonut } from '@/components/dashboard/CapacitacionCharts';
import { useAppData } from '@/hooks/useAppData';
import type { Promotor } from '@/types';

export default function CapacitacionPage() {
  const { records, filtered, kpis, capacitadores, resultado } = useAppData();
  const [selected, setSelected] = useState<Promotor | null>(null);

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Capacitación" description="Gestión y seguimiento del proceso de capacitación de los promotores" />
        <NoDataYet />
      </>
    );
  }

  const enProcesoCapacitadores = capacitadores.reduce((acc, c) => acc + c.enProceso, 0);

  return (
    <>
      <PageHeader
        title="Capacitación"
        description={`${capacitadores.length} capacitadores activos · seguimiento del proceso formativo`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} title="EN CAPACITACIÓN" value={kpis.enCapacitacion} icon={GraduationCap} tone="amber" subtitle={`${enProcesoCapacitadores} asignaciones en proceso`} />
        <KpiCard index={1} title="CAPACITACIÓN FINALIZADA" value={kpis.capacitacionFinalizada} icon={CheckCircle2} tone="sky" />
        <KpiCard index={2} title="APROBADOS" value={kpis.pasanAOperaciones} icon={UserCheck} tone="emerald" subtitle={`${kpis.porcentajeAprobacion.toFixed(1)}% de aprobación`} />
        <KpiCard index={3} title="NO APROBADOS" value={kpis.noPasanAOperaciones} icon={UserX} tone="rose" subtitle={`${kpis.porcentajeCaida.toFixed(1)}% de caída`} />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle icon={<GraduationCap className="size-4" />} title="4. Carga de capacitación por capacitador" />
          <CapacitadoresTable data={capacitadores} />
        </div>
        <div>
          <ResultadoDonut data={resultado} total={kpis.totalIngresos} records={filtered} />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle
          icon={<Clock3 className="size-4" />}
          title="Detalle de capacitación"
          subtitle={`${filtered.length} registros según los filtros aplicados. Haz clic en un promotor para ver la línea de tiempo completa.`}
        />
        <DataTable data={filtered} onRowClick={setSelected} pageSize={10} />
      </section>

      <PromotorDetailModal promotor={selected} onClose={() => setSelected(null)} />
    </>
  );
}