'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { CapacitationTimeline } from '@/components/timeline/CapacitationTimeline';
import { getAsistenciaEmoji } from '@/services/analytics/attendance';
import {
  UserRound,
  MapPin,
  Users,
  CalendarDays,
  Trophy,
  IdCard,
  ClipboardList,
  CalendarCheck2,
  CalendarX2,
  Percent,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Promotor } from '@/types';
import { cn } from '@/lib/utils';
import { etapaSalida } from '@/lib/etapa';

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IN';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '');
  return `${first}${second}`.toUpperCase() || 'IN';
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose';
  children: React.ReactNode;
}

const SECTION_TONES: Record<NonNullable<SectionProps['tone']>, { tile: string }> = {
  brand: { tile: 'from-brand-500/25 to-brand-500/5 text-brand-300' },
  emerald: { tile: 'from-emerald-500/25 to-emerald-500/5 text-emerald-400' },
  amber: { tile: 'from-amber-500/25 to-amber-500/5 text-amber-400' },
  rose: { tile: 'from-rose-500/25 to-rose-500/5 text-rose-400' },
};

function Section({ icon, title, tone = 'brand', children }: SectionProps) {
  const styles = SECTION_TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-line bg-surface-2/70 p-4 backdrop-blur transition-all duration-300 hover:shadow-glow-sm"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-bold tracking-tight text-ink">
        <span className={cn('flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', styles.tile)}>
          {icon}
        </span>
        {title}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{children}</div>
    </motion.div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wide text-ink-soft uppercase">{label}</p>
      <p className={cn('mt-0.5 truncate text-sm', highlight ? 'font-bold text-ink' : 'text-ink')} title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function QuickMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm">
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', tone)}>
        {icon}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums text-ink">{value}</p>
      </div>
    </div>
  );
}

export function PromotorDetailModal({ promotor, onClose }: { promotor: Promotor | null; onClose: () => void }) {
  if (!promotor) return null;

  const resultTone =
    promotor.resultado === 'APROBADO' ? 'success' : promotor.resultado === 'NO_APROBADO' ? 'danger' : 'neutral';
  const resultLabel =
    promotor.resultado === 'APROBADO' ? 'APROBADO' : promotor.resultado === 'NO_APROBADO' ? 'NO APROBADO' : 'EN CAPACITACIÓN';
  const hasAttendance = promotor.asistencia.some((a) => a !== null);
  const pct = hasAttendance ? Math.round((promotor.diasAsistidos / 10) * 100) : 0;

  return (
    <Modal open onClose={onClose} fullscreen>
      <div className="relative shrink-0 overflow-hidden border-b border-line">
        <div className="bg-mesh absolute inset-0" />
        <div className="relative flex flex-wrap items-center gap-4 px-6 py-5 sm:px-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl gradient-brand text-xl font-bold text-white shadow-glow"
          >
            {initialsOf(promotor.apellidosNombres)}
          </motion.div>
          <div className="min-w-0 flex-1">
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="truncate text-lg font-bold tracking-tight text-ink"
            >
              {promotor.apellidosNombres}
            </motion.p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={promotor.jurisdiccion === 'LIMA' ? 'brand' : 'info'}>{promotor.jurisdiccion}</Badge>
              <Badge tone={resultTone} dot dotColor={promotor.resultado === 'APROBADO' ? 'bg-emerald-500' : promotor.resultado === 'NO_APROBADO' ? 'bg-rose-500' : 'bg-amber-400'}>
                {resultLabel}
              </Badge>
              <Badge tone="neutral">DNI {promotor.dni}</Badge>
              <Badge tone="default">{promotor.modalidad}</Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="glass inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-all duration-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
            aria-label="Cerrar"
          >
            <XIcon />
          </button>
        </div>
      </div>

      <div className="grid gap-3 px-6 py-4 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
        <QuickMetric icon={<CalendarCheck2 className="size-4" />} label="Días asistidos" value={`${promotor.diasAsistidos} / 10`} tone="from-emerald-500/25 to-emerald-500/5 text-emerald-400" />
        <QuickMetric icon={<CalendarX2 className="size-4" />} label="Días faltantes" value={String(promotor.diasFaltantes)} tone="from-rose-500/25 to-rose-500/5 text-rose-400" />
        <QuickMetric icon={<Percent className="size-4" />} label="% Asistencia" value={`${pct}%`} tone="from-white/10 to-white/[0.02] text-zinc-300" />
        <QuickMetric
          icon={promotor.resultado === 'APROBADO' ? <CheckCircle2 className="size-4" /> : promotor.resultado === 'NO_APROBADO' ? <XCircle className="size-4" /> : <UserRound className="size-4" />}
          label="Estado"
          value={resultLabel}
          tone="from-brand-500/25 to-brand-500/5 text-brand-300"
        />
      </div>

      <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-4 sm:px-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Section icon={<UserRound className="size-4" />} title="DATOS PERSONALES">
            <Field label="DNI" value={promotor.dni} highlight />
            <Field label="Apellidos y nombres" value={promotor.apellidosNombres} highlight />
            <Field label="Modalidad" value={promotor.modalidad} />
          </Section>

          <Section icon={<MapPin className="size-4" />} title="UBICACIÓN" tone="emerald">
            <Field label="Jurisdicción" value={promotor.jurisdiccion} />
            <Field label="Zona comercial" value={promotor.zonaComercial} />
            <Field label="Sede" value={promotor.sede} />
            <Field label="Distrito" value={promotor.distrito} />
            <Field label="Tienda" value={promotor.nombreTienda} />
          </Section>

          <Section icon={<Users className="size-4" />} title="RESPONSABLES" tone="amber">
            <Field label="Supervisor" value={promotor.supervisor} />
            <Field label="Responsable A&S" value={promotor.responsableAS} />
            <Field label="Capacitador" value={promotor.capacitador} />
          </Section>

          <Section icon={<IdCard className="size-4" />} title="CAPACITACIÓN" tone="brand">
            <Field label="Fecha de ingreso" value={promotor.fechaIngreso} />
            <Field label="Inicio capacitación" value={promotor.inicioCapacitacion} />
            <Field label="Fin capacitación" value={promotor.finCapacitacion} />
            <Field label="Entrega a operaciones" value={promotor.entregaOperaciones} />
            <Field label="Días asistidos" value={`${promotor.diasAsistidos} / 10`} />
            <Field label="Días faltantes" value={promotor.diasFaltantes} />
          </Section>
        </div>

        <div className="space-y-4">
          <Section icon={<CalendarDays className="size-4" />} title="ASISTENCIA" tone="emerald">
            {promotor.asistencia.map((value, idx) => (
              <div key={`dia-${idx + 1}`} className="flex items-center gap-2 rounded-lg bg-surface/50 px-3 py-2 transition-colors hover:bg-surface-3">
                <span className="text-base">{getAsistenciaEmoji(value)}</span>
                <span className="text-xs font-bold text-ink">Día {idx + 1}</span>
                <span className="ml-auto text-[11px] font-semibold text-ink-soft">
                  {value === 1 ? 'Asistió' : value === 0 ? 'No asistió' : 'Sin registro'}
                </span>
              </div>
            ))}
          </Section>

          <Section icon={<Trophy className="size-4" />} title="RESULTADO" tone={promotor.resultado === 'NO_APROBADO' ? 'rose' : 'brand'}>
            <Field
              label="Resultado"
              value={promotor.resultado === 'APROBADO' ? 'Pasa a operaciones' : promotor.resultado === 'NO_APROBADO' ? 'No pasa a operaciones' : 'Pendiente'}
              highlight
            />
            <Field
              label="Estado de salida"
              value={etapaSalida(promotor).label}
            />
            <Field label="Motivo de caída" value={promotor.motivoCaida} />
            <Field label="Submotivo de caída" value={promotor.subMotivoCaida} />
          </Section>

          {promotor.pasaAOperaciones === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 shadow-[0_0_24px_-8px_rgba(244,63,94,0.5)] backdrop-blur"
            >
              <p className="text-xs font-semibold leading-relaxed text-rose-300">
                {promotor.totalDias != null && promotor.totalDias > 0 ? (
                  <>
                    El promotor abandonó o fue retirado en el{' '}
                    <span className="font-bold text-rose-200">Día {promotor.totalDias}</span> de capacitación.
                  </>
                ) : (
                  <>
                    El promotor <span className="font-bold text-rose-200">nunca asistió</span> a la capacitación.
                  </>
                )}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-line bg-surface-2/70 p-4 backdrop-blur transition-all duration-300 hover:shadow-glow-sm"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-ink">
              <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-brand-500/25 to-brand-500/5 text-brand-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <ClipboardList className="size-4" />
              </span>
              PROCESO DE CAPACITACIÓN
            </div>
            <CapacitationTimeline promotor={promotor} />
          </motion.div>
        </div>
      </div>
    </Modal>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}