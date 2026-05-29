import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoField } from '@/components/ordo';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['PLAYER', 'GAME_MASTER']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span
      style={{
        fontSize: 'var(--t-micro)',
        color: 'var(--ember)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Rune kind="flame" size={11} color="var(--ember)" />
      {message}
    </span>
  );
}

export default function RegisterPage() {
  const registerMutation = useRegister();
  const { isAuthenticated, user } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'PLAYER' },
  });

  const selectedRole = watch('role');

  if (isAuthenticated && user) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      { username: data.username, email: data.email, password: data.password, role: data.role },
      {
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          const fields = axiosError.response?.data?.fields;
          if (fields) {
            Object.entries(fields).forEach(([field, message]) => {
              setError(field as keyof RegisterFormData, { message });
            });
          }
        },
      }
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--void)' }}>
      {/* ── LEFT PANEL (55%) ──────────────────────────── */}
      <div
        style={{
          width: '55%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 48,
        }}
      >
        {/* Atmospheric background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(90, 142, 148, 0.06) 0%, transparent 70%), var(--abyss)',
          }}
        />
        {/* Horizontal line pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(176, 141, 78, 0.3) 3px, rgba(176, 141, 78, 0.3) 4px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            maxWidth: 420,
          }}
        >
          {/* Branding */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Sigil size={72} glyph="sigil-2" color="var(--arcane)" />
            <h1
              className="ao-engraved"
              style={{
                fontSize: 'var(--t-h5)',
                color: 'var(--gold-pale)',
                marginTop: 8,
              }}
            >
              Ordo Arcanum
            </h1>
          </div>

          {/* Center text */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="ao-codex" style={{ color: 'var(--arcane)' }}>
              &mdash; INSCRIPTIO NOVA &mdash;
            </span>
            <h2
              className="ao-h4"
              style={{ color: 'var(--ink-bright)', margin: 0 }}
            >
              Inscribe Thy Name
            </h2>
            <p
              className="ao-italic"
              style={{
                fontSize: 'var(--t-body)',
                color: 'var(--ink-quiet)',
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              A new chronicle begins with a single name. Step forth and claim thy
              place among the Ordo.
            </p>
          </div>

          {/* Diamond divider */}
          <OrdoDivider glyph="diamond" color="var(--arcane-deep)">
            RITE OF INSCRIPTION
          </OrdoDivider>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24, width: '100%' }}>
            {[
              { label: 'Hands Sworn', value: '2,841' },
              { label: 'Chroniclers', value: '187' },
              { label: 'Names This Moon', value: '64' },
            ].map((stat) => (
              <div key={stat.label} className="ao-stat" style={{ flex: 1 }}>
                <span className="ao-stat-label">{stat.label}</span>
                <span
                  className="ao-stat-value"
                  style={{ fontSize: 24, marginTop: 4 }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom version info */}
          <div
            className="ao-codex"
            style={{ textAlign: 'center', color: 'var(--ink-ghost)', marginTop: 16 }}
          >
            v0.9.4 &middot; Cohort Sanguine &middot; Est. MMXXIV
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (45%) ─────────────────────────── */}
      <div
        style={{
          width: '45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          background:
            'linear-gradient(180deg, var(--stone) 0%, var(--abyss) 100%)',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <OrdoPanel frame raised padding={36}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              {/* Top rune */}
              <Rune kind="sigil-2" size={22} color="var(--arcane)" />

              {/* Title */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  className="ao-engraved"
                  style={{
                    fontSize: 'var(--t-h6)',
                    color: 'var(--ink-bright)',
                    margin: 0,
                  }}
                >
                  Rite of Inscription
                </h2>
                <p
                  className="ao-italic"
                  style={{
                    fontSize: 'var(--t-small)',
                    color: 'var(--ink-quiet)',
                    marginTop: 8,
                  }}
                >
                  Declare thy name and purpose unto the Archive
                </p>
              </div>

              <OrdoDivider glyph="diamond" color="var(--rule)" />

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}
              >
                {/* Username */}
                <OrdoField label="Chosen Name" required>
                  <input
                    className="ao-input"
                    {...register('username')}
                    placeholder="Thy chosen name..."
                    autoComplete="username"
                  />
                  <FieldError message={errors.username?.message} />
                </OrdoField>

                {/* Email */}
                <OrdoField label="Sigil Address" required>
                  <input
                    className="ao-input"
                    type="email"
                    {...register('email')}
                    placeholder="name@thy-domain.com"
                    autoComplete="email"
                  />
                  <FieldError message={errors.email?.message} />
                </OrdoField>

                {/* Side-by-side passwords */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <OrdoField label="Cipher Word" required>
                      <input
                        className="ao-input"
                        type="password"
                        {...register('password')}
                        placeholder="Secret ward..."
                        autoComplete="new-password"
                      />
                      <FieldError message={errors.password?.message} />
                    </OrdoField>
                  </div>
                  <div style={{ flex: 1 }}>
                    <OrdoField label="Repeat Cipher" required>
                      <input
                        className="ao-input"
                        type="password"
                        {...register('confirmPassword')}
                        placeholder="Confirm ward..."
                        autoComplete="new-password"
                      />
                      <FieldError message={errors.confirmPassword?.message} />
                    </OrdoField>
                  </div>
                </div>

                {/* Role divider */}
                <OrdoDivider glyph="sigil-1" color="var(--gold-deep)">
                  CHOOSE THY OFFICE
                </OrdoDivider>

                {/* Role choice cards */}
                <div style={{ display: 'flex', gap: 14 }}>
                  {/* Player card */}
                  <button
                    type="button"
                    onClick={() => setValue('role', 'PLAYER', { shouldValidate: true })}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 12px',
                      background:
                        selectedRole === 'PLAYER'
                          ? 'rgba(176, 141, 78, 0.08)'
                          : 'var(--abyss)',
                      border:
                        selectedRole === 'PLAYER'
                          ? '1px solid var(--brass)'
                          : '1px solid var(--rule)',
                      color:
                        selectedRole === 'PLAYER'
                          ? 'var(--gold-pale)'
                          : 'var(--ink-faint)',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      boxShadow:
                        selectedRole === 'PLAYER'
                          ? 'var(--glow-gold)'
                          : 'none',
                    }}
                  >
                    <Rune
                      kind="shield"
                      size={24}
                      color={
                        selectedRole === 'PLAYER' ? 'var(--gold-pale)' : 'var(--ink-faint)'
                      }
                    />
                    <span
                      className="ao-engraved"
                      style={{ fontSize: 'var(--t-micro)' }}
                    >
                      Player
                    </span>
                    <span
                      className="ao-italic"
                      style={{
                        fontSize: 11,
                        color:
                          selectedRole === 'PLAYER'
                            ? 'var(--ink-quiet)'
                            : 'var(--ink-ghost)',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      The Hand of Fate &mdash; seek adventure, forge thy legend.
                    </span>
                  </button>

                  {/* Game Master card */}
                  <button
                    type="button"
                    onClick={() => setValue('role', 'GAME_MASTER', { shouldValidate: true })}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 12px',
                      background:
                        selectedRole === 'GAME_MASTER'
                          ? 'rgba(90, 142, 148, 0.08)'
                          : 'var(--abyss)',
                      border:
                        selectedRole === 'GAME_MASTER'
                          ? '1px solid var(--arcane)'
                          : '1px solid var(--rule)',
                      color:
                        selectedRole === 'GAME_MASTER'
                          ? 'var(--arcane)'
                          : 'var(--ink-faint)',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      boxShadow:
                        selectedRole === 'GAME_MASTER'
                          ? 'var(--glow-arcane)'
                          : 'none',
                    }}
                  >
                    <Rune
                      kind="helm"
                      size={24}
                      color={
                        selectedRole === 'GAME_MASTER'
                          ? 'var(--arcane)'
                          : 'var(--ink-faint)'
                      }
                    />
                    <span
                      className="ao-engraved"
                      style={{ fontSize: 'var(--t-micro)' }}
                    >
                      Game Master
                    </span>
                    <span
                      className="ao-italic"
                      style={{
                        fontSize: 11,
                        color:
                          selectedRole === 'GAME_MASTER'
                            ? 'var(--ink-quiet)'
                            : 'var(--ink-ghost)',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      The Chronicler &mdash; weave the tale, command the stage.
                    </span>
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="ao-btn ao-btn--primary ao-btn--block ao-btn--lg"
                  disabled={registerMutation.isPending}
                  style={{ marginTop: 8 }}
                >
                  {registerMutation.isPending ? (
                    <Rune kind="cir-dot" size={14} color="var(--ink-bright)" />
                  ) : (
                    <Rune kind="scroll" size={14} />
                  )}
                  {registerMutation.isPending ? 'Inscribing...' : 'Inscribe My Name'}
                </button>
              </form>

              {/* Login link */}
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <span
                  className="ao-italic"
                  style={{ fontSize: 'var(--t-small)', color: 'var(--ink-faint)' }}
                >
                  Already a member?{' '}
                </span>
                <Link
                  to="/login"
                  style={{
                    color: 'var(--gold)',
                    fontSize: 'var(--t-small)',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    textDecoration: 'none',
                  }}
                >
                  Enter the Vigil &rarr;
                </Link>
              </div>
            </div>
          </OrdoPanel>
        </div>
      </div>
    </div>
  );
}
