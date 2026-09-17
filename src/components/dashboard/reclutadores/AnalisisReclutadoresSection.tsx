'use client';

import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { SectionTitle } from '@/components/common/SectionTitle';
import type { ReclutadoresAnalisis } from '@/services/analytics/reclutadores';
import { ReclutadoresKpis } from './ReclutadoresKpis';
import { ProductividadReclutadores } from './ProductividadReclutadores';
import { TasaDesercionReclutador } from './TasaDesercionReclutador';
import { ReclutadoresKpisEjecutivos } from './ReclutadoresKpisEjecutivos';

export function AnalisisReclutadoresSection({ data }: { data: ReclutadoresAnalisis }) {
  return (
    <section className="mt-6 space-y-4">
      <SectionTitle
        icon={<Users className="size-4" />}
        title="ANÁLISIS DE RECLUTADORES (RESPONSABLE A&S)"
        subtitle={`Fuente: RESPONSABLE A&S · ${formatNumber(data.totalReclutadores)} reclutadores detectados${data.registrosSinResponsable > 0 ? ` · ${formatNumber(data.registrosSinResponsable)} registros sin responsable` : ''}`}
      />

      <ReclutadoresKpis data={data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ProductividadReclutadores data={data.productividad} />
        <TasaDesercionReclutador data={data.desercion} />
      </div>

      <ReclutadoresKpisEjecutivos data={data} />
    </section>
  );
}