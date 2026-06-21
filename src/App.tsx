import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { I18nProvider } from './i18n/I18nProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <I18nProvider>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
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
