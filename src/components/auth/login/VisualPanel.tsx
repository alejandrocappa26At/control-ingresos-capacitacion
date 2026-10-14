'use client';

import { BrandHeroLogo } from './BrandHeroLogo';

/**
 * Panel izquierdo: identidad AT People. El logo con resplandor premium
 * (BrandHeroLogo) es el ÚNICO elemento — sin textos de branding
 * adicionales. El fondo animado (LoginBackground) aporta la atmósfera
 * dark premium y el glow del logo se funde con la aurora roja.
 */
export function VisualPanel() {
  return (
    <div className="relative hidden flex-col items-center justify-center px-12 py-12 lg:flex xl:px-20">
      <BrandHeroLogo />
    </div>
  );
}
