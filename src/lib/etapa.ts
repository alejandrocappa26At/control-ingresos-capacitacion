export type EtapaSalidaKind = 'NUNCA_ASISTIO' | 'DIA' | 'PASO_A_OPERACIONES' | 'EN_CAPACITACION';

export interface EtapaSalidaResult {
  kind: EtapaSalidaKind;
  label: string;
  detalle?: string;
}

export function etapaSalida(p: {
  pasaAOperaciones: 1 | 0 | null;
  totalDias: number | null;
}): EtapaSalidaResult {
  if (p.pasaAOperaciones === 1) {
    return { kind: 'PASO_A_OPERACIONES', label: 'Pasó a Operaciones' };
  }
  if (p.pasaAOperaciones === 0) {
    if (p.totalDias != null && p.totalDias > 0) {
      return { kind: 'DIA', label: `Cayó en Día ${p.totalDias}` };
    }
    return { kind: 'NUNCA_ASISTIO', label: 'Nunca asistió' };
  }
  return { kind: 'EN_CAPACITACION', label: 'En Capacitación' };
}