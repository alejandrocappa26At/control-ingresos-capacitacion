'use client';

import { motion } from 'framer-motion';
import { memo, type ReactNode } from 'react';
import { ChartCard } from '@/components/charts/ChartCard';
import { SemiDonutChart } from '@/components/charts/charts';
import { GraduationCap, Trophy, UserCheck, UserX, UserRound, AlertCircle } from 'lucide-react';
import type { CapacitadorSummary, Promotor, SerieItem } from '@/types';
import { cn, formatNumber } from '@/lib/utils';
import { ResumenDeCaidas } from '@/components/dashboard/caidas/ResumenDeCaidas';

const MEDALS = ['🥇', '🥈', '🥉'];
const AVATAR_GRADIENTS: Array<[string, string]> = [
  ['#e30613', '#ff3b47'],
  ['#8b5cf6', '#c4b5fd'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#6366f1', '#a5b4fc'],
  ['#0ea5e9', '#7dd3fc'],
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export const ResultadoDonut = memo(function ResultadoDonut({ data, total, records }: { data: SerieItem[]; total: number; records?: Promotor[] }) {
  const pasa = data.find((d) => d.name.startsWith('Pasa'))?.value ?? 0;
  const bajas = data.find((d) => d.name.startsWith('Baja'))?.value ?? 0;
  const desercion = data.find((d) => d.name.startsWith('Deserc'))?.value ?? 0;
  const pendiente = data.find((d) => d.name.startsWith('En capac'))?.value ?? 0;
  const hasRecords = records !== undefined;
  const chartData = [
    { name: 'Pasa a operaciones', value: pasa },
    { name: 'Baja durante capacitación', value: bajas },
    { name: 'Deserción', value: desercion },
    { name: 'En capacitación', value: pendiente },
  ].filter((d) => d.value > 0);
  const chartColors = ['#10b981', '#f59e0b', '#18181b', '#f59e0b'];

  return (
    <ChartCard
      title="5. RESULTADO DE CAPACITACIÓN"
      description="Distribución del resultado del proceso de capacitación"
      icon={<GraduationCap className="size-4" />}
    >
      <SemiDonutChart data={chartData} colors={chartColors} centerValue={total} centerLabel="Total Ingresos" />
      {hasRecords ? (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <ResultadoCard
            label="Pasa a operaciones"
            value={pasa}
            total={total}
            icon={<UserCheck className="size-3.5" />}
            className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
          />
          <ResultadoCard
            label="Baja durante capacitación"
            value={bajas}
            total={total}
            icon={<AlertCircle className="size-3.5" />}
            className="border-amber-500/25 bg-amber-500/10 text-amber-400"
          />
          <ResultadoCard
            label="Deserción"
            value={desercion}
            total={total}
            icon={<UserX className="size-3.5" />}
            className="border-zinc-900/25 bg-zinc-900/10 text-zinc-400"
          />
          {pendiente > 0 && (
            <div className="col-span-2">
              <ResultadoCard
                label="En capacitación"
                value={pendiente}
                total={total}
                icon={<UserRound className="size-3.5" />}
                className="border-amber-500/25 bg-amber-500/10 text-amber-400"
              />
            </div>
          )}
          {hasRecords && (
            <div className="col-span-2">
              <ResumenDeCaidas records={records} />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <ResultadoCard
            label="Pasa a operaciones"
            value={pasa}
            total={total}
            icon={<UserCheck className="size-3.5" />}
            className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
          />
          <ResultadoCard
            label="Baja durante capacitación"
            value={bajas}
            total={total}
            icon={<AlertCircle className="size-3.5" />}
            className="border-amber-500/25 bg-amber-500/10 text-amber-400"
          />
          <ResultadoCard
            label="Deserción"
            value={desercion}
            total={total}
            icon={<UserX className="size-3.5" />}
            className="border-zinc-900/25 bg-zinc-900/10 text-zinc-400"
          />
          {pendiente > 0 && (
            <div className="col-span-2">
              <ResultadoCard
                label="En capacitación"
                value={pendiente}
                total={total}
                icon={<UserRound className="size-3.5" />}
                className="border-amber-500/25 bg-amber-500/10 text-amber-400"
              />
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
});

function ResultadoCard({
  label,
  value,
  total,
  icon,
  className,
}: {
  label: string;
  value: number;
  total: number;
  icon: ReactNode;
  className: string;
}) {
  return (
    <div className={cn('rounded-xl border p-3 transition-colors duration-300 hover:border-ink/15', className)}>
      <p className="flex items-center gap-1.5 text-xs font-bold">{icon} {label}</p>
      <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{formatNumber(value)}</p>
      <p className="text-xs text-ink-soft">{total > 0 ? ((value / total) * 100).toFixed(1) : 0}%</p>
    </div>
  );
}

export const CapacitadoresTable = memo(function CapacitadoresTable({ data }: { data: CapacitadorSummary[] }) {
  const rows = data
    .map((c) => ({
      ...c,
      tasa: c.finalizados > 0 ? (c.aprobados / c.finalizados) * 100 : 0,
    }))
    .sort((a, b) => b.tasa - a.tasa || b.aprobados - a.aprobados);
  const maxAsignados = Math.max(...rows.map((c) => c.asignados), 1);

  if (!rows.length) return null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className="grid gap-3 md:grid-cols-2"
    >
      {rows.map((c, i) => {
        const [from, to] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
        const enCapacitacion = Math.max(0, c.asignados - c.finalizados);
        const segA = c.asignados > 0 ? (c.aprobados / c.asignados) * 100 : 0;
        const segB = c.asignados > 0 ? (c.bajasCapacitacion / c.asignados) * 100 : 0;
        const segC = c.asignados > 0 ? (c.desercion / c.asignados) * 100 : 0;
        const segP = c.asignados > 0 ? (enCapacitacion / c.asignados) * 100 : 0;
        return (
          <motion.div
            key={c.capacitador}
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-4 shadow-card transition-colors duration-300 hover:border-ink/15"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
            <div className="flex items-center gap-3">
              <span className="flex w-8 shrink-0 justify-center">
                {i < 3 ? (
                  <span className="text-lg leading-none">{MEDALS[i]}</span>
                ) : (
                  <span className="rounded-md bg-ink/10 px-1.5 py-0.5 text-xs font-bold text-ink-soft tabular-nums">{i + 1}</span>
                )}
              </span>
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                {initialsOf(c.capacitador)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{c.capacitador}</p>
                <p className="text-[11px] font-semibold text-ink-soft">
                  {c.asignados} asignados · <span className="text-emerald-400">{c.aprobados} aprobados</span> ·{' '}
                  <span className="text-amber-400">{c.bajasCapacitacion} baja capacitación</span> ·{' '}
                  <span className="text-zinc-400">{c.desercion} deserción</span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold tabular-nums text-ink">{c.tasa.toFixed(0)}%</p>
                <p className="text-[10px] font-semibold tracking-wide text-ink-soft uppercase">aprob.</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                <span className="flex items-center gap-1"><Trophy className="size-3 text-amber-400" /> Carga total</span>
                <span className="tabular-nums">{formatNumber(c.asignados)} / {formatNumber(maxAsignados)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.asignados / maxAsignados) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
                />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                <span>Resultado</span>
                <span className="tabular-nums">
                  <span className="text-emerald-400">{segA.toFixed(0)}%</span> ·{' '}
                  <span className="text-amber-400">{segB.toFixed(0)}%</span> ·{' '}
                  <span className="text-zinc-400">{segC.toFixed(0)}%</span> ·{' '}
                  <span className="text-ink-soft">{segP.toFixed(0)}%</span>
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segA}%` }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.06 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  title={`Aprobados: ${c.aprobados}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segB}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                  title={`Baja capacitación: ${c.bajasCapacitacion}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segC}%` }}
                  transition={{ duration: 0.6, delay: 0.25 + i * 0.06 }}
                  className="h-full bg-gradient-to-r from-zinc-700 to-zinc-500"
                  title={`Deserción: ${c.desercion}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segP}%` }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.06 }}
                  className="h-full bg-ink/15"
                  title={`En capacitación: ${enCapacitacion}`}
                />
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
              <MiniStat label="Aprobados" value={c.aprobados} tone="text-emerald-400" />
              <MiniStat label="Baja capacitación" value={c.bajasCapacitacion} tone="text-amber-400" />
              <MiniStat label="Deserción" value={c.desercion} tone="text-zinc-400" />
              <MiniStat label="En capacitación" value={enCapacitacion} tone="text-ink-soft" />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-surface/50 py-1.5 transition-colors hover:bg-surface-3">
      <p className={cn('text-base font-bold leading-none tabular-nums', tone)}>{formatNumber(value)}</p>
      <p className="mt-1 text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{label}</p>
    </div>
  );
}