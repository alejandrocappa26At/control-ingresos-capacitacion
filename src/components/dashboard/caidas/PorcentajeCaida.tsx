'use client';

import { MapPin, UserRound } from 'lucide-react';
import type { DimensionAnalysis } from '@/services/analytics/falls';
import { formatNumber } from '@/lib/utils';
import { CaidasCard } from './CaidasCard';
import { CaidasHorizontal, type CaidasBarRow } from './CaidasHorizontal';

export function PorcentajeCaida({ data, kind }: { data: DimensionAnalysis[]; kind: 'sede' | 'supervisor' }) {
  const isSede = kind === 'sede';
  const rows: CaidasBarRow[] = [...data]
    .sort((a, b) => b.pctCaida - a.pctCaida)
    .slice(0, 12)
    .map((d) => ({
      name: d.name,
      value: d.pctCaida,
      pct: d.pctCaida,
      pctLabel: 'de caída',
      sub: `${formatNumber(d.caidas)} caídas · ${formatNumber(d.total)} ingresos`,
    }));

  return (
    <CaidasCard
      icon={isSede ? MapPin : UserRound}
      iconClass={isSede
        ? 'from-amber-500/25 to-amber-500/5 text-amber-400'
        : 'from-orange-500/25 to-orange-500/5 text-orange-400'}
      title={isSede ? 'Porcentaje de caída por sede' : 'Porcentaje de caída por supervisor'}
      subtitle="Fórmula: caídas de la dimensión ÷ total de ingresos de la dimensión × 100"
    >
      <CaidasHorizontal rows={rows} accent="amber" unit="%" emptyMessage="No hay datos de porcentaje de caída." />
    </CaidasCard>
  );
}