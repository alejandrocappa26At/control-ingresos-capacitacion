'use client';

import type { CSSProperties } from 'react';
import { mulberry32 } from './constants';

interface Particle {
  left: number;
  top: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
}

function buildParticles(): Particle[] {
  const rand = mulberry32(42);
  return Array.from({ length: 40 }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    size: 1.4 + rand() * 2.4,
    opacity: 0.12 + rand() * 0.38,
    duration: 10 + rand() * 12,
    delay: rand() * 12,
    drift: (rand() * 2 - 1) * 60,
  }));
}

/**
 * Fondo del login: base oscura + auroras rojas + riel de luz + grilla
 * tecnológica con máscara + partículas deterministas + viñeta de profundidad.
 */
export function LoginBackground() {
  const particles = buildParticles();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base */}
      <div className="absolute inset-0 bg-[#0b0f17]" />

      {/* Auroras rojas */}
      <div
        className="absolute -top-[22%] -left-[14%] size-[62vw] rounded-full opacity-80"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(220,38,38,0.14), transparent 62%)',
          filter: 'blur(90px)',
          animation: 'aurora-drift 26s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[6%] -right-[16%] size-[54vw] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle at 60% 40%, rgba(220,38,38,0.1), transparent 60%)',
          filter: 'blur(100px)',
          animation: 'aurora-drift 32s ease-in-out infinite alternate-reverse',
        }}
      />
      <div
        className="absolute -bottom-[24%] left-[16%] size-[60vw] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle at 40% 60%, rgba(227,6,19,0.12), transparent 62%)',
          filter: 'blur(110px)',
          animation: 'aurora-drift 38s ease-in-out infinite alternate',
        }}
      />

      {/* Riel de luz superior */}
      <div
        className="absolute top-0 left-1/2 h-[440px] w-[960px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(220,38,38,0.12), rgba(220,38,38,0.05) 45%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'glow-pulse 6s ease-in-out infinite',
        }}
      />

      {/* Grilla tecnológica con máscara */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 30% 40%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 30% 40%, black 20%, transparent 75%)',
        }}
      />

      {/* Partículas sutiles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
              background: i % 7 === 0 ? 'rgba(220,38,38,0.7)' : 'rgba(100,116,139,0.5)',
              boxShadow: i % 7 === 0 ? '0 0 8px rgba(220,38,38,0.35)' : '0 0 8px rgba(100,116,139,0.25)',
            } as CSSProperties
          }
        />
      ))}

      {/* Viñeta de profundidad */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(148,163,184,0.12)_100%)]" />
    </div>
  );
}
