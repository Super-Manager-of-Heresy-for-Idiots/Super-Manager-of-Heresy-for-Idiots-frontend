import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dices, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gold/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Dices className="h-12 w-12 text-gold" />
          </div>
          <CardTitle className="text-3xl text-gold">D&D Manager</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="Enter your username"
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-sm text-dnd-red">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-dnd-red">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-gold hover:underline">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
