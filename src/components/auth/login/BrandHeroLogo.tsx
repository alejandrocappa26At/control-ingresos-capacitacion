'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from './constants';

/**
 * Logo AT People con efecto de resplandor premium ("emite luz"):
 *
 *  1. Halo radial rojo de fondo con respiración lenta (9 s).
 *  2. Eco luminoso: copia del logo desenfocada + saturada + tinte rojo con
 *     `mix-blend-screen` — la luz sigue el contorno REAL del artwork
 *     (el PNG tiene alfa) y pulsa desfasado (7 s) para sensación de
 *     energía viva.
 *  3. Logo nítido encima, con sombra roja suave + sombra de profundidad.
 *
 * Rendimiento: capas ya rasterizadas (mismo asset, caché del navegador);
 * solo se animan opacity/transform (composición GPU, sin repintado), los
 * filtros son estáticos y con `prefers-reduced-motion` los pulsos se
 * desactivan dejando el glow estático.
 */
export function BrandHeroLogo() {
  const reducirMovimiento = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE }}
      className="relative mx-auto w-full max-w-[520px]"
    >
      {/* 1 — Halo radial de fondo: respiración casi imperceptible */}
      <motion.div
        aria-hidden
        animate={
          reducirMovimiento
            ? { opacity: 0.7 }
            : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.05, 1] }
        }
        transition={{ duration: 9, repeat: reducirMovimiento ? undefined : Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-[-18%] bg-[radial-gradient(closest-side,rgba(220,38,38,0.22),rgba(220,38,38,0.08)_55%,transparent_78%)] blur-2xl"
      />

      {/* 2 — Eco luminoso: la silueta del logo convertida en resplandor */}
      <motion.div
        aria-hidden
        animate={
          reducirMovimiento
            ? { opacity: 0.55 }
            : { opacity: [0.45, 0.68, 0.45], scale: [1, 1.035, 1] }
        }
        transition={{
          duration: 7,
          delay: 0.8, // desfase con el halo → pulsos orgánicos, no sincronizados
          repeat: reducirMovimiento ? undefined : Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{ filter: 'blur(18px) saturate(1.4) drop-shadow(0 0 26px rgba(227,6,19,0.55))' }}
      >
        <Image src="/logo2at.png" alt="" aria-hidden width={1536} height={1024} className="h-auto w-full" />
      </motion.div>

      {/* 3 — Logo nítido (protagonista) */}
      <Image
        src="/logo2at.png"
        alt="AT People — Conectando talento, datos y resultados."
        width={1536}
        height={1024}
        priority
        sizes="520px"
        className="relative h-auto w-full [filter:drop-shadow(0_0_16px_rgba(227,6,19,0.3))_drop-shadow(0_18px_38px_rgba(0,0,0,0.5))]"
      />
    </motion.div>
  );
}
