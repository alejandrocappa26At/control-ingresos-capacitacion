'use client';

import { BarChart as BarChartIcon, CalendarHeart, Percent, CalendarCheck2 } from 'lucide-react';
import { ChartCard } from '@/components/charts/ChartCard';
import { PremiumAreaChart } from '@/components/charts/charts';
import type { AsistenciaSummary } from '@/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

export function AttendanceControl({ asistencia }: { asistencia: AsistenciaSummary }) {
  const totalDias = asistencia.porDia.reduce((acc, d) => acc + d.asistieron + d.faltaron, 0);
  const totalAsistidos = asistencia.porDia.reduce((acc, d) => acc + d.asistieron, 0);

  const chartData = asistencia.porDia.map((d) => ({
    name: `Día ${d.dia}`,
    'Asistieron': d.asistieron,
    'Faltaron': d.faltaron,
    '% Asistencia': Number(d.porcentaje.toFixed(1)),
  }));

  return (
    <div className="space-y-4">
      <ChartCard
        title="CONTROL DE ASISTENCIA"
        description="Comparativo día a día de la asistencia en el proceso de capacitación"
        icon={<CalendarHeart className="size-4" />}
      >
        <PremiumAreaChart data={chartData} height={280} />
      </ChartCard>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card">
        <div className="max-h-[52vh] overflow-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky top-0 z-10 bg-surface-2/95 px-4 py-3 text-left text-[11px] font-bold tracking-wide text-ink-muted uppercase backdrop-blur">Día</th>
                <th className="sticky top-0 z-10 bg-surface-2/95 px-4 py-3 text-right text-[11px] font-bold tracking-wide text-ink-muted uppercase backdrop-blur">Asistieron</th>
                <th className="sticky top-0 z-10 bg-surface-2/95 px-4 py-3 text-right text-[11px] font-bold tracking-wide text-ink-muted uppercase backdrop-blur">Faltaron</th>
                <th className="sticky top-0 z-10 bg-surface-2/95 px-4 py-3 text-right text-[11px] font-bold tracking-wide text-ink-muted uppercase backdrop-blur">Sin registro</th>
                <th className="sticky top-0 z-10 bg-surface-2/95 px-4 py-3 text-left text-[11px] font-bold tracking-wide text-ink-muted uppercase backdrop-blur">% Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {asistencia.porDia.map((d, i) => (
                <tr
                  key={d.dia}
                  className={cn(
                    'border-b border-line transition-all duration-200 last:border-0 hover:bg-emerald-500/[0.05]',
                    i % 2 === 1 && 'bg-surface/40',
                  )}
                >
                  <td className="px-4 py-2.5 font-bold text-ink">Día {d.dia}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-400 tabular-nums">{formatNumber(d.asistieron)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-rose-400 tabular-nums">{formatNumber(d.faltaron)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-muted tabular-nums">{formatNumber(d.sinRegistro)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={d.porcentaje}
                        tone={d.porcentaje >= 85 ? 'success' : d.porcentaje >= 60 ? 'warning' : 'danger'}
                        className="w-28"
                      />
                      <span className="text-xs font-bold tabular-nums text-ink">{d.porcentaje.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Percent className="size-4" />}
          label="Promedio general de asistencia"
          value={`${asistencia.promedioGeneral.toFixed(1)}%`}
          iconTone="from-brand-500/25 to-brand-500/5 text-brand-600"
        />
        <StatCard
          icon={<CalendarCheck2 className="size-4" />}
          label="Asistencias totales"
          value={formatNumber(totalAsistidos)}
          iconTone="from-emerald-500/25 to-emerald-500/5 text-emerald-400"
          helper={`de ${formatNumber(totalDias)} registros de asistencia`}
        />
        <StatCard
          icon={<BarChartIcon className="size-4" />}
          label="Faltas totales"
          value={formatNumber(totalDias - totalAsistidos)}
          iconTone="from-rose-500/25 to-rose-500/5 text-rose-400"
          helper="días con inasistencia registrada"
        />
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {asistencia.porDia.map((d) => (
          <div
            key={d.dia}
            className={cn(
              'rounded-xl border p-2 text-center transition-all duration-300 hover:-translate-y-0.5',
              d.porcentaje >= 85
                ? 'border-emerald-500/20 bg-emerald-500/8 hover:shadow-glow-emerald'
                : d.porcentaje >= 60
                  ? 'border-amber-500/20 bg-amber-500/8 hover:shadow-glow-amber'
                  : 'border-rose-500/20 bg-rose-500/8 hover:shadow-glow-rose',
            )}
          >
            <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">Día {d.dia}</p>
            <p className={cn('mt-1 text-lg font-bold tabular-nums', d.porcentaje >= 85 ? 'text-emerald-400' : d.porcentaje >= 60 ? 'text-amber-400' : 'text-rose-400')}>
              {d.porcentaje.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconTone,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconTone: string;
  helper?: string;
}) {
  return (
    <div className="group rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-colors duration-300 hover:border-ink/15">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted uppercase">
        <span className={cn('flex size-7 items-center justify-center rounded-lg bg-surface-3', iconTone)}>{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-ink-muted">{helper}</p> : null}
    </div>
  );
}