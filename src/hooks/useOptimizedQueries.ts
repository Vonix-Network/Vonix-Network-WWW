import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-client';
import { trackApiCall } from '../lib/performance';

// Forum hooks
export function useForumPosts(page = 1, limit = 20, categoryId?: string, sortBy = 'recent') {
  return useQuery({
    queryKey: queryKeys.forum.posts(page, limit, categoryId, sortBy),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/forum/posts?page=${page}&limit=${limit}${categoryId ? `&categoryId=${categoryId}` : ''}&sortBy=${sortBy}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          }),
        `/api/forum/posts`,
        'GET'
      );
    },
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
    staleTime: 3 * 60 * 1000, // 3 minutes for forum posts (frequent updates)
  });
}

export function useForumCategories() {
  return useQuery({
    queryKey: queryKeys.forum.categories(),
    queryFn: async () => {
      return trackApiCall(
        () => fetch('/api/forum/categories').then(res => res.json()),
        '/api/forum/categories',
        'GET'
      );
    },
    staleTime: 15 * 60 * 1000, // 15 minutes for categories (rarely change)
  });
}

export function useForumPost(id: string) {
  return useQuery({
    queryKey: queryKeys.forum.post(id),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/forum/posts/${id}`).then(res => res.json()),
        `/api/forum/posts/${id}`,
        'GET'
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for individual posts
    enabled: !!id, // Only run query if id is provided
  });
}

// Social hooks
export function useSocialPosts(page = 1, limit = 20, sortBy = 'recent') {
  return useQuery({
    queryKey: queryKeys.social.posts(page, limit, sortBy),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/social/posts?page=${page}&limit=${limit}&sortBy=${sortBy}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          }),
        '/api/social/posts',
        'GET'
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000, // 2 minutes for social posts (very frequent)
  });
}

export function useSocialComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.social.comments(postId),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/social/posts/${postId}/comments`).then(res => res.json()),
        `/api/social/posts/${postId}/comments`,
        'GET'
      );
    },
    staleTime: 1 * 60 * 1000, // 1 minute for comments (frequent updates)
    enabled: !!postId,
  });
}

// User hooks
export function useUserProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.users.profile(username),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/users/${username}`).then(res => res.json()),
        `/api/users/${username}`,
        'GET'
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for profiles
    enabled: !!username,
  });
}

export function useUserStats(username: string) {
  return useQuery({
    queryKey: queryKeys.users.stats(username),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/users/${username}/stats`).then(res => res.json()),
        `/api/users/${username}/stats`,
        'GET'
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!username,
  });
}

export function useUserActivity(username: string, tab: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.users.activity(username, tab, page),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/users/${username}/${tab}?page=${page}`).then(res => res.json()),
        `/api/users/${username}/${tab}`,
        'GET'
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
    enabled: !!username,
  });
}

// Leaderboard hooks
export function useLeaderboard(type: string = 'overall', period: string = 'monthly') {
  return useQuery({
    queryKey: queryKeys.leaderboard(type, period),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/leaderboard?type=${type}&period=${period}`).then(res => res.json()),
        '/api/leaderboard',
        'GET'
      );
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for leaderboard (updates less frequently)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Server hooks
export function useServers() {
  return useQuery({
    queryKey: queryKeys.servers(),
    queryFn: async () => {
      return trackApiCall(
        () => fetch('/api/servers').then(res => res.json()),
        '/api/servers',
        'GET'
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for server status (changes frequently)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Minecraft server status hook
export function useMinecraftServerStatus(serverId: string) {
  return useQuery({
    queryKey: queryKeys.minecraft.status(serverId),
    queryFn: async () => {
      return trackApiCall(
        () => fetch(`/api/minecraft/servers/${serverId}/status`).then(res => res.json()),
        `/api/minecraft/servers/${serverId}/status`,
        'GET'
      );
    },
    staleTime: 30 * 1000, // 30 seconds for server status (very real-time)
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    enabled: !!serverId,
  });
}

// Mutation hooks
export function useCreateForumPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryId: number; title: string; content: string }) => {
      return trackApiCall(
        () => fetch('/api/forum/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then(res => res.json()),
        '/api/forum/posts',
        'POST'
      );
    },
    onSuccess: () => {
      // Invalidate and refetch forum posts
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      // Also invalidate forum categories in case counts changed
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
    },
  });
}

export function useCreateSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; imageUrl?: string }) => {
      return trackApiCall(
        () => fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then(res => res.json()),
        '/api/social/posts',
        'POST'
      );
    },
    onSuccess: () => {
      // Invalidate social posts to show new post
      queryClient.invalidateQueries({ queryKey: ['social', 'posts'] });
    },
  });
}
