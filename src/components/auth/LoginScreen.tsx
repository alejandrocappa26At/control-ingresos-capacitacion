'use client';

import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Utilidades (deterministas para SSR)                                */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EASE = [0.16, 1, 0.3, 1] as const;

const BRAND_GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 55%, #1d4ed8 100%)';

/* ------------------------------------------------------------------ */
/* Logo corporativo                                                    */
/* ------------------------------------------------------------------ */

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims =
    size === 'sm' ? 'size-10 rounded-xl' : size === 'md' ? 'size-13 rounded-2xl' : 'size-16 rounded-2xl';

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: -2 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-[0_12px_32px_-10px_rgba(220,38,38,0.4)]',
        dims,
      )}
    >
      <div className="absolute inset-0" style={{ background: BRAND_GRADIENT }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.22] via-transparent to-black/15" />
      <svg viewBox="0 0 48 48" className="relative size-[62%]">
        <defs>
          <radialGradient id="login-logo-glow" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="15" fill="none" stroke="url(#login-logo-glow)" strokeWidth="2.4" />
        <circle cx="24" cy="24" r="8.5" fill="url(#login-logo-glow)" />
        <circle cx="24" cy="24" r="3.2" fill="#2563eb" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-white ring-2 ring-[#f8fafc]" style={{ boxShadow: '0 0 10px rgba(220,38,38,0.5)' }} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Fondo dinámico: aurora azul + grilla + partículas                   */
/* ------------------------------------------------------------------ */

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
  return Array.from({ length: 48 }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    size: 1.4 + rand() * 2.4,
    opacity: 0.12 + rand() * 0.4,
    duration: 10 + rand() * 12,
    delay: rand() * 12,
    drift: (rand() * 2 - 1) * 60,
  }));
}

function LoginBackground() {
  const particles = buildParticles();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base */}
      <div className="absolute inset-0 bg-[#f8fafc]" />

      {/* Aurora azul blobs */}
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
          background: 'radial-gradient(circle at 40% 60%, rgba(30,64,175,0.12), transparent 62%)',
          filter: 'blur(110px)',
          animation: 'aurora-drift 38s ease-in-out infinite alternate',
        }}
      />

      {/* Riel de luz superior azul */}
      <div
        className="absolute top-0 left-1/2 h-[440px] w-[960px] -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.12), rgba(220,38,38,0.05) 45%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'glow-pulse 6s ease-in-out infinite',
        }}
      />

      {/* Grilla tecnológica con máscara */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(100,116,139,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.14) 1px, transparent 1px)',
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
              '--p-x': `${p.drift}px`,
              '--p-opacity': p.opacity,
              animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
              background: i % 7 === 0 ? 'rgba(220,38,38,0.7)' : 'rgba(100,116,139,0.5)',
              boxShadow: i % 7 === 0 ? '0 0 8px rgba(220,38,38,0.35)' : '0 0 8px rgba(100,116,139,0.25)',
            } as CSSProperties
          }
        />
      ))}

      {/* Viñeta suave para dar profundidad */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(148,163,184,0.12)_100%)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mockup: tablero de KPIs (solo visual)                              */
/* ------------------------------------------------------------------ */

const MOCK_STATS: Array<{ label: string; value: string; dot: string; tone: string }> = [
  { label: 'Ingresos', value: '3572', dot: 'bg-brand-500', tone: 'text-blue-600' },
  { label: 'Aprobados', value: '2795', dot: 'bg-emerald-500', tone: 'text-emerald-600' },
  { label: 'No pasan', value: '739', dot: 'bg-rose-500', tone: 'text-rose-600' },
  { label: 'En cap.', value: '38', dot: 'bg-amber-500', tone: 'text-amber-600' },
];

function SparklineArea() {
  const points = [0.34, 0.52, 0.44, 0.6, 0.5, 0.68, 0.58, 0.74, 0.66, 0.8, 0.72, 0.88, 0.82];
  const w = 300;
  const h = 90;
  const step = w / (points.length - 1);
  const line = points.map((v, i) => `${i * step},${h - v * (h - 12) - 6}`).join(' ');
  const area = `${line} ${w},${h} 0,${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="login-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(220,38,38,0.35)" />
          <stop offset="100%" stopColor="rgba(220,38,38,0)" />
        </linearGradient>
        <linearGradient id="login-spark-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#login-spark-fill)" />
      <polyline
        points={line}
        fill="none"
        stroke="url(#login-spark-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(220,38,38,0.35))' }}
      />
      <circle
        cx={step * (points.length - 1)}
        cy={h - points[points.length - 1] * (h - 12) - 6}
        r="3.5"
        fill="#2563eb"
        style={{ filter: 'drop-shadow(0 2px 5px rgba(220,38,38,0.5))' }}
      />
    </svg>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="size-14">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="url(#login-donut-stroke)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform="rotate(-90 32 32)"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(220,38,38,0.35))' }}
      />
      <defs>
        <linearGradient id="login-donut-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <text x="32" y="34" textAnchor="middle" className="fill-[#111827] text-[11px] font-bold" style={{ fontFamily: 'inherit' }}>
        {pct}%
      </text>
    </svg>
  );
}

function DashboardMock() {
  return (
    <div className="relative w-full rounded-2xl border border-line bg-white/95 p-5 shadow-card backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: BRAND_GRADIENT, boxShadow: '0 4px 14px -4px rgba(220,38,38,0.5)' }}>
            <Activity className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink">Resumen general</p>
            <p className="text-[10px] text-ink-soft">Panel ejecutivo</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          <span className="size-1.5 animate-pulse-glow rounded-full bg-emerald-500" /> Hoy
        </span>
      </div>

      <div className="mt-4">
        <SparklineArea />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {MOCK_STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-slate-50 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-glow-sm">
            <p className={cn('text-base font-bold tabular-nums', s.tone)}>{s.value}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-ink-soft">
              <span className={cn('size-1 rounded-full', s.dot)} />
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta flotante                                                    */
/* ------------------------------------------------------------------ */

function FloatCard({
  className,
  delay,
  floatDelay,
  children,
}: {
  className?: string;
  delay: number;
  floatDelay: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, delay: Number(floatDelay), repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl border border-line bg-white/95 p-3.5 shadow-card backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel de marca (izquierda, 60%)                                    */
/* ------------------------------------------------------------------ */

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-center px-12 py-12 lg:flex xl:px-20">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex items-center gap-3.5"
      >
        <BrandMark size="md" />
        <div>
          <p className="text-sm font-bold tracking-tight text-ink">Total Capacitación</p>
          <p className="text-[11px] font-medium text-ink-soft">Plataforma analítica</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
        className="mt-10 max-w-xl"
      >
        <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight text-ink xl:text-5xl">
          CONTROL DE
          <span className="block gradient-text text-glow">INGRESOS Y CAPACITACIÓN</span>
        </h1>
        <p className="mt-4 flex items-center gap-2 text-base font-medium text-ink-muted xl:text-lg">
          <Sparkles className="size-4 text-brand-500" />
          Plataforma Inteligente de Seguimiento y Análisis
        </p>
      </motion.div>

      {/* Zona mockup */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
        className="relative mt-14 h-[340px] max-w-xl"
      >
        <div className="absolute -top-10 -left-8 size-40 rounded-full bg-brand-500/15 blur-3xl" />

        <DashboardMock />

        <FloatCard delay={0.55} floatDelay="0.6" className="-right-6 -top-8">
          <div className="flex items-center gap-3">
            <Donut pct={78} />
            <div>
              <p className="text-xs font-bold text-ink">Aprobación</p>
              <p className="text-[10px] text-ink-soft">Índice de pase a operaciones</p>
            </div>
          </div>
        </FloatCard>

        <FloatCard delay={0.7} floatDelay="1.8" className="bottom-2 -left-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-600">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">Sincronizado</p>
              <p className="text-[10px] text-ink-soft">Última carga · hace 4 min</p>
            </div>
          </div>
        </FloatCard>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mt-10 flex items-center gap-2 text-[11px] font-medium text-ink-muted"
      >
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Acceso restringido · Sistema corporativo interno
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulario (derecha, 40%)                                          */
/* ------------------------------------------------------------------ */

function Field({
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
            error ? 'text-rose-500' : value ? 'text-brand-500' : 'text-ink-soft group-focus-within:text-brand-500',
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
            'w-full rounded-xl border bg-surface-2 py-3 pr-11 pl-10.5 text-sm text-ink transition-all duration-300 outline-none',
            'placeholder:text-ink-soft/60',
            error
              ? 'border-rose-500/60 shadow-[0_0_0_4px_rgba(244,63,94,0.1)]'
              : 'border-line focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.1)]',
          )}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      <p className={cn('mt-1.5 min-h-4 text-[11px] font-medium transition-opacity duration-300', error ? 'text-rose-600' : 'opacity-0')}>
        {error || '·'}
      </p>
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const controls = useAnimationControls();

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ user?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ user?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Intencionalmente vacío: logs de credenciales eliminados por seguridad.
  }, []);

  const shake = () => {
    controls.start({ x: [0, -12, 12, -8, 8, -4, 0], transition: { duration: 0.45, ease: 'easeInOut' } });
  };

  const handleSubmit = (e: FormEvent) => {
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
    const ok = useSessionStore.getState().login(user, password);
    setSubmitting(false);
    if (!ok) {
      setErrors({ user: 'Credenciales incorrectas', password: 'Credenciales incorrectas' });
      toast.error('No se pudo iniciar sesión', {
        description: 'El usuario o la contraseña no son válidos. Reintente.',
      });
      shake();
      return;
    }
    toast.success('Bienvenido, ' + user.trim(), { description: 'Sesión iniciada correctamente.' });
    router.push('/');
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f8fafc] text-ink">
      <LoginBackground />

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-[1500px] lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <BrandPanel />

        {/* Panel derecho */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-8 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="w-full max-w-md"
          >
            <motion.div
              animate={controls}
              className="gradient-border-card relative rounded-3xl bg-white p-8 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.25)] sm:p-10"
            >
              {/* Halo decorativo azul del card */}
              <div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-70"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(220,38,38,0.12), transparent 25%, transparent 72%, rgba(220,38,38,0.08))',
                  maskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black, transparent 70%)',
                }}
              />

              {/* Logo móvil / compacto */}
              <div className="flex items-center gap-3 lg:hidden">
                <BrandMark size="sm" />
                <div>
                  <p className="text-sm font-bold tracking-tight text-ink">Total Capacitación</p>
                  <p className="text-[11px] text-ink-soft">Control de Ingresos</p>
                </div>
              </div>

              <div className="mt-6 lg:mt-0">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                  className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-brand-600 uppercase"
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
                  Ingrese sus credenciales para acceder a la plataforma.
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
                      submitting && 'cursor-wait',
                    )}
                    style={{
                      background: 'linear-gradient(120deg, #dc2626, #ef4444 40%, #b91c1c 72%, #dc2626)',
                      backgroundSize: '260% 260%',
                      animation: 'login-gradient 7s linear infinite',
                      boxShadow: '0 16px 36px -12px rgba(220,38,38,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset',
                      transition: 'box-shadow 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 22px 48px -10px rgba(220,38,38,0.7), 0 0 24px -6px rgba(220,38,38,0.4), 0 0 0 1px rgba(255,255,255,0.18) inset';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 16px 36px -12px rgba(220,38,38,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset';
                    }}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-50" />
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
                Uso interno · Solo personal autorizado
              </motion.div>
            </motion.div>

            {/* Decoración bajo el card: iconos esquina */}
            <div className="pointer-events-none mt-6 hidden items-center justify-center gap-6 text-slate-300 sm:flex" aria-hidden>
              <CheckCircle2 className="size-4" />
              <Hourglass className="size-4" />
              <XCircle className="size-4" />
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}