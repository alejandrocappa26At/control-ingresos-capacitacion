'use client';

import { useState } from 'react';
import { Users, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionTitle } from '@/components/common/SectionTitle';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DataTable } from '@/components/tables/DataTable';
import { PromotorDetailModal } from '@/components/modals/PromotorDetailModal';
import { NoDataYet } from '@/components/common/NoDataYet';
import { useAppData } from '@/hooks/useAppData';
import type { Promotor } from '@/types';

export default function IngresosPage() {
  const { records, filtered, kpis } = useAppData();
  const [selected, setSelected] = useState<Promotor | null>(null);

  if (records.length === 0) {
    return (
      <>
        <PageHeader title="Ingresos" description="Promotores nuevos que ingresan al proceso de capacitación" />
        <NoDataYet />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Ingresos"
        description={`${kpis.totalIngresos} promotores registrados · la información responde a los filtros activos`}
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <MiniChip label="Lima" value={kpis.lima} icon={MapPin} color="text-brand-400" />
            <MiniChip label="Provincia" value={kpis.provincia} icon={MapPin} color="text-zinc-300" />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} title="TOTAL INGRESOS" value={kpis.totalIngresos} icon={Users} tone="brand" />
        <KpiCard index={1} title="PASAN A OPERACIONES" value={kpis.pasanAOperaciones} icon={TrendingUp} tone="emerald" />
        <KpiCard index={2} title="NO PASAN" value={kpis.noPasanAOperaciones} icon={TrendingDown} tone="rose" />
        <KpiCard index={3} title="EN CAPACITACIÓN" value={kpis.enCapacitacion} icon={Users} tone="amber" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <SectionTitle
          icon={<Users className="size-4" />}
          title="Ingresos en capacitación"
          subtitle={`${filtered.length} registros visibles`}
        />
      </div>

      <div className="mt-3">
        <DataTable data={filtered} onRowClick={setSelected} pageSize={10} />
      </div>

      <PromotorDetailModal promotor={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export function MiniChip({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/80 px-3 py-2 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm">
      <Icon className={`size-4 ${color}`} />
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}