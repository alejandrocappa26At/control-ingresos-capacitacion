'use client';

import { useMemo } from 'react';
import { AlertOctagon, TrendingDown, Percent } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { NoDataYet } from '@/components/common/NoDataYet';
import { CaidasRanking } from '@/components/dashboard/CaidasRanking';
import { CaidasExecutiveKpis } from '@/components/dashboard/caidas/CaidasExecutiveKpis';
import { CaidasPorSede } from '@/components/dashboard/caidas/CaidasPorSede';
import { CaidasPorSupervisor } from '@/components/dashboard/caidas/CaidasPorSupervisor';
import { CaidasHeatmap } from '@/components/dashboard/caidas/CaidasHeatmap';
import { PorcentajeCaida } from '@/components/dashboard/caidas/PorcentajeCaida';
import { AlertCards } from '@/components/alerts/AlertCards';
import { useAppData } from '@/hooks/useAppData';
import {
  caidasPorSede,
  caidasPorSupervisor,
  analizarHeatmap,
} from '@/services/analytics/falls';

export default function CaidasPage() {
  const { records, filtered, kpis, motivosCaida, subMotivosCaida, alertas } = useAppData();

  const ejecutivo = useMemo(() => {
    const sedes = caidasPorSede(filtered);
    const supervisores = caidasPorSupervisor(filtered);
    const heatmap = analizarHeatmap(filtered);
    const sedeTop = [...sedes].sort((a, b) => b.caidas - a.caidas).find((d) => d.caidas > 0);
    const supTop = [...supervisores].sort((a, b) => b.caidas - a.caidas).find((d) => d.caidas > 0);
    const pctTop = [...supervisores].sort((a, b) => b.pctCaida - a.pctCaida).find((d) => d.caidas > 0);
    return { sedes, supervisores, heatmap, sedeTop, supTop, pctTop, totalCaidas: kpis.noPasanAOperaciones };
  }, [filtered, kpis.noPasanAOperaciones]);

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard Ejecutivo de Caídas" description="Análisis de los promotores que no pasan a operaciones" />
        <NoDataYet />
      </>
    );
  }

  const caidasAlertas = alertas.filter((a) => a.tipo === 'incremento-caidas' || a.tipo === 'riesgo-desaprobacion');

  return (
    <>
      <PageHeader
        title="Dashboard Ejecutivo de Caídas"
        description={`Solo registros con PASA A OPERACIONES = No · ${kpis.noPasanAOperaciones} caídas según filtros activos`}
      />

      <CaidasExecutiveKpis
        sede={ejecutivo.sedeTop}
        supervisor={ejecutivo.supTop}
        pctTop={ejecutivo.pctTop}
        total={ejecutivo.totalCaidas}
      />

      {caidasAlertas.length > 0 && (
        <section className="mt-6">
          <SectionTitle icon={<AlertOctagon className="size-4" />} title="Alertas relacionadas" />
          <AlertCards alertas={caidasAlertas} />
        </section>
      )}

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
          icon={<AlertOctagon className="size-4" />}
          title="Intensidad de caídas por sede y supervisor"
          subtitle="Heatmap: más rojo indica mayor cantidad de caídas"
        />
        <CaidasHeatmap data={ejecutivo.heatmap} />
      </section>

      <section className="mt-6">
        <SectionTitle
          icon={<Percent className="size-4" />}
          title="Porcentaje de caída relativo"
          subtitle="Caídas de cada dimensión ÷ total de ingresos de la dimensión × 100"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <PorcentajeCaida data={ejecutivo.sedes} kind="sede" />
          <PorcentajeCaida data={ejecutivo.supervisores} kind="supervisor" />
        </div>
      </section>

      <section className="mt-6">
        <CaidasRanking motivo={motivosCaida} subMotivo={subMotivosCaida} total={kpis.noPasanAOperaciones} />
      </section>
    </>
  );
}