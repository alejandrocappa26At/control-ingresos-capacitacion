'use client';

import { memo, useMemo, useState } from 'react';
import { AlertOctagon, Layers, ListX, MapPin, Tag, UserRound, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatNumber } from '@/lib/utils';
import {
  caidas,
  caidasPorSede,
  caidasPorSupervisor,
  rankingPorMotivo,
  rankingPorSubMotivo,
} from '@/services/analytics/falls';
import type { Promotor } from '@/types';

const LIMITE_COMPLETO = 10;
const TOP_N = 5;

export const ResumenDeCaidas = memo(function ResumenDeCaidas({ records }: { records: Promotor[] }) {
  const [open, setOpen] = useState(false);

  const list = useMemo(
    () =>
      caidas(records).sort(
        (a, b) => a.sede.localeCompare(b.sede) || a.apellidosNombres.localeCompare(b.apellidosNombres),
      ),
    [records],
  );

  const sedeTop = useMemo(
    () => caidasPorSede(records).sort((a, b) => b.caidas - a.caidas).find((d) => d.caidas > 0),
    [records],
  );
  const supervisorTop = useMemo(
    () => caidasPorSupervisor(records).sort((a, b) => b.caidas - a.caidas).find((d) => d.caidas > 0),
    [records],
  );
  const motivoTop = useMemo(() => rankingPorMotivo(records)[0], [records]);
  const subMotivoTop = useMemo(() => rankingPorSubMotivo(records)[0], [records]);

  const total = list.length;
  const showTop = total > LIMITE_COMPLETO;
  const visible = showTop ? list.slice(0, TOP_N) : list;

  return (
    <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-rose-500/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-rose-500 uppercase">
          <AlertOctagon className="size-3.5" /> Resumen de caídas
        </p>
        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-400 tabular-nums">
          Total: {formatNumber(total)}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-3 text-xs font-medium text-ink-soft">
          No hay caídas registradas según los filtros activos.
        </p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            <SummaryRow icon={MapPin} label="Sede más afectada" value={sedeTop?.name} count={sedeTop?.caidas} />
            <SummaryRow icon={UserRound} label="Supervisor más afectado" value={supervisorTop?.name} count={supervisorTop?.caidas} />
            <SummaryRow icon={Tag} label="Motivo principal" value={motivoTop?.motivo} count={motivoTop?.cantidad} />
            <SummaryRow icon={Layers} label="Submotivo principal" value={subMotivoTop?.motivo} count={subMotivoTop?.cantidad} />
          </div>

          <div className="mt-3 border-t border-rose-500/15 pt-3">
            <p className="mb-2 text-[10px] font-bold tracking-wider text-ink-soft uppercase">
              {showTop ? `TOP ${TOP_N} de ${formatNumber(total)} caídas` : 'Listado de caídas'}
            </p>
            <ul className="space-y-1.5">
              {visible.map((r) => (
                <li key={r.id} className="flex items-start gap-2 rounded-lg bg-surface-2/50 px-2.5 py-1.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_6px_currentColor]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink" title={r.apellidosNombres}>
                      {r.apellidosNombres}
                    </p>
                    <p className="truncate text-[10px] text-ink-soft">
                      {r.sede} · {r.supervisor} · <span className="font-medium text-rose-400">{r.motivoCaida}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="mt-3 w-full border-rose-500/30 text-rose-500 hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-600"
          >
            <ListX className="size-4" />
            Ver detalle completo ({formatNumber(total)})
          </Button>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        fullscreen
        title={
          <span className="flex items-center gap-2">
            <AlertOctagon className="size-4 text-rose-500" />
            Detalle de caídas · {formatNumber(total)} registros
          </span>
        }
      >
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {list.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-soft">No hay caídas registradas.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface/40">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-surface-3/95 text-[10px] tracking-wide text-ink-soft uppercase backdrop-blur">
                  <tr className="border-b border-line">
                    <th className="px-3 py-2.5 font-bold">#</th>
                    <th className="py-2.5 pr-3 font-bold">Promotor</th>
                    <th className="py-2.5 pr-3 font-bold">Sede</th>
                    <th className="py-2.5 pr-3 font-bold">Supervisor</th>
                    <th className="py-2.5 pr-3 font-bold">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((r, i) => (
                    <tr key={r.id} className="transition-colors hover:bg-surface-3/50">
                      <td className="px-3 py-2 text-ink-soft tabular-nums">{i + 1}</td>
                      <td className="pr-3 py-2 font-semibold text-ink">{r.apellidosNombres}</td>
                      <td className="pr-3 py-2 text-ink-muted">{r.sede}</td>
                      <td className="pr-3 py-2 text-ink-muted">{r.supervisor}</td>
                      <td className="pr-3 py-2 font-medium text-rose-400">{r.motivoCaida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
});

function SummaryRow({
  icon: Icon,
  label,
  value,
  count,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-2.5 py-1.5">
      <Icon className="size-3.5 shrink-0 text-rose-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{label}</p>
        <p className="truncate text-xs font-bold text-ink" title={value ?? '—'}>
          {value ?? '—'}
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 tabular-nums">
        {formatNumber(count ?? 0)}
      </span>
    </div>
  );
}