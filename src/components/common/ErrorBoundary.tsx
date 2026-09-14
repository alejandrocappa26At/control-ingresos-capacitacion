'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onError?: (error: unknown, info: React.ErrorInfo | null) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

function isChunkLoadError(error: unknown): boolean {
  const text = error instanceof Error ? [error.name, error.message].join(' ') : String(error);
  return /chunkload|loading chunk|failed to fetch .*chunk|\.js/i.test(text);
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] error capturado:', error);
    console.info('[ErrorBoundary] info:', info?.componentStack ?? 'sin stack');
    this.props.onError?.(error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  private handleBack = () => {
    this.setState({ hasError: false, message: '' });
    if (window.history.length > 1) window.history.back();
    else window.location.assign(window.location.origin);
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const chunkError = isChunkLoadError(this.state.message);
    const title = chunkError
      ? 'No se pudo cargar un recurso de la aplicación'
      : (this.props.fallbackTitle ?? 'Ocurrió un problema al cargar esta vista');
    const description = chunkError
      ? 'Parece que hubo un problema con la carga de los archivos de la aplicación. Recarga la página para intentarlo de nuevo.'
      : (this.props.fallbackDescription ??
        'Ocurrió un error inesperado. Puedes recargar la página o volver al inicio.');

    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card className="w-full max-w-md bg-surface-2/95 p-2">
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <CardTitle className="justify-center text-lg">{title}</CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-sm">{description}</CardDescription>
            </div>
            {chunkError && (
              <p className="rounded-lg bg-line-2/40 px-3 py-1.5 font-mono text-[11px] text-ink-soft break-all">
                {this.state.message}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="brand" size="sm" onClick={this.handleReload}>
                <RefreshCw className="size-4" /> Recargar página
              </Button>
              <Button variant="outline" size="sm" onClick={this.handleBack}>
                <ArrowLeft className="size-4" /> Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}