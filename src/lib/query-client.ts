import { QueryClient } from '@tanstack/react-query';

// Create a client with no caching for always fresh data
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // No caching - always fetch fresh data
      staleTime: 0,
      // No garbage collection time - don't keep data in cache
      gcTime: 0,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Always refetch on focus and reconnect for fresh data
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Always refetch on mount for fresh data
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Performance-optimized query keys
export const queryKeys = {
  // Forum queries
  forum: {
    posts: (page: number, limit: number, categoryId?: string, sortBy?: string) =>
      ['forum', 'posts', page, limit, categoryId, sortBy] as const,
    categories: () => ['forum', 'categories'] as const,
    post: (id: string) => ['forum', 'post', id] as const,
    replies: (postId: string, page: number) => ['forum', 'replies', postId, page] as const,
  },
  // Social queries
  social: {
    posts: (page: number, limit: number, sortBy?: string) =>
      ['social', 'posts', page, limit, sortBy] as const,
    comments: (postId: string) => ['social', 'comments', postId] as const,
    post: (id: string) => ['social', 'post', id] as const,
  },
  // User queries
  users: {
    profile: (username: string) => ['users', 'profile', username] as const,
    stats: (username: string) => ['users', 'stats', username] as const,
    activity: (username: string, tab: string, page: number) =>
      ['users', 'activity', username, tab, page] as const,
  },
  // Leaderboard queries
  leaderboard: (type: string, period: string) => ['leaderboard', type, period] as const,
  // Server queries
  servers: () => ['servers'] as const,
  minecraft: {
    status: (serverId: string) => ['minecraft', 'status', serverId] as const,
  },
} as const;
