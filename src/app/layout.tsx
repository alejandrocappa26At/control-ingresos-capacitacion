import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
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
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-[family-name:var(--font-plus-jakarta-sans)] text-ink antialiased">
        <ErrorBoundary fallbackTitle="Ocurrió un problema al cargar la aplicación">
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
        <Toaster
          position="bottom-right"
          expand
          richColors
          theme="dark"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-plus-jakarta-sans)',
              background: '#161d2e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              backdropFilter: 'blur(16px)',
            },
          }}
        />
      </body>
    </html>
  );
}