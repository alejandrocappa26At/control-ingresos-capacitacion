'use client';

import { LoginBackground } from './login/LoginBackground';
import { VisualPanel } from './login/VisualPanel';
import { LoginForm } from './login/LoginForm';

/**
 * Pantalla de login — orquestador del layout:
 * fondo animado · panel izquierdo con el logo AT People (VisualPanel) ·
 * tarjeta de autenticación (LoginForm).
 *
 * Subcomponentes en src/components/auth/login/ (LoginBackground,
 * BrandHeroLogo, VisualPanel, Field, LoginForm).
 */
export function LoginScreen() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0b0f17] text-ink">
      <LoginBackground />

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-[1500px] lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <VisualPanel />

        {/* Panel derecho */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-8 xl:px-16">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
