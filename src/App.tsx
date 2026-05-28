import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';

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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--panel)',
            color: 'var(--ink)',
            border: '1px solid var(--rule-strong)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--t-small)',
          },
          success: {
            style: {
              borderLeft: '2px solid var(--gold)',
            },
            iconTheme: {
              primary: '#b08d4e',
              secondary: '#1c1816',
            },
          },
          error: {
            style: {
              borderLeft: '2px solid var(--ember)',
            },
            iconTheme: {
              primary: '#b3461a',
              secondary: '#e6dcc4',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
