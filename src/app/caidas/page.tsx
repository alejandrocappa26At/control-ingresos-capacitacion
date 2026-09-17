'use client';

import { useMemo, useState } from 'react';
import { CalendarRange, Table2, Tags, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { NoDataYet } from '@/components/common/NoDataYet';
import { CaidasRanking } from '@/components/dashboard/CaidasRanking';
import { CaidasFunnelKPIs } from '@/components/dashboard/caidas/CaidasFunnelKPIs';
import { ResumenDesercion } from '@/components/dashboard/caidas/ResumenDesercion';
import { AnalisisReclutadoresSection } from '@/components/dashboard/reclutadores/AnalisisReclutadoresSection';
import { AnalisisZonaSection } from '@/components/dashboard/zonas/AnalisisZonaSection';
import { CaidasPorMomentoSalidaChart } from '@/components/dashboard/caidas/CaidasPorMomentoSalidaChart';
import { RankingDiaCaidaSede } from '@/components/dashboard/caidas/RankingDiaCaidaSede';
import { LeaderboardDiaCaidaSupervisor } from '@/components/dashboard/caidas/LeaderboardDiaCaidaSupervisor';
import { CaidasPorSede } from '@/components/dashboard/caidas/CaidasPorSede';
import { CaidasPorSupervisor } from '@/components/dashboard/caidas/CaidasPorSupervisor';
import { DataTable } from '@/components/tables/DataTable';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { useAppData } from '@/hooks/useAppData';
import type { Promotor } from '@/types';
import {
  caidasPorSede,
  caidasPorSupervisor,
  computeEmbudo,
  caidasPorMomentoSalida,
  caidasPorDiaPorSede,
  caidasPorDiaPorSupervisor,
} from '@/services/analytics/falls';
import { analizarDesercion } from '@/services/analytics/desercion';
import { analizarReclutadores } from '@/services/analytics/reclutadores';
import { analizarZonas } from '@/services/analytics/zonas';

export default function CaidasPage() {
  const { records, filtered, kpis, motivosCaida, subMotivosCaida } = useAppData();
  const [selected, setSelected] = useState<Promotor | null>(null);

  const ejecutivo = useMemo(() => {
    const sedeData = caidasPorSede(filtered);
    const supervisorData = caidasPorSupervisor(filtered);
    const embudo = computeEmbudo(filtered);
    const porMomento = caidasPorMomentoSalida(filtered);
    const porDiaSede = caidasPorDiaPorSede(filtered);
    const porDiaSupervisor = caidasPorDiaPorSupervisor(filtered);

    return {
      sedes: sedeData,
      supervisores: supervisorData,
      embudo,
      porMomento,
      porDiaSede,
      porDiaSupervisor,
    };
  }, [filtered]);

  const desercion = useMemo(() => analizarDesercion(filtered), [filtered]);

  const reclutadores = useMemo(() => analizarReclutadores(filtered), [filtered]);

  const zonas = useMemo(() => analizarZonas(filtered), [filtered]);

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard Ejecutivo de Caídas" description="Análisis de los promotores que no pasan a operaciones" />
        <NoDataYet />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard Ejecutivo de Caídas"
        description={`Solo registros con PASA A OPERACIONES = No · ${kpis.noPasanAOperaciones} caídas según filtros activos`}
      />

      <CaidasFunnelKPIs embudo={ejecutivo.embudo} />

      <ResumenDesercion data={desercion} />

      <AnalisisReclutadoresSection data={reclutadores} />

      <section className="mt-6">
        <SectionTitle
          icon={<CalendarRange className="size-4" />}
          title="¿En qué momento se produce la caída?"
          subtitle={`Momento de salida (Nunca asistió o Día 1 al 10) · ${kpis.noPasanAOperaciones} caídas analizadas`}
        />
        <CaidasPorMomentoSalidaChart data={ejecutivo.porMomento} />
      </section>

      <AnalisisZonaSection data={zonas} />

      <section className="mt-6">
        <SectionTitle
          icon={<CalendarRange className="size-4" />}
          title="Día de caída por sede y supervisor"
          subtitle="Día promedio de caída y total de caídas dentro de cada dimensión"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RankingDiaCaidaSede
            data={ejecutivo.porDiaSede}
            totalCaidas={kpis.noPasanAOperaciones}
            subtitle={`${formatNumber(ejecutivo.porDiaSede.length)} sedes con caídas`}
          />
          <LeaderboardDiaCaidaSupervisor
            data={ejecutivo.porDiaSupervisor}
            totalCaidas={kpis.noPasanAOperaciones}
            subtitle={`${formatNumber(ejecutivo.porDiaSupervisor.length)} supervisores con caídas`}
          />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle
          icon={<TrendingDown className="size-4" />}
          title="Dónde se producen las caídas"
          subtitle={`${kpis.noPasanAOperaciones} caídas distribuidas por sede y supervisor`}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <CaidasPorSede data={ejecutivo.sedes} />
          <CaidasPorSupervisor data={ejecutivo.supervisores} />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle
          icon={<Tags className="size-4" />}
          title="Motivos y submotivos de caída"
          subtitle={`${kpis.noPasanAOperaciones} caídas clasificadas por motivo y submotivo`}
        />
        <CaidasRanking motivo={motivosCaida} subMotivo={subMotivosCaida} total={kpis.noPasanAOperaciones} />
      </section>

      <section className="mt-6">
        <SectionTitle
          icon={<Table2 className="size-4" />}
          title="Tabla detallada"
          subtitle={`${filtered.length} promotores con caída según filtros activos`}
        />
        <div className="mt-3">
          <DataTable data={filtered} onRowClick={setSelected} pageSize={10} />
        </div>
      </section>

      <PromotorDetailModal promotor={selected} onClose={() => setSelected(null)} />
    </>
  );
}