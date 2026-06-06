import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoField } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

const loginSchema = z.object({
  username: z.string().min(1, 'auth.login.errUsername'),
  password: z.string().min(1, 'auth.login.errPassword'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [remember, setRemember] = useState(false);
  const loginMutation = useLogin();
  const { isAuthenticated, user } = useAuthStore();
  const t = useT();

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
    <div className="auth-split" style={{ background: 'var(--void)' }}>
      {/* ── LEFT — atmospheric panel ──────────────────── */}
      <div
        className="auth-hero"
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
            <div className="ao-engraved" style={{ fontSize: 12, color: 'var(--gold-pale)' }}>{t('app.name')}</div>
            <div className="ao-codex">{t('auth.brandSub')}</div>
          </div>
        </div>

        {/* Middle — hero text */}
        <div style={{ position: 'relative' }}>
          <div className="ao-codex" style={{ marginBottom: 16, color: 'var(--ink-faint)' }}>{t('auth.login.sacramentum')}</div>
          <div className="ao-h2" style={{ fontSize: 56, lineHeight: 1.05, maxWidth: 520 }}>{t('auth.login.heroTitle')}</div>
          <p className="ao-italic" style={{ fontSize: 20, marginTop: 18, maxWidth: 480, color: 'var(--ink-quiet)' }}>
            {t('auth.login.heroText')}
          </p>

          <OrdoDivider glyph="diamond-fill">{t('auth.login.sealOfEntry')}</OrdoDivider>

          <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
            {[
              { label: t('auth.login.statChapters'), value: '148' },
              { label: t('auth.login.statSouls'), value: '3,402' },
              { label: t('auth.login.statVigil'), value: '912 d' },
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
          <div className="ao-codex">{t('auth.cohort')}</div>
          <div className="ao-codex">{t('auth.version')}</div>
        </div>
      </div>

      {/* ── RIGHT — sign-in panel ─────────────────────── */}
      <div
        className="auth-form-side"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 56,
          background: 'linear-gradient(180deg, var(--stone), var(--abyss))',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <OrdoPanel frame padding={36} style={{ position: 'relative' }}>
            {/* Top rune */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Rune kind="diamond" size={18} color="var(--gold)" />
              <div className="ao-engraved ao-flicker" style={{ fontSize: 16, marginTop: 14 }}>{t('auth.login.presentSeal')}</div>
              <div className="ao-italic" style={{ fontSize: 14, marginTop: 6 }}>{t('auth.login.awaits')}</div>
            </div>

            <OrdoDivider glyph="diamond-fill" />

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
            >
              <div>
                <label className="ao-label">{t('auth.login.sigilAddress')}</label>
                <input
                  className="ao-input"
                  {...register('username')}
                  placeholder={t('auth.login.sigilPlaceholder')}
                  autoComplete="username"
                />
                {errors.username && (
                  <span style={{ fontSize: 12, color: 'var(--ember)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Rune kind="flame" size={11} color="var(--ember)" />
                    {t(errors.username.message ?? '')}
                  </span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="ao-label">{t('auth.login.cipherWord')}</label>
                  <a className="ao-codex" style={{ cursor: 'pointer', color: 'var(--gold-pale)' }}>{t('auth.login.recover')}</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ao-input"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 40 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
                    <Rune kind="eye" size={14} />
                  </span>
                </div>
                {errors.password && (
                  <span style={{ fontSize: 12, color: 'var(--ember)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Rune kind="flame" size={11} color="var(--ember)" />
                    {t(errors.password.message ?? '')}
                  </span>
                )}
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-quiet)', fontSize: 12 }}>
                <span
                  onClick={() => setRemember(!remember)}
                  style={{
                    width: 14, height: 14,
                    border: `1px solid ${remember ? 'var(--brass)' : 'var(--rule-strong)'}`,
                    background: remember ? 'var(--gold)' : 'var(--abyss)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {remember && <Rune kind="check" size={10} color="var(--abyss)" />}
                </span>
                <span className="ao-italic" style={{ cursor: 'pointer' }} onClick={() => setRemember(!remember)}>
                  {t('auth.login.remember')}
                </span>
              </div>

              {/* Primary submit */}
              <button
                type="submit"
                className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block"
                disabled={loginMutation.isPending}
                style={{ marginTop: 4 }}
              >
                <Rune kind="diamond-fill" size={9} />
                {loginMutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
              </button>
            </form>

            {/* OR divider */}
            <OrdoDivider>{t('auth.login.or')}</OrdoDivider>

            {/* Accept Invitation */}
            <Link
              to="/register"
              className="ao-btn ao-btn--ghost ao-btn--block"
              style={{ textDecoration: 'none', textAlign: 'center', marginTop: 8 }}
            >
              <Rune kind="scroll" size={12} />
              {t('auth.login.acceptInvite')}
            </Link>
          </OrdoPanel>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--ink-faint)' }}>
            <span className="ao-codex">{t('auth.login.footer')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
