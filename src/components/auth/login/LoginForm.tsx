'use client';

import { useState, type FormEvent } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { User, KeyRound, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import { homePath, ROLES } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { Field } from './Field';
import { EASE } from './constants';

/**
 * Tarjeta de autenticación (panel derecho): formulario con validación,
 * feedback de errores, shake al fallar y navegación por rol tras el login.
 */
export function LoginForm() {
  const router = useRouter();
  const controls = useAnimationControls();

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ user?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ user?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);

  const shake = () => {
    controls.start({ x: [0, -12, 12, -8, 8, -4, 0], transition: { duration: 0.45, ease: 'easeInOut' } });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: { user?: string; password?: string } = {};
    if (!user.trim()) nextErrors.user = 'Ingrese su usuario';
    if (!password) nextErrors.password = 'Ingrese su contraseña';
    setTouched({ user: true, password: true });
    setErrors(nextErrors);
    if (nextErrors.user || nextErrors.password) {
      shake();
      return;
    }
    setSubmitting(true);
    const ok = await useSessionStore.getState().login(user, password);
    setSubmitting(false);
    if (!ok) {
      setErrors({ user: 'Credenciales incorrectas', password: 'Credenciales incorrectas' });
      toast.error('No se pudo iniciar sesión', {
        description: 'El usuario o la contraseña no son válidos. Reintente.',
      });
      shake();
      return;
    }
    const sesion = useSessionStore.getState();
    toast.success(`Bienvenido, ${sesion.displayName ?? user.trim()}`, {
      description: sesion.role ? `Rol: ${ROLES[sesion.role].label}` : 'Sesión iniciada correctamente.',
    });
    router.push(sesion.role ? homePath(sesion.role) : '/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative w-full max-w-md"
    >
      {/* Halo de profundidad tras la tarjeta */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.75rem] bg-brand-600/[0.07] blur-2xl"
        aria-hidden
      />

      <motion.div
        animate={controls}
        className="gradient-border-card relative rounded-3xl p-8 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.6)] sm:p-10"
      >
        {/* Halo interior superior */}
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-70"
          style={{
            background:
              'linear-gradient(135deg, rgba(220,38,38,0.12), transparent 25%, transparent 72%, rgba(220,38,38,0.08))',
            maskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black, transparent 70%)',
          }}
        />

        {/* Marca móvil / compacta: mismo logo AT People que el panel izquierdo */}
        <div className="lg:hidden">
          <Image
            src="/logo2at.png"
            alt="AT People"
            width={1536}
            height={1024}
            priority
            className="h-auto w-40 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
          />
        </div>

        <div className="mt-6 lg:mt-0">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-brand-400 uppercase"
          >
            <span className="h-px w-6 bg-gradient-to-r from-brand-500 to-transparent" />
            Acceso corporativo
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            className="mt-2 text-2xl font-extrabold tracking-tight text-ink xl:text-[28px]"
          >
            Bienvenido
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
            className="mt-1.5 text-sm text-ink-muted"
          >
            Ingrese sus credenciales para acceder al panel de control.
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3.5" noValidate>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.4, ease: EASE }}
          >
            <Field
              id="login-user"
              label="Usuario"
              type="text"
              value={user}
              placeholder="Ingrese su usuario"
              icon={<User className="size-[18px]" />}
              error={errors.user}
              autoComplete="username"
              onChange={(v) => {
                setUser(v);
                if (touched.user) setErrors((p) => ({ ...p, user: v.trim() ? undefined : 'Ingrese su usuario' }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, user: true }));
                setErrors((p) => ({ ...p, user: user.trim() ? p.user : 'Ingrese su usuario' }));
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.48, ease: EASE }}
          >
            <Field
              id="login-password"
              label="Contraseña"
              type="password"
              value={password}
              placeholder="Ingrese su contraseña"
              icon={<KeyRound className="size-[18px]" />}
              error={errors.password}
              autoComplete="current-password"
              onChange={(v) => {
                setPassword(v);
                if (touched.password)
                  setErrors((p) => ({ ...p, password: v ? undefined : 'Ingrese su contraseña' }));
              }}
              onBlur={() => {
                setTouched((p) => ({ ...p, password: true }));
                setErrors((p) => ({ ...p, password: password ? p.password : 'Ingrese su contraseña' }));
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.56, ease: EASE }}
            className="pt-2"
          >
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={submitting ? undefined : { scale: 1.02, y: -2 }}
              whileTap={submitting ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={cn(
                'group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold tracking-[0.08em] text-white uppercase',
                'transition-shadow duration-300 hover:shadow-[0_22px_48px_-10px_rgba(227,6,19,0.7),0_0_26px_-6px_rgba(227,6,19,0.45),0_0_0_1px_rgba(255,255,255,0.18)_inset]',
                submitting && 'cursor-wait',
              )}
              style={{
                background: 'linear-gradient(120deg, #e30613, #ff3b47 40%, #c10511 72%, #e30613)',
                backgroundSize: '260% 260%',
                animation: 'login-gradient 7s linear infinite',
                boxShadow: '0 16px 36px -12px rgba(227,6,19,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset',
              }}
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-50" />
              {/* Barrido de luz sutil al pasar el cursor */}
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]" />
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verificando…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-7 flex items-center justify-center gap-1.5 border-t border-line pt-5 text-[11px] font-medium text-ink-muted"
        >
          <ShieldCheck className="size-3.5 text-emerald-500/80" />
          Acceso restringido · Uso exclusivo del personal autorizado
        </motion.div>
      </motion.div>

      {/* Vía de soporte creíble (reemplaza a los iconos decorativos sueltos) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-muted"
      >
        <KeyRound className="size-3.5 text-ink-soft" />
        ¿Problemas para acceder? Contacte al administrador de la plataforma.
      </motion.p>
    </motion.div>
  );
}
