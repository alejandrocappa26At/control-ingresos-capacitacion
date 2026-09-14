'use client';

import { CalendarCheck2, Percent, Users, CalendarX2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { NoDataYet } from '@/components/common/NoDataYet';
import { AttendanceControl } from '@/components/dashboard/AttendanceControl';
import { useAppData } from '@/hooks/useAppData';

export default function AsistenciaPage() {
  const { records, filtered, asistencia } = useAppData();

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Asistencia" description="Control detallado de la asistencia diaria durante la capacitación" />
        <NoDataYet />
      </>
    );
  }

  const totalRegistros = asistencia.porDia.reduce((acc, d) => acc + d.asistieron + d.faltaron, 0);
  const totalAsistidos = asistencia.porDia.reduce((acc, d) => acc + d.asistieron, 0);
  const totalFaltas = totalRegistros - totalAsistidos;
  const conRegistro = records.filter((r) => r.asistencia.some((a) => a !== null)).length;

  return (
    <>
      <PageHeader
        title="Asistencia"
        description={`Control diario de asistencia para ${filtered.length} promotores (según filtros)`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} title="PROMOTORES CON REGISTRO" value={conRegistro} icon={Users} tone="brand" subtitle="Al menos 1 día registrado" />
        <KpiCard index={1} title="ASISTENCIAS TOTALES" value={totalAsistidos} icon={CalendarCheck2} tone="emerald" />
        <KpiCard index={2} title="FALTAS TOTALES" value={totalFaltas} icon={CalendarX2} tone="rose" />
        <KpiCard index={3} title="PROMEDIO GENERAL" value={asistencia.promedioGeneral} format="percent" icon={Percent} tone="sky" />
      </div>

      <section className="mt-6">
        <AttendanceControl asistencia={asistencia} />
      </section>
    </>
  );
}