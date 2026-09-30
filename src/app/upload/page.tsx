'use client';

import { Dropzone } from '@/components/upload/Dropzone';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function UploadPage() {
  return (
    <ErrorBoundary fallbackTitle="No se pudo cargar el área de carga de Excel">
      <Dropzone />
    </ErrorBoundary>
  );
}
