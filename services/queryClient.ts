import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000, // 2 seconds
      gcTime: 4000, // 4 seconds
      refetchOnWindowFocus: true, // Enable for better Safari compatibility
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 2,
      retryDelay: 500,
    },
  },
});