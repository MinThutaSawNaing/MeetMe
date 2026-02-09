import { supabase, checkSupabaseAvailability, isSupabaseAvailable } from './supabaseClient';
import { User, Chat, Message, Friend, Story } from '../types';
import { wsManager } from './websocketService';

// Delay utility function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Real-time subscriptions management
const realTimeSubscriptions: { [key: string]: any } = {};

// Supabase service implementation
export const supabaseDB = {
  // Chats operations
  getChats: async (userId: string): Promise<Chat[]> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      // Fallback to some mock behavior if Supabase is not available
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .filter('participants', 'cs', `{${userId}}`) // cs = contains
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        throw error;
      }

      return data as Chat[];
    } catch (error) {
      console.error('Error in getChats:', error);
      throw error;
    }
  },

  createChat: async (userIds: string[]): Promise<Chat> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      // Fallback to mock behavior
      console.warn('Supabase not available, simulating chat creation');
      return {
        id: `temp_chat_${Date.now()}`,
        participants: userIds,
        updated_at: new Date().toISOString(),
        last_message: 'New conversation started',
        is_group: userIds.length > 2
      };
    }

    try {
      // First check if a chat already exists with the same participants
      const { data: existingChats, error: fetchError } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', userIds);

      if (fetchError) {
        console.error('Error checking existing chats:', fetchError);
      } else if (existingChats && existingChats.length > 0) {
        // Return existing chat if found
        return existingChats[0] as Chat;
      }

      const newChat: Omit<Chat, 'id'> = {
        participants: userIds,
        updated_at: new Date().toISOString(),
        last_message: 'New conversation started',
        is_group: userIds.length > 2
      };

      const { data, error } = await supabase
        .from('chats')
        .insert([newChat])
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        throw error;
      }

      return data as Chat;
    } catch (error) {
      console.error('Error in createChat:', error);
      throw error;
    }
  },

  // Messages operations
  getMessages: async (chatId: string): Promise<Message[]> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return data as Message[];
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  },

  sendMessage: async (chatId: string, senderId: string, content: string, isAi = false): Promise<Message> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating message send');
      return {
        id: `temp_msg_${Date.now()}`,
        chat_id: chatId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString(),
        is_ai_generated: isAi,
        status: 'sent'
      };
    }

    try {
      const newMessage: Omit<Message, 'id'> = {
        chat_id: chatId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString(),
        is_ai_generated: isAi,
        status: 'sent'
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Update the chat's last message and updated_at timestamp
      const { error: updateError } = await supabase
        .from('chats')
        .update({
          last_message: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);
      
      if (updateError) {
        console.error('Error updating chat after sending message:', updateError);
      }

      return data as Message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  // Friends operations
  getFriends: async (userId: string): Promise<Friend[]> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching friends:', error);
        throw error;
      }

      // Fetch user details for each friend
      const friendIds = data.map(friend => friend.friend_id);
      if (friendIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', friendIds);

        if (userError) {
          console.error('Error fetching friend user data:', userError);
        } else {
          // Add user data to each friend object
          return data.map(friend => {
            const userData = users.find(user => user.id === friend.friend_id);
            return {
              ...friend,
              friend_data: userData as User
            };
          });
        }
      }

      return data as Friend[];
    } catch (error) {
      console.error('Error in getFriends:', error);
      throw error;
    }
  },

  addFriend: async (userId: string, friendId: string): Promise<void> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating friend addition');
      return;
    }

    if (userId === friendId) {
      throw new Error("Cannot add yourself");
    }

    try {
      // Check if the friendship already exists
      const { data: existingFriendship, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .match({ user_id: userId, friend_id: friendId });

      if (fetchError) {
        console.error('Error checking existing friendship:', fetchError);
      } else if (existingFriendship && existingFriendship.length > 0) {
        // Friendship already exists
        return;
      }

      // Add both users as friends to each other
      const friendships = [
        { user_id: userId, friend_id: friendId },
        { user_id: friendId, friend_id: userId }
      ];

      const { error } = await supabase
        .from('friends')
        .insert(friendships);

      if (error) {
        console.error('Error adding friends:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in addFriend:', error);
      throw error;
    }
  },

  // User operations
  getUserById: async (id: string): Promise<User | undefined> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, returning undefined');
      return undefined;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found - not an error in this context
          return undefined;
        }
        console.error('Error fetching user:', error);
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  },

  getAllUsers: async (excludeCurrentUserId: string): Promise<User[]> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', excludeCurrentUserId); // Exclude current user

      if (error) {
        console.error('Error fetching all users:', error);
        throw error;
      }

      return data as User[];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId: string, status: User['status']): Promise<void> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating status update');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating profile update');
      // Return a simulated updated user
      return { ...updates, id: userId } as User;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      
      return data as User;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  // Stories operations
  getStories: async (): Promise<Story[]> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      // Clean up expired stories (older than 24 hours) before fetching
      await cleanupExpiredStories();
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
        throw error;
      }

      // Fetch user details for each story
      const userIds = data.map(story => story.user_id);
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (userError) {
          console.error('Error fetching story user data:', userError);
        } else {
          // Add user data to each story object
          return data.map(story => {
            const userData = users.find(user => user.id === story.user_id);
            return {
              ...story,
              user_data: userData as User
            };
          });
        }
      }

      return data as Story[];
    } catch (error) {
      console.error('Error in getStories:', error);
      throw error;
    }
  },

  addStory: async (userId: string, imageUrl: string, caption?: string): Promise<Story> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating story addition');
      return {
        id: `temp_story_${Date.now()}`,
        user_id: userId,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        caption
      };
    }

    try {
      const newStory: Omit<Story, 'id'> = {
        user_id: userId,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        caption
      };

      const { data, error } = await supabase
        .from('stories')
        .insert([newStory])
        .select()
        .single();

      if (error) {
        console.error('Error adding story:', error);
        throw error;
      }

      return data as Story;
    } catch (error) {
      console.error('Error in addStory:', error);
      throw error;
    }
  },

  uploadStory: async (userId: string, file: File, caption?: string): Promise<Story> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating story upload');
      return {
        id: `temp_story_${Date.now()}`,
        user_id: userId,
        image_url: URL.createObjectURL(file),
        created_at: new Date().toISOString(),
        caption
      };
    }

    // Validate file size
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      throw new Error('Unsupported file type. Please upload an image or video.');
    }

    if (isImage && file.size > 4 * 1024 * 1024) { // 4MB limit for images
      throw new Error('Image file size exceeds 4MB limit');
    }

    if (isVideo && file.size > 14 * 1024 * 1024) { // 14MB limit for videos
      throw new Error('Video file size exceeds 14MB limit');
    }

    try {
      // Upload file to Supabase Storage
      const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading story file:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Create story record in the database
      const newStory: Omit<Story, 'id'> = {
        user_id: userId,
        image_url: publicUrl,
        created_at: new Date().toISOString(),
        caption
      };

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert([newStory])
        .select()
        .single();

      if (storyError) {
        console.error('Error adding story to database:', storyError);
        // Clean up the uploaded file if database insertion fails
        await supabase.storage
          .from('stories')
          .remove([fileName]);
        throw storyError;
      }

      return storyData as Story;
    } catch (error) {
      console.error('Error in uploadStory:', error);
      throw error;
    }
  },

  // Real-time subscription methods
  subscribeToChatMessages: (chatId: string, callback: (message: Message) => void) => {
    if (!supabase) {
      console.warn('Supabase not available, cannot subscribe to messages');
      return () => {};
    }

    // Unsubscribe if already subscribed
    if (realTimeSubscriptions[`messages-${chatId}`]) {
      realTimeSubscriptions[`messages-${chatId}`].unsubscribe();
      delete realTimeSubscriptions[`messages-${chatId}`];
    }

    console.log('Setting up real-time subscription for chat:', chatId);
    
    const channel = supabase
      .channel(`realtime:messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received in real-time:', payload.new);
          callback(payload.new as Message);
        }
      )
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        console.log('Message updated in real-time:', payload.new);
        callback(payload.new as Message);
      });

    // Track connection status
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Real-time channel subscribed for chat:', chatId);
      } else if (status === 'CLOSED') {
        console.log('Real-time channel closed for chat:', chatId);
      }
    });
    
    // Store the channel for cleanup
    realTimeSubscriptions[`messages-${chatId}`] = channel;
    
    return () => {
      console.log('Unsubscribing from real-time messages for chat:', chatId);
      if (realTimeSubscriptions[`messages-${chatId}`]) {
        realTimeSubscriptions[`messages-${chatId}`].unsubscribe();
        delete realTimeSubscriptions[`messages-${chatId}`];
      }
    };
  },

  subscribeToChats: (userId: string, callback: (chats: Chat[]) => void) => {
    if (!supabase) {
      console.warn('Supabase not available, cannot subscribe to chats');
      return;
    }

    // Unsubscribe if already subscribed
    if (realTimeSubscriptions[`chats-${userId}`]) {
      realTimeSubscriptions[`chats-${userId}`].unsubscribe();
    }

    console.log('Setting up real-time subscription for user chats:', userId);
    
    const channel = supabase
      .channel(`realtime:chats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${userId}}`
        },
        (payload) => {
          // Refresh chats when there's an update
          console.log('Chat updated in real-time:', payload);
          supabaseDB.getChats(userId).then(callback);
        }
      )
      // Also listen for INSERT events for new chats
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${userId}}`
        },
        (payload) => {
          console.log('New chat created in real-time:', payload);
          supabaseDB.getChats(userId).then(callback);
        }
      )
      // Listen for DELETE events as well
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${userId}}`
        },
        (payload) => {
          console.log('Chat deleted in real-time:', payload);
          supabaseDB.getChats(userId).then(callback);
        }
      );

    // Track connection status
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Real-time channel subscribed for user chats:', userId);
      } else if (status === 'CLOSED') {
        console.log('Real-time channel closed for user chats:', userId);
      }
    });

    const subscription = channel.subscribe();
    realTimeSubscriptions[`chats-${userId}`] = channel;
    return subscription;
  },

  subscribeToUserStatus: (userId: string, callback: (user: User) => void) => {
    if (!supabase) {
      console.warn('Supabase not available, cannot subscribe to user status');
      return;
    }

    // Unsubscribe if already subscribed
    if (realTimeSubscriptions[`user-${userId}`]) {
      realTimeSubscriptions[`user-${userId}`].unsubscribe();
    }

    const channel = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as User);
        }
      );

    const subscription = channel.subscribe();
    realTimeSubscriptions[`user-${userId}`] = channel;
    return subscription;
  },

  unsubscribeFromChannel: (channelName: string) => {
    if (realTimeSubscriptions[channelName]) {
      const channel = realTimeSubscriptions[channelName];
      console.log('Unsubscribing from channel:', channelName);
      channel.untrack(); // Untrack all events
      channel.unsubscribe();
      delete realTimeSubscriptions[channelName];
    }
  },

  unsubscribeAll: () => {
    console.log('Unsubscribing from all real-time channels');
    Object.keys(realTimeSubscriptions).forEach(channelName => {
      const channel = realTimeSubscriptions[channelName];
      channel.untrack(); // Untrack all events
      channel.unsubscribe();
    });
    Object.keys(realTimeSubscriptions).forEach(key => delete realTimeSubscriptions[key]);
  },

  // Function to get connection status for debugging
  getConnectionStatus: () => {
    const status = {};
    for (const [channelName, channel] of Object.entries(realTimeSubscriptions)) {
      status[channelName] = 'connected'; // Channel exists and should be active
    }
    return status;
  },

  // Test real-time connection
  testRealtimeConnection: async () => {
    if (!supabase) {
      console.error('Supabase not available for testing');
      return false;
    }
    
    try {
      // Create a test channel to verify real-time is working
      const testChannel = supabase.channel('test-realtime-connection');
      
      let isConnected = false;
      testChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isConnected = true;
          console.log('Real-time connection test: SUCCESS');
        }
      });
      
      // Wait a bit for connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clean up
      testChannel.untrack();
      testChannel.unsubscribe();
      
      return isConnected;
    } catch (error) {
      console.error('Real-time connection test: FAILED', error);
      return false;
    }
  },

  // Delete chat for current user only (frontend removal)
  deleteChatForUser: (chatId: string): Promise<void> => {
    // This is handled in the frontend by filtering out the chat
    // In a real implementation, you might want to mark the chat as "hidden" for the user
    console.log(`Chat ${chatId} marked for deletion for current user`);
    return Promise.resolve();
  },

  // Completely delete chat for all participants
  deleteChatCompletely: async (chatId: string): Promise<void> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating chat deletion');
      return;
    }

    try {
      // Delete all messages associated with the chat (due to CASCADE)
      // and the chat itself
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteChatCompletely:', error);
      throw error;
    }
  }
};

export const supabaseAuth = {
  signIn: async (username: string): Promise<{ user: User | null; error: string | null }> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating sign in');
      // For fallback, return a temporary user
      const tempUser: User = {
        id: `temp_user_${Date.now()}`,
        username,
        avatar_url: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        status: 'online',
        job_title: 'Team Member'
      };
      return { user: tempUser, error: null };
    }

    try {
      // First, try to find the user by username
      let { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error finding user:', error);
        return { user: null, error: error.message };
      }

      let user: User;
      if (existingUser) {
        user = existingUser as User;
      } else {
        // Create a new user if not found
        const newUser: Omit<User, 'id'> = {
          username,
          avatar_url: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString(),
          status: 'online',
          job_title: 'Team Member'
        };

        const { data, error: insertError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          return { user: null, error: insertError.message };
        }

        user = data as User;
      }

      // Update user status to online
      await supabase
        .from('users')
        .update({ status: 'online' })
        .eq('id', user.id);

      // Store the user in session storage for persistence
      sessionStorage.setItem('currentUser', JSON.stringify(user));

      return { user, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message };
    }
  },

  signOut: async (): Promise<void> => {
    checkSupabaseAvailability();
    
    if (!supabase) {
      console.warn('Supabase not available, simulating sign out');
      sessionStorage.removeItem('currentUser');
      return;
    }

    try {
      // Update current user status to offline
      const currentUserStr = sessionStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser?.id) {
          await supabase
            .from('users')
            .update({ status: 'offline' })
            .eq('id', currentUser.id);
        }
      }

      // Remove current user from session storage
      sessionStorage.removeItem('currentUser');
      
      // Unsubscribe from all real-time channels
      supabaseDB.unsubscribeAll();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  getCurrentUser: (): User | null => {
    // Try to get from session storage first
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing current user from session storage:', e);
        return null;
      }
    }

    // If not in session storage, return null
    return null;
  }
};

// Helper function to clean up expired stories (older than 24 hours)
const cleanupExpiredStories = async (): Promise<void> => {
  checkSupabaseAvailability();
  
  if (!supabase) {
    console.warn('Supabase not available, skipping story cleanup');
    return;
  }

  try {
    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get stories older than 24 hours
    const { data: expiredStories, error: fetchError } = await supabase
      .from('stories')
      .select('id, image_url')
      .lt('created_at', twentyFourHoursAgo);

    if (fetchError) {
      console.error('Error fetching expired stories:', fetchError);
      return;
    }

    if (expiredStories && expiredStories.length > 0) {
      // Extract file paths to delete from storage
      const filePaths = expiredStories.map(story => {
        // Extract the path from the URL assuming it follows the format we set in uploadStory
        try {
          const url = new URL(story.image_url);
          const pathParts = url.pathname.split('/');
          // Assuming the storage bucket path is in the format: /storage/v1/object/public/stories/userId/timestamp-filename
          return `stories/${pathParts[pathParts.length - 1]}`;
        } catch {
          return null;
        }
      }).filter(Boolean) as string[];
      
      // Delete files from storage if any
      if (filePaths.length > 0) {
        await supabase.storage
          .from('stories')
          .remove(filePaths);
      }
      
      // Delete expired stories from the database
      const expiredIds = expiredStories.map(story => story.id);
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .in('id', expiredIds);

      if (deleteError) {
        console.error('Error deleting expired stories:', deleteError);
      } else {
        console.log(`Cleaned up ${expiredIds.length} expired stories`);
      }
    }
  } catch (error) {
    console.error('Error in cleanupExpiredStories:', error);
  }
};

// Export the cleanup function separately
export { cleanupExpiredStories };