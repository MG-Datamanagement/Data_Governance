'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1, // Only retry once on failure to prevent thundering herd
            refetchOnMount: false, // Prevent redundant fetching on component remounts if data is fresh
          },
          mutations: {
            retry: 0, // Do not auto-retry mutations to prevent duplicate non-idempotent writes
          }
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
