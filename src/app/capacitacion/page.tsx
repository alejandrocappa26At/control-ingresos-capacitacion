'use client';

import { useMemo, useState } from 'react';
import { Users, GraduationCap, CheckCircle2, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { NoDataYet } from '@/components/common/NoDataYet';
import { CapacitadoresTable } from '@/components/dashboard/CapacitacionCharts';
import { RendimientoCapacitadores } from '@/components/dashboard/capacitacion/RendimientoCapacitadores';
import { CapacitadorDetailModal } from '@/components/dashboard/capacitacion/CapacitadorDetailModal';
import { useAppData } from '@/hooks/useAppData';
import { periodoLabel } from '@/lib/dates';

export default function CapacitacionPage() {
  const { records, filtered, kpis, capacitadores, filters } = useAppData();
  const [capDetalle, setCapDetalle] = useState<string | null>(null);

  const periodo = useMemo(() => periodoLabel(filters.fechaIngreso), [filters.fechaIngreso]);

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Capacitación" description="Seguimiento operativo del proceso de capacitación" />
        <NoDataYet />
      </>
    );
  }

  const enProcesoCapacitadores = capacitadores.reduce((acc, c) => acc + c.enProceso, 0);

  return (
    <>
      <PageHeader
        title="Capacitación"
        description="Seguimiento operativo del proceso: cuántos ingresaron, cuántos siguen en curso, finalizaron, aprobaron, dieron de baja o desertaron."
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard index={0} title="Total Ingresos" value={kpis.totalIngresos} icon={Users} tone="blue" subtitle={`${kpis.lima} Lima · ${kpis.provincia} Provincia`} />
        <KpiCard index={1} title="En Capacitación" value={kpis.enCapacitacion} icon={GraduationCap} tone="orange" subtitle={`${enProcesoCapacitadores} asignaciones en proceso`} />
        <KpiCard index={2} title="Capacitación Finalizada" value={kpis.capacitacionFinalizada} icon={CheckCircle2} tone="slate" subtitle="Procesos concluidos" />
        <KpiCard index={3} title="Aprobados" value={kpis.pasanAOperaciones} icon={UserCheck} tone="green" subtitle={`${kpis.porcentajeAprobacion.toFixed(1)}% de los que iniciaron`} />
        <KpiCard index={4} title="Bajas durante Capacitación" value={kpis.bajasCapacitacion} icon={AlertCircle} tone="amber" subtitle={`${kpis.porcentajeBajas.toFixed(1)}% de los que iniciaron`} />
        <KpiCard index={5} title="Deserción" value={kpis.desercion} icon={UserX} tone="slate" subtitle={`Nunca asistieron · ${kpis.porcentajeDesercion.toFixed(1)}% del total`} />
      </section>

      <section className="mt-6">
        <RendimientoCapacitadores data={capacitadores} kpis={kpis} onSelectCapacitador={setCapDetalle} />
      </section>

      <section className="mt-6">
        <SectionTitle
          icon={<GraduationCap className="size-4" />}
          title="Carga de capacitación por capacitador"
          subtitle={`${capacitadores.length} capacitadores · ${kpis.capacitacionFinalizada} procesos concluidos`}
        />
        <CapacitadoresTable data={capacitadores} />
      </section>

      <CapacitadorDetailModal
        capacitador={capDetalle}
        records={filtered}
        periodo={periodo}
        onClose={() => setCapDetalle(null)}
      />
    </>
  );
}
