import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath, cn } from '@/lib/utils';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoField } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import s from './RegisterPage.module.css';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'auth.register.errUsernameMin')
      .max(30, 'auth.register.errUsernameMax')
      .regex(/^[a-zA-Z0-9_]+$/, 'auth.register.errUsernameRegex'),
    email: z.string().email('auth.register.errEmail'),
    password: z.string().min(8, 'auth.register.errPasswordMin'),
    confirmPassword: z.string(),
    role: z.enum(['PLAYER', 'GAME_MASTER']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.register.errPasswordMatch',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function FieldError({ message }: { message?: string }) {
  const t = useT();
  if (!message) return null;
  return (
    <div className={s.fieldError}>
      <Rune kind="flame" size={11} color="var(--ember)" />
      <span className="ao-italic">{t(message)}</span>
    </div>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? t('auth.hidePassword') : t('auth.showPassword')}
      title={shown ? t('auth.hidePassword') : t('auth.showPassword')}
      className={cn(s.pwToggle, shown && s.on)}
    >
      <Rune kind={shown ? 'eye-off' : 'eye'} size={14} />
    </button>
  );
}

export default function RegisterPage() {
  const registerMutation = useRegister();
  const { isAuthenticated, user } = useAuthStore();
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          <div className={cn('ao-codex', s.heroEyebrow)}>{t('auth.register.inscriptio')}</div>
          <div className={cn('ao-h2', s.heroTitle)}>{t('auth.register.heroTitle')}</div>
          <p className={cn('ao-italic', s.heroText)}>
            {t('auth.register.heroText')}
          </p>

          <OrdoDivider glyph="diamond-fill">{t('auth.register.riteOfEnrolment')}</OrdoDivider>

          <div className={s.statRow}>
            {[
              { label: t('auth.register.statHands'), value: '2,118' },
              { label: t('auth.register.statChroniclers'), value: '284' },
              { label: t('auth.register.statNames'), value: '61' },
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

      {/* ── RIGHT — registration form ─────────────────── */}
      <div className={cn('ao-scroll auth-form-side', s.formSideScroll)}>
        <div className={s.formWrap}>
          <OrdoPanel frame padding={32} className={s.rel}>
            <div className={s.sealHead}>
              <Rune kind="diamond" size={18} color="var(--gold)" />
              <div className={cn('ao-engraved', s.sealTitle)}>{t('auth.register.riteTitle')}</div>
              <div className={cn('ao-italic', s.sealSub)}>{t('auth.register.riteSub')}</div>
            </div>

            <OrdoDivider glyph="diamond-fill" />

            <form
              onSubmit={handleSubmit(onSubmit)}
              className={s.form}
            >
              {/* Username */}
              <div>
                <OrdoField label={t('auth.register.chosenName')} required hint={!errors.username ? t('auth.register.chosenNameHint') : undefined}>
                  <input
                    className={cn('ao-input', errors.username && s.inputError)}
                    {...register('username')}
                  />
                </OrdoField>
                <FieldError message={errors.username?.message} />
              </div>

              {/* Email */}
              <OrdoField label={t('auth.register.sigilAddress')} required>
                <input className="ao-input" type="email" {...register('email')} />
                <FieldError message={errors.email?.message} />
              </OrdoField>

              {/* Passwords side by side */}
              <div className={cn('ao-rgrid', s.pwGrid)}>
                <OrdoField label={t('auth.register.cipherWord')} required hint={t('auth.register.cipherHint')}>
                  <div className={s.rel}>
                    <input className={cn('ao-input', s.pwInput)} type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="••••••••" />
                    <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                  <FieldError message={errors.password?.message} />
                </OrdoField>
                <OrdoField label={t('auth.register.repeatCipher')} required>
                  <div className={s.rel}>
                    <input className={cn('ao-input', s.pwInput)} type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} placeholder="••••••••" />
                    <PasswordToggle shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
                  </div>
                  <FieldError message={errors.confirmPassword?.message} />
                </OrdoField>
              </div>

              <OrdoDivider glyph="cross-pat">{t('auth.register.chooseOffice')}</OrdoDivider>

              {/* Role selection — ChoiceCard style */}
              <div className={s.roleRow}>
                {/* Player */}
                <button
                  type="button"
                  onClick={() => setValue('role', 'PLAYER', { shouldValidate: true })}
                  className={cn(s.roleCard, selectedRole === 'PLAYER' && s.activeGold)}
                >
                  <div className="ao-row ao-between">
                    <span className={cn(s.roleIcon, selectedRole === 'PLAYER' && s.activeGold)}>
                      <Rune kind="shield" size={22} color={selectedRole === 'PLAYER' ? 'var(--gold)' : 'var(--ink-quiet)'} />
                    </span>
                    <span className={cn(s.roleCheck, selectedRole === 'PLAYER' && s.activeGold)}>
                      {selectedRole === 'PLAYER' && <Rune kind="check" size={10} color="var(--abyss)" />}
                    </span>
                  </div>
                  <div>
                    <div className={cn('ao-h6', s.roleTitle, selectedRole === 'PLAYER' && s.on)}>{t('auth.register.player')}</div>
                    <div className={cn('ao-italic', s.roleDesc)}>{t('auth.register.playerDesc')}</div>
                  </div>
                </button>

                {/* Game Master */}
                <button
                  type="button"
                  onClick={() => setValue('role', 'GAME_MASTER', { shouldValidate: true })}
                  className={cn(s.roleCard, selectedRole === 'GAME_MASTER' && s.activeArcane)}
                >
                  <div className="ao-row ao-between">
                    <span className={cn(s.roleIcon, selectedRole === 'GAME_MASTER' && s.activeArcane)}>
                      <Rune kind="helm" size={22} color={selectedRole === 'GAME_MASTER' ? 'var(--arcane)' : 'var(--ink-quiet)'} />
                    </span>
                    <span className={cn(s.roleCheck, selectedRole === 'GAME_MASTER' && s.activeArcane)}>
                      {selectedRole === 'GAME_MASTER' && <Rune kind="check" size={10} color="var(--abyss)" />}
                    </span>
                  </div>
                  <div>
                    <div className={cn('ao-h6', s.roleTitle, selectedRole === 'GAME_MASTER' && s.on)}>{t('auth.register.gm')}</div>
                    <div className={cn('ao-italic', s.roleDesc)}>{t('auth.register.gmDesc')}</div>
                  </div>
                </button>
              </div>

              <button
                type="submit"
                className={cn('ao-btn ao-btn--primary ao-btn--lg ao-btn--block', s.mt4)}
                disabled={registerMutation.isPending}
              >
                <Rune kind="diamond-fill" size={9} />
                {registerMutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
              </button>
            </form>

            <div className={s.loginPrompt}>
              <span className={cn('ao-codex', s.inkQuiet)}>{t('auth.register.already')}</span>
              <Link to="/login" className={cn('ao-codex', s.enterLink)}>{t('auth.register.enterVigil')}</Link>
            </div>
          </OrdoPanel>

          <div className={s.footer}>
            <span className="ao-codex">{t('auth.register.charter')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
