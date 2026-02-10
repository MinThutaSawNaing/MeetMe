export type UserStatus = 'online' | 'busy' | 'away' | 'offline';

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  status?: UserStatus;
  job_title?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_ai_generated?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  is_read?: boolean; // Track if message is read by recipient
}

export interface Chat {
  id: string;
  participants: string[]; // User IDs
  last_message?: string;
  updated_at: string;
  is_group?: boolean;
  group_name?: string;
  unread_count?: number; // Track unread messages
}

export interface Friend {
  id: string;
  user_id: string; // The owner of the friend list
  friend_id: string; // The friend's user ID
  friend_data?: User; // Hydrated data
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  caption?: string;
  user_data?: User; // Hydrated
}

export enum ViewState {
  SPLASH = 'SPLASH',
  LOGIN = 'LOGIN',
  CHATS = 'CHATS',
  STORIES = 'STORIES',
  SCAN = 'SCAN',
  CHAT_ROOM = 'CHAT_ROOM',
  CONTACTS = 'CONTACTS',
  ADD_FRIEND = 'ADD_FRIEND',
  PROFILE = 'PROFILE',
  NOTIFICATIONS = 'NOTIFICATIONS',
}

export interface ChatCompletion {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'login' | 'config_change' | 'system';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  metadata?: Record<string, any>; // Additional data for the notification
}