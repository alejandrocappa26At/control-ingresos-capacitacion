'use client';

import { MapPin } from 'lucide-react';
import type { DimensionAnalysis } from '@/services/analytics/falls';
import { formatNumber } from '@/lib/utils';
import { CaidasCard } from './CaidasCard';
import { CaidasHorizontal, type CaidasBarRow } from './CaidasHorizontal';

export function CaidasPorSede({ data }: { data: DimensionAnalysis[] }) {
  const total = data.reduce((acc, d) => acc + d.caidas, 0);
  const rows: CaidasBarRow[] = [...data]
    .filter((d) => d.caidas > 0)
    .sort((a, b) => b.caidas - a.caidas)
    .slice(0, 12)
    .map((d) => ({
      name: d.name,
      value: d.caidas,
      pct: d.pctDelTotal,
      pctLabel: 'del total de caídas',
      sub: `${formatNumber(d.total)} ingresos`,
    }));

  return (
    <CaidasCard
      icon={MapPin}
      title="Caídas por sede"
      subtitle={`${formatNumber(total)} caídas en total · ordenado de mayor a menor`}
    >
      <CaidasHorizontal rows={rows} accent="rose" emptyMessage="No hay caídas por sede." />
    </CaidasCard>
  );
}