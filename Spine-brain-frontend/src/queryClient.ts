import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query Client
 * Configured with safe in-memory cache defaults (no persistent browser storage of healthcare data).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      // Ensure no garbage collection caching persists longer than necessary
      gcTime: 5 * 60 * 1000 // 5 minutes in memory
    },
  },
});
