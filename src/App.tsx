import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from './i18n/I18nProvider';
import { isRetryableError } from './lib/errors';
import { bootstrapAuth } from './lib/authSession';
import { useAuthStore } from './store/authStore';
import { PageFallback } from './components/layout/PageFallback';
import { BugReportErrorBoundary } from './components/bug-report/BugReportErrorBoundary';

const AppRouter = lazy(() => import('./AppRouter'));

const BugReportWidget = lazy(() =>
  import('./components/bug-report/BugReportWidget').then((m) => ({ default: m.BugReportWidget })),
);

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

function App() {
  // Restore the session from the HttpOnly refresh cookie before the router mounts.
  // Until `authReady` flips, hold a splash so a logged-in user reloading the page
  // doesn't flash the login screen (ProtectedRoute would redirect on the empty
  // in-memory store before /auth/refresh resolves).
  const authReady = useAuthStore((s) => s.authReady);

  useEffect(() => {
    void bootstrapAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BugReportErrorBoundary>
          {authReady ? (
            <Suspense fallback={<PageFallback />}>
              <AppRouter />
            </Suspense>
          ) : (
            <PageFallback />
          )}
        </BugReportErrorBoundary>
        <Suspense fallback={null}>
          <BugReportWidget />
        </Suspense>
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
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
