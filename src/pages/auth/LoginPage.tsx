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
    <Backdrop dark>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', height: '100%' }}>
        {/* Left — atmospheric panel */}
        <div
          className="ao-login-left"
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
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 50% 35%, rgba(176, 141, 78, 0.10), transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 6px, rgba(176,141,78,0.025) 6px 7px)' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Sigil size={48} glyph="sigil-3" />
            <div>
              <div className="ao-engraved" style={{ fontSize: 12, color: 'var(--gold-pale)' }}>Ordo Arcanum</div>
              <div className="ao-codex">Imperial Archive · MMDXLIV</div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="ao-codex" style={{ marginBottom: 16, color: 'var(--ink-faint)' }}>— SACRAMENTUM —</div>
            <div className="ao-h2" style={{ fontSize: 56, lineHeight: 1.05, maxWidth: 520 }}>The Chronicler's Vigil</div>
            <p className="ao-italic" style={{ fontSize: 20, marginTop: 18, maxWidth: 480, color: 'var(--ink-quiet)' }}>
              Every blade, every wound, every covenant — recorded in the Hand of the Ordo, sealed against time and ash.
            </p>

            <Divider glyph="diamond-fill">SEAL OF ENTRY</Divider>

            <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
              <div>
                <div className="ao-overline">Chapters</div>
                <div className="ao-h4 ao-num" style={{ fontFamily: 'var(--font-mono)' }}>148</div>
              </div>
              <div style={{ width: 1, background: 'var(--rule)' }} />
              <div>
                <div className="ao-overline">Souls Recorded</div>
                <div className="ao-h4 ao-num" style={{ fontFamily: 'var(--font-mono)' }}>3,402</div>
              </div>
              <div style={{ width: 1, background: 'var(--rule)' }} />
              <div>
                <div className="ao-overline">Vigil Continues</div>
                <div className="ao-h4 ao-num" style={{ fontFamily: 'var(--font-mono)' }}>912 d</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'end', color: 'var(--ink-faint)' }}>
            <div className="ao-codex">Cohort VII — Vault of Ash and Brass</div>
            <div className="ao-codex">v · 4.21.3 — gilded</div>
          </div>
        </div>

        {/* Right — sign-in panel */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 56,
            background: 'linear-gradient(180deg, var(--stone), var(--abyss))',
          }}
        >
          <div style={{ width: '100%', maxWidth: 400 }}>
            <Panel frame padding={36} style={{ position: 'relative' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <Rune kind="diamond" size={18} color="var(--gold)" />
                <div className="ao-engraved ao-flicker" style={{ fontSize: 16, marginTop: 14 }}>
                  Present Thy Seal
                </div>
                <div className="ao-italic" style={{ fontSize: 14, marginTop: 6 }}>
                  The Archive awaits authorisation
                </div>
              </div>

              <Divider glyph="diamond-fill" />

              <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 22 }}>
                <div style={{ marginTop: 0 }}>
                  <Label htmlFor="username">Sigil Address</Label>
                  <Input
                    id="username"
                    {...register('username')}
                    placeholder="Enter thy sigil address"
                    autoComplete="username"
                    error={errors.username?.message}
                  />
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Label htmlFor="password">Cipher Word</Label>
                    <Link
                      to="/recover"
                      className="ao-codex"
                      style={{ color: 'var(--gold-pale)', textDecoration: 'none' }}
                    >
                      recover
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    error={errors.password?.message}
                  />
                </div>

                <label
                  htmlFor="remember"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    marginTop: 14,
                    color: 'var(--ink-quiet)',
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: `1px solid ${remember ? 'var(--gold)' : 'var(--rule-strong)'}`,
                      background: remember ? 'rgba(176,141,78,0.12)' : 'var(--abyss)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {remember && <Rune kind="check" size={10} color="var(--gold)" />}
                  </span>
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  Bind this Hand to my Sigil
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  block
                  disabled={loginMutation.isPending}
                  icon={
                    loginMutation.isPending ? (
                      <Rune kind="sigil-3" size={9} color="var(--gold)" className="ao-spin" />
                    ) : (
                      <Rune kind="diamond-fill" size={9} />
                    )
                  }
                  style={{ marginTop: 22 }}
                >
                  {loginMutation.isPending ? 'Verifying Seal\u2026' : 'Enter the Archive'}
                </Button>
              </form>

              <Divider>OR</Divider>

              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" block icon={<Rune kind="scroll" size={12} />} style={{ marginTop: 8 }}>
                  Accept Invitation
                </Button>
              </Link>
            </Panel>

            <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--ink-faint)' }}>
              <span className="ao-codex">Inscribed by the Ordo · Bound by oath</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ao-login-left { display: none !important; }
          .ao-root > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Backdrop>
  );
}
