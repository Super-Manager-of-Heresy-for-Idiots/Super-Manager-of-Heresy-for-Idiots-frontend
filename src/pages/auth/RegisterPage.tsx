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
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 7, color: '#d8896a', fontSize: 12 }}>
      <Rune kind="flame" size={11} color="var(--ember)" />
      <span className="ao-italic">{message}</span>
    </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', height: '100vh', background: 'var(--void)' }}>
      {/* ── LEFT — atmospheric panel ──────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid var(--rule)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
        }}
      >
        {/* Radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 50% 35%, rgba(176, 141, 78, 0.10), transparent 60%)' }} />
        {/* Horizontal line pattern */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 6px, rgba(176,141,78,0.025) 6px 7px)' }} />

        {/* Top — branding */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Sigil size={48} glyph="sigil-3" />
          <div>
            <div className="ao-engraved" style={{ fontSize: 12, color: 'var(--gold-pale)' }}>Ordo Arcanum</div>
            <div className="ao-codex">Imperial Archive &middot; MMDXLIV</div>
          </div>
        </div>

        {/* Middle — hero text */}
        <div style={{ position: 'relative' }}>
          <div className="ao-codex" style={{ marginBottom: 16, color: 'var(--ink-faint)' }}>&mdash; INSCRIPTIO NOVA &mdash;</div>
          <div className="ao-h2" style={{ fontSize: 56, lineHeight: 1.05, maxWidth: 520 }}>Inscribe Thy Name</div>
          <p className="ao-italic" style={{ fontSize: 20, marginTop: 18, maxWidth: 480, color: 'var(--ink-quiet)' }}>
            No soul enters the Archive unrecorded. Choose thy office, set thy cipher, and be bound to the ledger of the Ordo.
          </p>

          <OrdoDivider glyph="diamond-fill">RITE OF ENROLMENT</OrdoDivider>

          <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
            {[
              { label: 'Hands Sworn', value: '2,118' },
              { label: 'Chroniclers', value: '284' },
              { label: 'Names This Moon', value: '61' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="ao-overline">{stat.label}</div>
                <div className="ao-h4 ao-num" style={{ fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — version */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--ink-faint)' }}>
          <div className="ao-codex">Cohort VII &mdash; Vault of Ash and Brass</div>
          <div className="ao-codex">v &middot; 4.21.3 &mdash; gilded</div>
        </div>
      </div>

      {/* ── RIGHT — registration form ─────────────────── */}
      <div
        className="ao-scroll"
        style={{
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 56px',
          background: 'linear-gradient(180deg, var(--stone), var(--abyss))',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>
          <OrdoPanel frame padding={32} style={{ position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <Rune kind="diamond" size={18} color="var(--gold)" />
              <div className="ao-engraved" style={{ fontSize: 16, marginTop: 12 }}>Rite of Inscription</div>
              <div className="ao-italic" style={{ fontSize: 14, marginTop: 6 }}>Set thy mark upon the rolls</div>
            </div>

            <OrdoDivider glyph="diamond-fill" />

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}
            >
              {/* Username */}
              <div>
                <OrdoField label="Chosen Name" required hint={!errors.username ? '3\u201330 glyphs \u00b7 letters, numerals, underscore' : undefined}>
                  <input
                    className="ao-input"
                    {...register('username')}
                    style={{ borderColor: errors.username ? 'var(--ember)' : undefined, boxShadow: errors.username ? 'inset 0 1px 0 rgba(0,0,0,0.5), 0 0 0 1px rgba(179,70,26,0.25)' : undefined }}
                  />
                </OrdoField>
                <FieldError message={errors.username?.message} />
              </div>

              {/* Email */}
              <OrdoField label="Sigil Address" required>
                <input className="ao-input" type="email" {...register('email')} />
                <FieldError message={errors.email?.message} />
              </OrdoField>

              {/* Passwords side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <OrdoField label="Cipher Word" required hint="min. 8 glyphs">
                  <input className="ao-input" type="password" {...register('password')} placeholder="••••••••" />
                  <FieldError message={errors.password?.message} />
                </OrdoField>
                <OrdoField label="Repeat Cipher" required>
                  <input className="ao-input" type="password" {...register('confirmPassword')} placeholder="••••••••" />
                  <FieldError message={errors.confirmPassword?.message} />
                </OrdoField>
              </div>

              <OrdoDivider glyph="cross-pat">CHOOSE THY OFFICE</OrdoDivider>

              {/* Role selection — ChoiceCard style */}
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Player */}
                <button
                  type="button"
                  onClick={() => setValue('role', 'PLAYER', { shouldValidate: true })}
                  style={{
                    flex: 1, textAlign: 'left', cursor: 'pointer',
                    background: selectedRole === 'PLAYER' ? 'linear-gradient(180deg, rgba(176,141,78,0.08), var(--panel))' : 'linear-gradient(180deg, var(--panel-raised), var(--panel))',
                    border: `1px solid ${selectedRole === 'PLAYER' ? 'var(--gold)' : 'var(--rule)'}`,
                    boxShadow: selectedRole === 'PLAYER' ? 'var(--shadow-inset), 0 0 16px rgba(176,141,78,0.13)' : 'var(--shadow-inset)',
                    padding: 18, display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 180ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ width: 44, height: 44, border: `1px solid ${selectedRole === 'PLAYER' ? 'var(--gold)' : 'var(--rule)'}`, background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selectedRole === 'PLAYER' ? 'inset 0 0 12px rgba(176,141,78,0.2)' : 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
                      <Rune kind="shield" size={22} color={selectedRole === 'PLAYER' ? 'var(--gold)' : 'var(--ink-quiet)'} />
                    </span>
                    <span style={{ width: 18, height: 18, border: `1px solid ${selectedRole === 'PLAYER' ? 'var(--gold)' : 'var(--rule)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedRole === 'PLAYER' ? 'var(--gold)' : 'var(--abyss)' }}>
                      {selectedRole === 'PLAYER' && <Rune kind="check" size={10} color="var(--abyss)" />}
                    </span>
                  </div>
                  <div>
                    <div className="ao-h6" style={{ fontSize: 16, color: selectedRole === 'PLAYER' ? 'var(--ink-bright)' : 'var(--ink)' }}>Player</div>
                    <div className="ao-italic" style={{ fontSize: 13, marginTop: 3, color: 'var(--ink-quiet)' }}>The Hand of Fate &mdash; seek adventure, forge thy legend.</div>
                  </div>
                </button>

                {/* Game Master */}
                <button
                  type="button"
                  onClick={() => setValue('role', 'GAME_MASTER', { shouldValidate: true })}
                  style={{
                    flex: 1, textAlign: 'left', cursor: 'pointer',
                    background: selectedRole === 'GAME_MASTER' ? 'linear-gradient(180deg, rgba(90,142,148,0.08), var(--panel))' : 'linear-gradient(180deg, var(--panel-raised), var(--panel))',
                    border: `1px solid ${selectedRole === 'GAME_MASTER' ? 'var(--arcane)' : 'var(--rule)'}`,
                    boxShadow: selectedRole === 'GAME_MASTER' ? 'var(--shadow-inset), 0 0 16px rgba(90,142,148,0.13)' : 'var(--shadow-inset)',
                    padding: 18, display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 180ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ width: 44, height: 44, border: `1px solid ${selectedRole === 'GAME_MASTER' ? 'var(--arcane)' : 'var(--rule)'}`, background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selectedRole === 'GAME_MASTER' ? 'inset 0 0 12px rgba(90,142,148,0.2)' : 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
                      <Rune kind="helm" size={22} color={selectedRole === 'GAME_MASTER' ? 'var(--arcane)' : 'var(--ink-quiet)'} />
                    </span>
                    <span style={{ width: 18, height: 18, border: `1px solid ${selectedRole === 'GAME_MASTER' ? 'var(--arcane)' : 'var(--rule)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedRole === 'GAME_MASTER' ? 'var(--arcane)' : 'var(--abyss)' }}>
                      {selectedRole === 'GAME_MASTER' && <Rune kind="check" size={10} color="var(--abyss)" />}
                    </span>
                  </div>
                  <div>
                    <div className="ao-h6" style={{ fontSize: 16, color: selectedRole === 'GAME_MASTER' ? 'var(--ink-bright)' : 'var(--ink)' }}>Game Master</div>
                    <div className="ao-italic" style={{ fontSize: 13, marginTop: 3, color: 'var(--ink-quiet)' }}>The Chronicler &mdash; weave the tale, command the stage.</div>
                  </div>
                </button>
              </div>

              <button
                type="submit"
                className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block"
                disabled={registerMutation.isPending}
                style={{ marginTop: 4 }}
              >
                <Rune kind="diamond-fill" size={9} />
                {registerMutation.isPending ? 'Inscribing...' : 'Inscribe My Name'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span className="ao-codex" style={{ color: 'var(--ink-quiet)' }}>Already a member? </span>
              <Link to="/login" className="ao-codex" style={{ color: 'var(--gold-pale)', textDecoration: 'none' }}>Enter the Vigil &rarr;</Link>
            </div>
          </OrdoPanel>

          <div style={{ textAlign: 'center', marginTop: 18, color: 'var(--ink-faint)' }}>
            <span className="ao-codex">By inscribing, thou submit to the Archive Charter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
