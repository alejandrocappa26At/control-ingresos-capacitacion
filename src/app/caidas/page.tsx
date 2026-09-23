'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, MapPin, Table2, Tags } from 'lucide-react';
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
import { DataTable } from '@/components/tables/DataTable';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { useAppData } from '@/hooks/useAppData';
import type { Promotor } from '@/types';
import {
  computeEmbudo,
  caidasPorMomentoSalida,
  caidasPorDiaPorSede,
  caidasPorDiaPorSupervisor,
} from '@/services/analytics/falls';
import { analizarDesercion } from '@/services/analytics/desercion';
import { analizarReclutadores } from '@/services/analytics/reclutadores';
import { analizarZonas } from '@/services/analytics/zonas';
import { validarConsistenciaDesercion } from '@/services/analytics/validacion';

export default function CaidasPage() {
  const { records, filtered, kpis, motivosCaida, subMotivosCaida } = useAppData();
  const [selected, setSelected] = useState<Promotor | null>(null);

  useEffect(() => {
    if (filtered.length === 0) return;
    validarConsistenciaDesercion(filtered);
  }, [filtered]);

  const ejecutivo = useMemo(() => {
    const embudo = computeEmbudo(filtered);
    const porMomento = caidasPorMomentoSalida(filtered);
    const porDiaSede = caidasPorDiaPorSede(filtered);
    const porDiaSupervisor = caidasPorDiaPorSupervisor(filtered);

    return {
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
        description={`Solo registros con PASA A OPERACIONES = No · ${kpis.desercion + kpis.bajasCapacitacion} caídas según filtros activos`}
      />

      <CaidasFunnelKPIs embudo={ejecutivo.embudo} />

      <ResumenDesercion data={desercion} />

      <section className="mt-6">
        <SectionTitle
          icon={<CalendarRange className="size-4" />}
          title="¿En qué momento se produce la caída?"
          subtitle={`Momento de salida (Nunca asistió) · ${desercion.totalDeserciones} deserciones analizadas`}
        />
        <CaidasPorMomentoSalidaChart data={ejecutivo.porMomento} />
      </section>

      <section className="mt-6">
        <SectionTitle
          icon={<MapPin className="size-4" />}
          title="¿Dónde y cuándo se produce la caída?"
          subtitle={`Volumen y día promedio por sede y supervisor · ${desercion.totalDeserciones} deserciones según filtros activos`}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RankingDiaCaidaSede
            data={ejecutivo.porDiaSede}
            totalCaidas={desercion.totalDeserciones}
            subtitle={`${formatNumber(ejecutivo.porDiaSede.length)} sedes con deserciones`}
          />
          <LeaderboardDiaCaidaSupervisor
            data={ejecutivo.porDiaSupervisor}
            totalCaidas={desercion.totalDeserciones}
            subtitle={`${formatNumber(ejecutivo.porDiaSupervisor.length)} supervisores con deserciones`}
          />
        </div>
      </section>

      <AnalisisZonaSection data={zonas} />

      <AnalisisReclutadoresSection data={reclutadores} />

      <section className="mt-6">
        <SectionTitle
          icon={<Tags className="size-4" />}
          title="Motivos y submotivos de caída"
          subtitle={`${kpis.desercion + kpis.bajasCapacitacion} caídas clasificadas por motivo y submotivo`}
        />
        <CaidasRanking motivo={motivosCaida} subMotivo={subMotivosCaida} total={kpis.desercion + kpis.bajasCapacitacion} />
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