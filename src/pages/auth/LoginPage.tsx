import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Backdrop,
  Panel,
  Sigil,
  Rune,
  Divider,
  Button,
  Input,
  Label,
} from '@/components/ao';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirect } from '@/lib/ao-utils';

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
    return <Navigate to={getRoleRedirect(user.role)} replace />;
  }

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ ...data, remember });
  };

  return (
    <Backdrop>
      {/* Full-screen split: left atmosphere, right form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* ── Left atmospheric panel ── */}
        <div
          className="ao-login-left"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--s-7)',
            borderRight: '1px solid var(--rule)',
            background:
              'radial-gradient(ellipse at 30% 40%, rgba(176,141,78,0.06) 0%, transparent 70%)',
          }}
        >
          <Sigil size={80} />

          <h1
            className="ao-engraved"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--t-h3)',
              color: 'var(--gold)',
              letterSpacing: 'var(--track-eng)',
              marginTop: 'var(--s-5)',
              marginBottom: 'var(--s-3)',
              textAlign: 'center',
            }}
          >
            Ordo Arcanum
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--t-body-lg)',
              fontStyle: 'italic',
              color: 'var(--ink-quiet)',
              textAlign: 'center',
              maxWidth: 320,
              lineHeight: 1.6,
              marginBottom: 'var(--s-6)',
            }}
          >
            &ldquo;Every legend begins with a single entry in the Archive.&rdquo;
          </p>

          <Divider />

          <div
            style={{
              display: 'flex',
              gap: 'var(--s-7)',
              marginTop: 'var(--s-5)',
            }}
          >
            {[
              { label: 'Seekers', value: '1,247' },
              { label: 'Codices', value: '3,891' },
              { label: 'Campaigns', value: '412' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--t-h5)',
                    color: 'var(--gold)',
                    letterSpacing: 'var(--track-wide)',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="ao-overline"
                  style={{
                    color: 'var(--ink-faint)',
                    marginTop: 'var(--s-1)',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right login form ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--s-5)',
          }}
        >
          <Panel frame padding={36} style={{ maxWidth: 400, width: '100%' }}>
            <h2
              className="ao-flicker"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--t-h4)',
                color: 'var(--gold)',
                letterSpacing: 'var(--track-eng)',
                textAlign: 'center',
                marginBottom: 'var(--s-3)',
              }}
            >
              Present Thy Seal
            </h2>

            <Divider />

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ marginTop: 'var(--s-5)' }}
            >
              {/* Username */}
              <div style={{ marginBottom: 'var(--s-4)' }}>
                <Label htmlFor="username">Sigil Address</Label>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="Enter thy sigil address"
                  autoComplete="username"
                  error={errors.username?.message}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 'var(--s-4)' }}>
                <Label htmlFor="password">Cipher Word</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter thy cipher word"
                  autoComplete="current-password"
                  error={errors.password?.message}
                />
              </div>

              {/* Remember me */}
              <label
                htmlFor="remember"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s-2)',
                  cursor: 'pointer',
                  marginBottom: 'var(--s-5)',
                  color: 'var(--ink-quiet)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--t-small)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    border: `1px solid ${remember ? 'var(--gold)' : 'var(--rule)'}`,
                    background: remember
                      ? 'rgba(176,141,78,0.12)'
                      : 'var(--stone)',
                    transition: 'all 0.2s',
                  }}
                >
                  {remember && (
                    <Rune kind="check" size={12} color="var(--gold)" />
                  )}
                </span>
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ display: 'none' }}
                />
                Remember my seal
              </label>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                block
                disabled={loginMutation.isPending}
                icon={
                  loginMutation.isPending ? (
                    <Rune
                      kind="sigil-3"
                      size={16}
                      color="var(--gold)"
                      className="ao-spin"
                    />
                  ) : (
                    <Rune kind="diamond-fill" size={14} color="var(--gold)" />
                  )
                }
              >
                {loginMutation.isPending
                  ? 'Verifying Seal\u2026'
                  : 'Enter the Archive'}
              </Button>
            </form>

            <div
              style={{
                marginTop: 'var(--s-5)',
                textAlign: 'center',
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--t-small)',
                color: 'var(--ink-faint)',
              }}
            >
              Without a writ?{' '}
              <Link
                to="/register"
                style={{
                  color: 'var(--gold)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                Request admission
              </Link>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Mobile: hide left panel, show only form ── */}
      <style>{`
        @media (max-width: 768px) {
          .ao-login-left {
            display: none !important;
          }
          .ao-login-left + div {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 768px) {
          .ao-root > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Backdrop>
  );
}
