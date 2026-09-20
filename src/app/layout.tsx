import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Control de Ingresos y Capacitación',
  description:
    'Plataforma analítica para gestionar, analizar y visualizar el proceso de capacitación de promotores nuevos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-[family-name:var(--font-geist-sans)] text-ink antialiased">
        <ErrorBoundary fallbackTitle="Ocurrió un problema al cargar la aplicación">
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
        <Toaster
          position="bottom-right"
          expand
          richColors
          theme="light"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-geist-sans)',
              background: '#ffffff',
              border: '1px solid rgba(17, 24, 39, 0.1)',
              backdropFilter: 'blur(16px)',
            },
          }}
        />
      </body>
    </html>
  );
}