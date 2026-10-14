'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import { PERMISOS_LABEL, ROLES, type Permiso } from '@/lib/rbac';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Pantalla de "permiso insuficiente": se muestra cuando un usuario
 * intenta acceder a un módulo que su rol no posee (navegación interna
 * o acceso directo por URL interceptado por el proxy).
 */
export function AccesoRestringido({ modulo, onVolver }: { modulo: Permiso; onVolver: () => void }) {
  const role = useSessionStore((s) => s.role);
  const permissions = useSessionStore((s) => s.permissions);
  const roleLabel = role ? ROLES[role].label : 'su rol';

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-md rounded-3xl border border-line bg-surface-2 p-8 text-center shadow-[0_24px_70px_-24px_rgba(0,0,0,0.6)]"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_36px_-8px_rgba(244,63,94,0.5)]"
        >
          <ShieldAlert className="size-7" />
        </motion.div>

        <p className="mt-5 text-[10px] font-bold tracking-[0.22em] text-rose-400 uppercase">Permiso insuficiente</p>

        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-ink">Acceso restringido</h2>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Su rol <span className="font-bold text-ink">{roleLabel}</span> no tiene permisos para acceder al módulo{' '}
          <span className="font-bold text-ink">«{PERMISOS_LABEL[modulo]}»</span>.
        </p>

        {permissions.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold tracking-wider text-ink-soft uppercase">Módulos disponibles para su rol</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {permissions.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"
                >
                  {PERMISOS_LABEL[p]}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onVolver}
          className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-3 px-4 py-2.5 text-xs font-bold text-ink transition-all duration-200 hover:border-brand-400/50 hover:text-brand-300 active:scale-[0.98]"
        >
          <ArrowLeft className="size-3.5" />
          Volver a mi módulo
        </button>
      </motion.div>
    </div>
  );
}
