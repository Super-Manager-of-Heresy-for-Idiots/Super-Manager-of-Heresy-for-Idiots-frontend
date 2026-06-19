import { useEffect, type ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { I18nProvider } from './i18n/I18nProvider';
import { GlobalLoadingRite } from './components/loading/GlobalLoadingRite';
import { LoadingRite } from './components/loading/LoadingRite';
import { useAuthStore } from './store/authStore';
import { bootstrapAuth } from './lib/authSession';
import { isRetryableError } from './lib/errors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // Не повторять запрос на 4xx (403/404/валидация) — это не изменится и лишь
      // удваивает ожидание; повторяем только серверные сбои (5xx) и обрывы связи.
      retry: (failureCount, error) => isRetryableError(error) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Restores the session from the refresh cookie before the router mounts, so a
 * logged-in user reloading the page doesn't flash the login screen. Holds a
 * full-screen rite until the bootstrap settles.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);

  useEffect(() => {
    void bootstrapAuth();
  }, []);

  if (!authReady) {
    return <LoadingRite variant="fixed" scenario="calm" />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <I18nProvider>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
      <GlobalLoadingRite />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(222 40% 14%)',
            color: 'hsl(38 30% 88%)',
            border: '1px solid hsl(43 30% 25%)',
          },
          success: {
            iconTheme: {
              primary: '#D4AF37',
              secondary: 'hsl(222 40% 14%)',
            },
          },
          error: {
            iconTheme: {
              primary: '#8B0000',
              secondary: 'hsl(38 30% 88%)',
            },
          },
        }}
      />
    </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
