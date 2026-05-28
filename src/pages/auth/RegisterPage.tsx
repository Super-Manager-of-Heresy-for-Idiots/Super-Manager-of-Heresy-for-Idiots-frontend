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
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirect } from '@/lib/ao-utils';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ),
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
    return <Navigate to={getRoleRedirect(user.role)} replace />;
  }

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      },
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
      },
    );
  };

  const roleCards: {
    value: 'PLAYER' | 'GAME_MASTER';
    label: string;
    glyph: string;
    desc: string;
  }[] = [
    {
      value: 'PLAYER',
      label: 'Player',
      glyph: 'shield',
      desc: 'Seeker of quests',
    },
    {
      value: 'GAME_MASTER',
      label: 'Game Master',
      glyph: 'helm',
      desc: 'Keeper of tales',
    },
  ];

  return (
    <Backdrop>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: 'var(--s-5)',
        }}
      >
        <div style={{ maxWidth: 460, width: '100%' }}>
          {/* Sigil header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 'var(--s-5)',
            }}
          >
            <Sigil size={64} />
            <h1
              className="ao-engraved"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--t-h4)',
                color: 'var(--gold)',
                letterSpacing: 'var(--track-eng)',
                marginTop: 'var(--s-4)',
                textAlign: 'center',
              }}
            >
              Writ of Admission
            </h1>
          </div>

          <Panel frame padding={32}>
            {/* Role selection */}
            <div style={{ marginBottom: 'var(--s-5)' }}>
              <Label style={{ marginBottom: 'var(--s-3)', display: 'block' }}>
                Choose thy calling
              </Label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--s-3)',
                }}
              >
                {roleCards.map((rc) => {
                  const active = selectedRole === rc.value;
                  return (
                    <Panel
                      key={rc.value}
                      padding={16}
                      onClick={() =>
                        setValue('role', rc.value, { shouldValidate: true })
                      }
                      style={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: active
                          ? '1.5px solid var(--gold)'
                          : '1px solid var(--rule)',
                        background: active
                          ? 'rgba(176,141,78,0.08)'
                          : 'var(--stone)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Rune
                        kind={rc.glyph}
                        size={28}
                        color={active ? 'var(--gold)' : 'var(--ink-quiet)'}
                      />
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--t-small)',
                          color: active ? 'var(--gold)' : 'var(--ink)',
                          letterSpacing: 'var(--track-wide)',
                          marginTop: 'var(--s-2)',
                        }}
                      >
                        {rc.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 'var(--t-micro)',
                          color: 'var(--ink-faint)',
                          marginTop: 'var(--s-1)',
                        }}
                      >
                        {rc.desc}
                      </div>
                    </Panel>
                  );
                })}
              </div>
            </div>

            <Divider />

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ marginTop: 'var(--s-4)' }}
            >
              {/* Username */}
              <div style={{ marginBottom: 'var(--s-4)' }}>
                <Label htmlFor="username">Chosen Name</Label>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="Choose a name for the Archive"
                  autoComplete="username"
                  error={errors.username?.message}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 'var(--s-4)' }}>
                <Label htmlFor="email">Sigil Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Thy sigil address"
                  autoComplete="email"
                  error={errors.email?.message}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 'var(--s-4)' }}>
                <Label htmlFor="password">Cipher Word</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Choose a cipher word"
                  autoComplete="new-password"
                  error={errors.password?.message}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 'var(--s-5)' }}>
                <Label htmlFor="confirmPassword">Confirm Cipher Word</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Repeat thy cipher word"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                block
                disabled={registerMutation.isPending}
                icon={
                  registerMutation.isPending ? (
                    <Rune
                      kind="sigil-3"
                      size={16}
                      color="var(--gold)"
                      className="ao-spin"
                    />
                  ) : (
                    <Rune kind="scroll" size={16} color="var(--gold)" />
                  )
                }
              >
                {registerMutation.isPending
                  ? 'Inscribing\u2026'
                  : 'Join the Archive'}
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
              Already inscribed?{' '}
              <Link
                to="/login"
                style={{
                  color: 'var(--gold)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                Present thy seal
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </Backdrop>
  );
}
