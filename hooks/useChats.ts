import { useQuery } from '@tanstack/react-query';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Chat } from '../types';

export const useChats = (userId: string) => {
  return useQuery<Chat[], Error>({
    queryKey: ['chats', userId],
    queryFn: async () => {
      const data = await mockDB.getChats(userId);
      return data;
    },
    refetchInterval: 4000, // Refetch every 4 seconds
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 5000, // Consider data stale after 5 seconds
    gcTime: 10000, // Keep data in cache for 10 seconds
  });
};