'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Campo del formulario: icono contextual, focus premium (halo rojo +
 * brillo interior), estado de error y toggle de contraseña con transición.
 */
export function Field({
  id,
  label,
  type,
  value,
  placeholder,
  icon,
  error,
  autoComplete,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  type: 'text' | 'password';
  value: string;
  placeholder: string;
  icon: ReactNode;
  error?: string;
  autoComplete: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">
        {label}
      </label>
      <div className="group relative mt-1.5">
        <span
          className={cn(
            'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors duration-300',
            error ? 'text-rose-500' : value ? 'text-brand-400' : 'text-ink-soft group-focus-within:text-brand-400',
          )}
        >
          {icon}
        </span>
        <input
          id={id}
          type={type === 'password' && !show ? 'password' : 'text'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            'w-full rounded-xl border bg-surface-2/80 py-3 pr-11 pl-10.5 text-sm text-ink outline-none transition-all duration-300',
            'placeholder:text-ink-soft/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
            error
              ? 'border-rose-500/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]'
              : 'border-line hover:border-white/10 focus:border-brand-400/70 focus:bg-surface-2 focus:shadow-[0_0_0_4px_rgba(227,6,19,0.13),inset_0_1px_0_0_rgba(255,255,255,0.06)]',
          )}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted transition-all duration-200 hover:bg-surface-3/80 hover:text-ink active:scale-90"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      <p
        className={cn(
          'mt-1.5 min-h-4 text-[11px] font-medium transition-opacity duration-300',
          error ? 'text-rose-400' : 'opacity-0',
        )}
      >
        {error || '·'}
      </p>
    </div>
  );
}
