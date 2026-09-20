'use client';

import { BarChart3 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { SectionTitle } from '@/components/common/SectionTitle';
import type { DesercionAnalisis } from '@/services/analytics/desercion';
import { DesercionKpis } from './DesercionKpis';
import { TendenciaIngresosDeserciones } from './TendenciaIngresosDeserciones';

export function ResumenDesercion({ data }: { data: DesercionAnalisis }) {
  return (
    <section className="mt-6 space-y-4">
      <SectionTitle
        icon={<BarChart3 className="size-4" />}
        title="Resumen Ejecutivo de Deserción"
        subtitle={`Deserción: PASA A OPERACIONES = No con TOTAL DE DÍAS = 0 (nunca asistieron) · ${formatNumber(data.totalDeserciones)} en el periodo`}
      />

      <DesercionKpis data={data} />

      <TendenciaIngresosDeserciones data={data.tendencia} />
    </section>
  );
}