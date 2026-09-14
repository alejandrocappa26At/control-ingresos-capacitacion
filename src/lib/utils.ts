import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-PE').format(n);
}

export function formatPercentage(n: number, digits = 1): string {
  if (!isFinite(n)) return '0%';
  return `${n.toFixed(digits)}%`;
}

export function normalizeKey(value: string): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

const CAPACITADORES_GENERICOS = ['PROMOTOR', '-', 'N/A', 'SIN CAPACITADOR', 'PENDIENTE', 'VACÍO', 'VACIO'] as const;

export function esCapacitadorGenerico(normalized: string): boolean {
  if (!normalized || normalized === '—') return true;
  return CAPACITADORES_GENERICOS.some((token) => normalized.includes(token));
}

const CAPACITADOR_SEPARATORS = /[/,;|]+/;

export function splitCapacitadores(value: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const part of String(value ?? '').split(CAPACITADOR_SEPARATORS)) {
    const norm = normalizeKey(part);
    if (esCapacitadorGenerico(norm)) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    tokens.push(norm);
  }
  return tokens;
}