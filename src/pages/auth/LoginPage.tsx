import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoField } from '@/components/ordo';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [remember, setRemember] = useState(false);
  const loginMutation = useLogin();
  const { isAuthenticated, user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated && user) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ ...data, remember });
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
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(176, 141, 78, 0.08) 0%, transparent 70%), var(--abyss)',
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
            <Sigil size={72} glyph="sigil-1" color="var(--gold)" />
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
            <span className="ao-codex" style={{ color: 'var(--gold-deep)' }}>
              &mdash; SACRAMENTUM &mdash;
            </span>
            <h2
              className="ao-h4"
              style={{ color: 'var(--ink-bright)', margin: 0 }}
            >
              The Chronicler&rsquo;s Vigil
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
              Within these walls, heroes are forged, legends inscribed, and the
              eternal chronicle marches on.
            </p>
          </div>

          {/* Diamond divider */}
          <OrdoDivider glyph="diamond" color="var(--gold-deep)">
            SEAL OF ENTRY
          </OrdoDivider>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24, width: '100%' }}>
            {[
              { label: 'Chapters', value: '148' },
              { label: 'Souls Recorded', value: '3,402' },
              { label: 'Vigil Continues', value: '912 d' },
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
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <OrdoPanel frame raised padding={36}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              {/* Top rune */}
              <Rune kind="diamond" size={20} color="var(--gold)" />

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
                  Present Thy Seal
                </h2>
                <p
                  className="ao-italic"
                  style={{
                    fontSize: 'var(--t-small)',
                    color: 'var(--ink-quiet)',
                    marginTop: 8,
                  }}
                >
                  The Archive awaits authorisation
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
                  gap: 20,
                }}
              >
                <OrdoField label="Sigil Address" required>
                  <input
                    className="ao-input"
                    {...register('username')}
                    placeholder="Thy chosen name..."
                    autoComplete="username"
                  />
                  {errors.username && (
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
                      {errors.username.message}
                    </span>
                  )}
                </OrdoField>

                <OrdoField label="Cipher Word" required>
                  <input
                    className="ao-input"
                    type="password"
                    {...register('password')}
                    placeholder="Thy secret ward..."
                    autoComplete="current-password"
                  />
                  {errors.password && (
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
                      {errors.password.message}
                    </span>
                  )}
                </OrdoField>

                {/* Remember me */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{
                      accentColor: 'var(--gold)',
                    }}
                  />
                  <span
                    className="ao-italic"
                    style={{ fontSize: 'var(--t-small)', color: 'var(--ink-quiet)' }}
                  >
                    Bind this Hand to my Sigil
                  </span>
                </label>

                {/* Primary submit */}
                <button
                  type="submit"
                  className="ao-btn ao-btn--primary ao-btn--block ao-btn--lg"
                  disabled={loginMutation.isPending}
                  style={{ marginTop: 8 }}
                >
                  {loginMutation.isPending ? (
                    <Rune kind="cir-dot" size={14} color="var(--ink-bright)" />
                  ) : (
                    <Rune kind="lock" size={14} />
                  )}
                  {loginMutation.isPending ? 'Unsealing...' : 'Enter the Archive'}
                </button>
              </form>

              {/* OR divider */}
              <OrdoDivider glyph="cross" color="var(--ink-ghost)">
                OR
              </OrdoDivider>

              {/* Accept Invitation ghost button */}
              <Link
                to="/teams/join"
                className="ao-btn ao-btn--ghost ao-btn--block"
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                <Rune kind="scroll" size={14} />
                Accept Invitation
              </Link>

              {/* Register link */}
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <span
                  className="ao-italic"
                  style={{ fontSize: 'var(--t-small)', color: 'var(--ink-faint)' }}
                >
                  Not yet inscribed?{' '}
                </span>
                <Link
                  to="/register"
                  style={{
                    color: 'var(--gold)',
                    fontSize: 'var(--t-small)',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    textDecoration: 'none',
                  }}
                >
                  Rite of Inscription &rarr;
                </Link>
              </div>

              {/* Bottom codex */}
              <span
                className="ao-codex"
                style={{ color: 'var(--ink-ghost)', marginTop: 8 }}
              >
                Inscribed by the Ordo
              </span>
            </div>
          </OrdoPanel>
        </div>
      </div>
    </div>
  );
}
