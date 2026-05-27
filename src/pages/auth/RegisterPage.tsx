import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dices, Loader2, Sword, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gold/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Dices className="h-12 w-12 text-gold" />
          </div>
          <CardTitle className="text-3xl text-gold">Create Account</CardTitle>
          <CardDescription>Join the adventure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'PLAYER', { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    selectedRole === 'PLAYER'
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border hover:border-gold/40'
                  )}
                >
                  <Sword className="h-6 w-6" />
                  <span className="text-sm font-medium">Player</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'GAME_MASTER', { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    selectedRole === 'GAME_MASTER'
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border hover:border-gold/40'
                  )}
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm font-medium">Game Master</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register('username')} placeholder="Choose a username" autoComplete="username" />
              {errors.username && <p className="text-sm text-dnd-red">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="Enter your email" autoComplete="email" />
              {errors.email && <p className="text-sm text-dnd-red">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} placeholder="Choose a password" autoComplete="new-password" />
              {errors.password && <p className="text-sm text-dnd-red">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="Confirm your password" autoComplete="new-password" />
              {errors.confirmPassword && <p className="text-sm text-dnd-red">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-gold hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
