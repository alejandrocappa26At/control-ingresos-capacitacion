'use client';

import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { SectionTitle } from '@/components/common/SectionTitle';
import type { ReclutadoresAnalisis } from '@/services/analytics/reclutadores';
import { ReclutadoresResumen } from './ReclutadoresResumen';
import { MatrizReclutadores } from './MatrizReclutadores';

export function AnalisisReclutadoresSection({ data }: { data: ReclutadoresAnalisis }) {
  return (
    <section className="mt-6 space-y-4">
      <SectionTitle
        icon={<Users className="size-4" />}
        title="Quién genera los ingresos: responsable A&S"
        subtitle={`Fuente: RESPONSABLE A&S · ${formatNumber(data.totalReclutadores)} reclutadores detectados${data.registrosSinResponsable > 0 ? ` · ${formatNumber(data.registrosSinResponsable)} registros sin responsable` : ''}`}
      />

      <ReclutadoresResumen data={data} />

      <MatrizReclutadores data={data.productividad} />
    </section>
  );
}