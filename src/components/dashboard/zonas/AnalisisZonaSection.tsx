'use client';

import { MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { SectionTitle } from '@/components/common/SectionTitle';
import type { ZonasAnalisis } from '@/services/analytics/zonas';
import { MatrizZonaComercial } from './MatrizZonaComercial';

export function AnalisisZonaSection({ data }: { data: ZonasAnalisis }) {
  return (
    <section className="mt-6 space-y-4">
      <SectionTitle
        icon={<MapPin className="size-4" />}
        title="Dónde se concentran las caídas: zona comercial"
        subtitle={`Fuente: ZONA COMERCIAL · ${formatNumber(data.totalZonas)} zonas · ${formatNumber(data.totalDeserciones)} deserciones${data.registrosSinZona > 0 ? ` · ${formatNumber(data.registrosSinZona)} registros sin zona` : ''}`}
      />

      <MatrizZonaComercial data={data.porCantidad} zonaCritica={data.zonaCritica} />
    </section>
  );
}