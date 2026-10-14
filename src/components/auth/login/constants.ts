/** Constantes compartidas por los subcomponentes del login. */

export const EASE = [0.16, 1, 0.3, 1] as const;

/** Generador pseudoaleatorio determinista (idéntico en SSR y cliente). */
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
