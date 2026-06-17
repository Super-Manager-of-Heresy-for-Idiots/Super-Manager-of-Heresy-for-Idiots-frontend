import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import { Rune, Sigil, OrdoDivider, OrdoPanel } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { cn } from '@/lib/utils';
import s from './LoginPage.module.css';

const loginSchema = z.object({
  username: z.string().min(1, 'auth.login.errUsername'),
  password: z.string().min(1, 'auth.login.errPassword'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const { isAuthenticated, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  // `?add=1` lets an already-authenticated user reach the login form to add
  // another account to the quick-switch list instead of being redirected away.
  const addingAccount = searchParams.get('add') === '1';
  const t = useT();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated && user && !addingAccount) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ ...data, remember });
  };

  return (
    <div className="auth-split">
      {/* Language switcher — fixed top-right, visible on desktop & mobile */}
      <div className="auth-lang">
        <LanguageSwitcher />
      </div>

      {/* ── LEFT — atmospheric panel ──────────────────── */}
      <div className="auth-hero">
        {/* Radial glow */}
        <div className={s.heroGlow} />
        {/* Horizontal line pattern */}
        <div className={s.heroLines} />

        {/* Top — branding */}
        <div className={cn('ao-row ao-gap-14', s.rel)}>
          <Sigil size={48} glyph="sigil-3" />
          <div>
            <div className={cn('ao-engraved', s.brandName)}>{t('app.name')}</div>
            <div className="ao-codex">{t('auth.brandSub')}</div>
          </div>
        </div>

        {/* Middle — hero text */}
        <div className={s.rel}>
          <div className={cn('ao-codex', s.heroEyebrow)}>{t('auth.login.sacramentum')}</div>
          <div className={cn('ao-h2', s.heroTitle)}>{t('auth.login.heroTitle')}</div>
          <p className={cn('ao-italic', s.heroText)}>
            {t('auth.login.heroText')}
          </p>

          <OrdoDivider glyph="diamond-fill">{t('auth.login.sealOfEntry')}</OrdoDivider>

          <div className={s.statRow}>
            {[
              { label: t('auth.login.statChapters'), value: '148' },
              { label: t('auth.login.statSouls'), value: '3,402' },
              { label: t('auth.login.statVigil'), value: '912 d' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="ao-overline">{stat.label}</div>
                <div className={cn('ao-h4 ao-num', s.statNum)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — version */}
        <div className={s.versionRow}>
          <div className="ao-codex">{t('auth.cohort')}</div>
          <div className="ao-codex">{t('auth.version')}</div>
        </div>
      </div>

      {/* ── RIGHT — sign-in panel ─────────────────────── */}
      <div className="auth-form-side">
        <div className={s.formWrap}>
          <OrdoPanel frame padding={36} className={s.rel}>
            {/* Top rune */}
            <div className={s.sealHead}>
              <Rune kind="diamond" size={18} color="var(--gold)" />
              <div className={cn('ao-engraved ao-flicker', s.sealTitle)}>{t('auth.login.presentSeal')}</div>
              <div className={cn('ao-italic', s.sealSub)}>{t('auth.login.awaits')}</div>
            </div>

            <OrdoDivider glyph="diamond-fill" />

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className={s.form}
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
                  <span className={s.errLine}>
                    <Rune kind="flame" size={11} color="var(--ember)" />
                    {t(errors.username.message ?? '')}
                  </span>
                )}
              </div>

              <div>
                <div className="ao-row-baseline ao-between">
                  <label className="ao-label">{t('auth.login.cipherWord')}</label>
                  <a className={cn('ao-codex', s.recoverLink)}>{t('auth.login.recover')}</a>
                </div>
                <div className={s.rel}>
                  <input
                    className={cn('ao-input', s.pwInput)}
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className={cn(s.pwToggle, showPassword && s.on)}
                  >
                    <Rune kind={showPassword ? 'eye-off' : 'eye'} size={14} />
                  </button>
                </div>
                {errors.password && (
                  <span className={s.errLine}>
                    <Rune kind="flame" size={11} color="var(--ember)" />
                    {t(errors.password.message ?? '')}
                  </span>
                )}
              </div>

              {/* Remember me */}
              <div className={s.rememberRow}>
                <span
                  onClick={() => setRemember(!remember)}
                  className={cn(s.checkbox, remember && s.on)}
                >
                  {remember && <Rune kind="check" size={10} color="var(--abyss)" />}
                </span>
                <span className={cn('ao-italic', s.pointer)} onClick={() => setRemember(!remember)}>
                  {t('auth.login.remember')}
                </span>
              </div>

              {/* Primary submit */}
              <button
                type="submit"
                className={cn('ao-btn ao-btn--primary ao-btn--lg ao-btn--block', s.mt4)}
                disabled={loginMutation.isPending}
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
              className={cn('ao-btn ao-btn--ghost ao-btn--block', s.inviteLink)}
            >
              <Rune kind="scroll" size={12} />
              {t('auth.login.acceptInvite')}
            </Link>
          </OrdoPanel>

          <div className={s.footer}>
            <span className="ao-codex">{t('auth.login.footer')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
