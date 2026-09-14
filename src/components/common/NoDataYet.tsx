'use client';

import Link from 'next/link';
import { UploadCloud } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export function NoDataYet({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={UploadCloud}
      title="Aún no hay datos cargados"
      description={
        message ??
        'Para analizar y visualizar los indicadores de capacitación, carga primero el archivo Excel con la información de los promotores.'
      }
      action={
        <Link href="/upload">
          <Button variant="brand" className="mt-2">
            <UploadCloud className="size-4" />
            CARGAR EXCEL
          </Button>
        </Link>
      }
      className="mt-6"
    />
  );
}