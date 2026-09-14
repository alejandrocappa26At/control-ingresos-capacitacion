'use client';

import { useMemo, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Flame } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { CaidasHeatmap, HeatCell } from '@/services/analytics/falls';
import { CaidasCard } from './CaidasCard';

const LOW = { r: 190, g: 30, b: 60 };
const HIGH = { r: 255, g: 40, b: 60 };

function heatColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  if (x < 0.01) return 'rgba(190,30,60,0.07)';
  const r = Math.round(LOW.r + (HIGH.r - LOW.r) * x);
  const g = Math.round(LOW.g + (HIGH.g - LOW.g) * x);
  const b = Math.round(LOW.b + (HIGH.b - LOW.b) * x);
  const a = 0.12 + 0.88 * x;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

interface Tip {
  x: number;
  y: number;
  cell: HeatCell;
  max: number;
}

export function CaidasHeatmap({ data }: { data: CaidasHeatmap }) {
  const [tip, setTip] = useState<Tip | null>(null);

  const { sedes, supervisores, rows } = data;

  const max = useMemo(() => {
    let m = 0;
    for (const row of rows) for (const cell of row) m = Math.max(m, cell.caidas);
    return m;
  }, [rows]);

  const rowTotals = useMemo(
    () => supervisores.map((s, si) => ({ name: s, total: rows[si].reduce((a, c) => a + c.caidas, 0) })),
    [supervisores, rows],
  );
  const colTotals = useMemo(
    () => sedes.map((s, ci) => ({ name: s, total: rows.reduce((a, row) => a + (row[ci]?.caidas ?? 0), 0) })),
    [sedes, rows],
  );

  if (supervisores.length === 0 || sedes.length === 0 || max === 0) {
    return (
      <CaidasCard icon={Flame} title="Heatmap de caídas por sede y supervisor" subtitle="Intensidad según cantidad de caídas">
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <Flame className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay datos para el heatmap.</p>
        </div>
      </CaidasCard>
    );
  }

  function onHover(e: MouseEvent, cell: HeatCell) {
    let x = e.clientX + 14;
    let y = e.clientY + 14;
    if (x + 220 > window.innerWidth) x = e.clientX - 230;
    if (y + 200 > window.innerHeight) y = e.clientY - 190;
    setTip({ x, y, cell, max });
  }

  return (
    <CaidasCard
      icon={Flame}
      title="Heatmap de caídas por sede y supervisor"
      subtitle={`Filas: supervisor · Columnas: sede · más rojo = más caídas (máx ${max})`}
    >
      <div className="overflow-x-auto pb-1">
        <div className="min-w-max">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `minmax(160px, 220px) repeat(${sedes.length}, minmax(76px, 1fr)) 64px` }}
          >
            <div />
            {sedes.map((s) => (
              <div key={s} className="truncate pb-1 text-center text-[11px] font-semibold text-ink-soft" title={s}>
                {s}
              </div>
            ))}
            <div className="pb-1 text-center text-[11px] font-bold text-ink-muted">Total</div>

            {rowTotals.map((rt, si) => (
              <div key={rt.name} className="contents">
                <div className="flex max-w-[220px] items-center truncate py-2 pr-2 text-xs font-semibold text-ink" title={rt.name}>
                  {rt.name}
                </div>
                {rows[si].map((cell, ci) => (
                  <HeatCellBox key={`${si}-${ci}`} cell={cell} max={max} onHover={onHover} onLeave={() => setTip(null)} />
                ))}
                <div className="flex items-center justify-center py-2 text-xs font-bold text-rose-300 tabular-nums">
                  {formatNumber(rt.total)}
                </div>
              </div>
            ))}

            <div className="text-[11px] text-ink-soft" />
            {colTotals.map((ct, ci) => (
              <div key={ci} className="flex items-center justify-center border-t border-line py-2 text-[11px] font-bold text-rose-300/90 tabular-nums">
                {formatNumber(ct.total)}
              </div>
            ))}
            <div className="border-t border-line py-2 text-center text-[11px] font-bold text-ink-muted tabular-nums">
              {formatNumber(rowTotals.reduce((a, r) => a + r.total, 0))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-[10px] font-semibold text-ink-soft uppercase">Menos</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, rgba(190,30,60,0.07), rgba(216,34,60,0.4), rgba(244,63,94,0.75), rgba(255,40,60,1))`,
            boxShadow: '0 0 12px rgba(244,63,94,0.4)',
          }}
        />
        <span className="text-[10px] font-semibold text-rose-300 uppercase">Más caídas</span>
      </div>

      {tip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[80] w-56 rounded-2xl glass-strong border border-white/15 px-4 py-3 text-xs shadow-glow backdrop-blur-xl"
            style={{ left: tip.x, top: tip.y }}
          >
            <p className="mb-1.5 border-b border-white/10 pb-1.5 text-[11px] font-bold tracking-wide text-ink uppercase">
              Caídas de {tip.cell.supervisor}
            </p>
            <div className="space-y-1 font-medium">
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">Sede</span>
                <span className="font-bold text-ink">{tip.cell.sede}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">Supervisor</span>
                <span className="font-bold text-ink">{tip.cell.supervisor}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">Caídas</span>
                <span className="font-bold text-rose-300 tabular-nums">{formatNumber(tip.cell.caidas)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">Aprobados</span>
                <span className="font-bold text-emerald-400 tabular-nums">{formatNumber(tip.cell.aprobados)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">Pendientes</span>
                <span className="font-bold text-amber-400 tabular-nums">{formatNumber(tip.cell.pendientes)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-ink-soft">% del total</span>
                <span className="font-bold text-ink tabular-nums">{tip.cell.pctDelTotal.toFixed(1)}%</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </CaidasCard>
  );
}

function HeatCellBox({
  cell,
  max,
  onHover,
  onLeave,
}: {
  cell: HeatCell;
  max: number;
  onHover: (e: MouseEvent, cell: HeatCell) => void;
  onLeave: () => void;
}) {
  const fill = heatColor(max > 0 ? cell.caidas / max : 0);
  const hot = cell.caidas / Math.max(max, 1) > 0.45;
  return (
    <div
      onMouseMove={(e) => onHover(e, cell)}
      onMouseLeave={onLeave}
      title={`${cell.supervisor} · ${cell.sede}: ${cell.caidas} caídas`}
      className={cn(
        'flex h-8 cursor-crosshair items-center justify-center rounded-md border transition-transform duration-150 hover:scale-105',
        cell.caidas > 0 ? 'border-white/10' : 'border-transparent',
      )}
      style={{ background: fill, color: hot ? '#ffffff' : 'var(--ink)' }}
    >
      <span className="text-xs font-bold tabular-nums">{cell.caidas}</span>
    </div>
  );
}