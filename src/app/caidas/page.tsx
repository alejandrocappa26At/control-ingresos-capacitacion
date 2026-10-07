'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Tags } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { NoDataYet } from '@/components/common/NoDataYet';
import { CaidasRanking } from '@/components/dashboard/CaidasRanking';
import { CaidasFunnelKPIs } from '@/components/dashboard/caidas/CaidasFunnelKPIs';
import { AnalisisReclutadoresSection } from '@/components/dashboard/reclutadores/AnalisisReclutadoresSection';
import { AnalisisZonaSection } from '@/components/dashboard/zonas/AnalisisZonaSection';
import { CaidasPorMomentoSalidaChart } from '@/components/dashboard/caidas/CaidasPorMomentoSalidaChart';
import { RankingDiaCaidaSede } from '@/components/dashboard/caidas/RankingDiaCaidaSede';
import { LeaderboardDiaCaidaSupervisor } from '@/components/dashboard/caidas/LeaderboardDiaCaidaSupervisor';
import { SupervisorDetailModal } from '@/components/dashboard/caidas/SupervisorDetailModal';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { useAppData } from '@/hooks/useAppData';
import type { Promotor } from '@/types';
import { computeEmbudo, caidasPorDiaPorSede, caidasPorDiaPorSupervisor } from '@/services/analytics/falls';
import { analizarDesercion } from '@/services/analytics/desercion';
import { analizarReclutadores, validarCalculosReclutadores } from '@/services/analytics/reclutadores';
import { analizarZonas } from '@/services/analytics/zonas';
import { validarConsistenciaDesercion } from '@/services/analytics/validacion';

export default function CaidasPage() {
  const { records, filtered, kpis, motivosCaida, subMotivosCaida } = useAppData();
  const [selected, setSelected] = useState<Promotor | null>(null);
  const [supervisorSel, setSupervisorSel] = useState<string | null>(null);

  useEffect(() => {
    if (filtered.length === 0) return;
    validarConsistenciaDesercion(filtered);
    validarCalculosReclutadores(filtered);
  }, [filtered]);

  const ejecutivo = useMemo(() => {
    const embudo = computeEmbudo(filtered);
    const porDiaSede = caidasPorDiaPorSede(filtered);
    const porDiaSupervisor = caidasPorDiaPorSupervisor(filtered);

    return {
      embudo,
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

      <CaidasFunnelKPIs
        embudo={ejecutivo.embudo}
        kpis={kpis}
        mesMayor={desercion.mesMayor}
        desercionDiaCero={desercion.totalDeserciones > 0}
      />

      <section className="mt-6">
        <CaidasPorMomentoSalidaChart records={filtered} />
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
            onSelect={setSupervisorSel}
          />
        </div>
      </section>

      <AnalisisZonaSection data={zonas} />

      <AnalisisReclutadoresSection data={reclutadores} records={filtered} onSelectPromotor={setSelected} />

      <section className="mt-6">
        <SectionTitle
          icon={<Tags className="size-4" />}
          title="Motivos y submotivos de caída"
          subtitle={`${kpis.desercion + kpis.bajasCapacitacion} caídas clasificadas por motivo y submotivo`}
        />
        <CaidasRanking motivo={motivosCaida} subMotivo={subMotivosCaida} total={kpis.desercion + kpis.bajasCapacitacion} />
      </section>

      <SupervisorDetailModal
        supervisor={supervisorSel}
        records={filtered}
        onClose={() => setSupervisorSel(null)}
        onSelectPromotor={setSelected}
      />

      <PromotorDetailModal promotor={selected} onClose={() => setSelected(null)} />
    </>
  );
}