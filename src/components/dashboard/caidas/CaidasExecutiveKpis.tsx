'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Percent, TrendingDown, UserX, type LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DimensionAnalysis } from '@/services/analytics/falls';

interface ExecKpiProps {
  index: number;
  title: string;
  value: number;
  valueFormat?: 'number' | 'percent';
  label: string;
  sub?: string;
  icon: LucideIcon;
}

function ExecKpi({ index, title, value, valueFormat = 'number', label, sub, icon: Icon }: ExecKpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_60px_-12px_rgba(239,68,68,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(239,68,68,0.28),transparent_62%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-ink-soft uppercase">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
              {valueFormat === 'number' ? (
                <CountUp value={value} />
              ) : (
                <span className="tabular-nums">{value.toFixed(1)}%</span>
              )}
            </p>
            <p className="mt-1.5 truncate text-[11px] font-semibold text-ink-muted" title={label}>{label}</p>
            {sub && <p className="text-[10px] font-medium text-ink-soft">{sub}</p>}
          </div>
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-rose-500/30 to-rose-500/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Icon className="size-5 text-rose-400 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-500 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    </motion.div>
  );
}

export function CaidasExecutiveKpis({
  sede,
  supervisor,
  pctTop,
  total,
}: {
  sede?: DimensionAnalysis;
  supervisor?: DimensionAnalysis;
  pctTop?: DimensionAnalysis;
  total: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ExecKpi
        index={0}
        title="Sede con mayor caída"
        value={sede?.caidas ?? 0}
        label={sede?.name ?? 'Sin datos'}
        sub={sede ? `${formatNumber(sede.caidas)} de ${formatNumber(sede.total)} ingresos` : undefined}
        icon={AlertTriangle}
      />
      <ExecKpi
        index={1}
        title="Supervisor con mayor caída"
        value={supervisor?.caidas ?? 0}
        label={supervisor?.name ?? 'Sin datos'}
        sub={supervisor ? `${formatNumber(supervisor.caidas)} de ${formatNumber(supervisor.total)} ingresos` : undefined}
        icon={UserX}
      />
      <ExecKpi
        index={2}
        title="Porcentaje de caída más alto"
        value={pctTop?.pctCaida ?? 0}
        valueFormat="percent"
        label={pctTop?.name ?? 'Sin datos'}
        sub={pctTop ? `${formatNumber(pctTop.caidas)} caídas de ${formatNumber(pctTop.total)} ingresos` : undefined}
        icon={Percent}
      />
      <ExecKpi
        index={3}
        title="Total de caídas"
        value={total}
        label="No pasan a operaciones"
        sub="Registros con PASA A OPERACIONES = No"
        icon={TrendingDown}
      />
    </div>
  );
}