'use client';

import { MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { SectionTitle } from '@/components/common/SectionTitle';
import type { ZonasAnalisis } from '@/services/analytics/zonas';
import { ZonaCriticaCard } from './ZonaCriticaCard';
import { DesercionesPorZona } from './DesercionesPorZona';
import { TasaDesercionPorZona } from './TasaDesercionPorZona';

export function AnalisisZonaSection({ data }: { data: ZonasAnalisis }) {
  return (
    <section className="mt-6 space-y-4">
      <SectionTitle
        icon={<MapPin className="size-4" />}
        title="📍 ANÁLISIS POR ZONA COMERCIAL"
        subtitle={`Fuente: ZONA COMERCIAL · ${formatNumber(data.totalZonas)} zonas · ${formatNumber(data.totalDeserciones)} deserciones${data.registrosSinZona > 0 ? ` · ${formatNumber(data.registrosSinZona)} registros sin zona` : ''}`}
      />

      <ZonaCriticaCard data={data.zonaCritica} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DesercionesPorZona data={data.porCantidad} />
        <TasaDesercionPorZona data={data.porTasa} />
      </div>
    </section>
  );
}