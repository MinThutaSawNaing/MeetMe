import { User, Chat, Message, Friend, Story } from '../types';

const STORAGE_KEYS = {
  USER: 'vibe_user',
  USERS: 'vibe_users',
  CHATS: 'vibe_chats',
  MESSAGES: 'vibe_messages',
  FRIENDS: 'vibe_friends',
  STORIES: 'vibe_stories',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Initialization
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
      { id: 'uid_ai_bot', username: 'Gemini Assistant', status: 'online', job_title: 'Virtual Assistant', avatar_url: 'https://picsum.photos/200/200?random=1', created_at: new Date().toISOString() },
      { id: 'uid_demo_friend', username: 'Sarah Parker', status: 'busy', job_title: 'Product Manager', avatar_url: 'https://picsum.photos/200/200?random=2', created_at: new Date().toISOString() }
    ]));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.STORIES)) {
      // Add a dummy story
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify([
          {
              id: 'st_1',
              user_id: 'uid_demo_friend',
              image_url: 'https://picsum.photos/400/800?random=10',
              created_at: new Date().toISOString(),
              caption: 'Working late! ☕️'
          }
      ]));
  }
};

initializeMockData();

export const mockDB = {
  getChats: async (userId: string): Promise<Chat[]> => {
    await delay(100);
    const chatsStr = localStorage.getItem(STORAGE_KEYS.CHATS) || '[]';
    const chats: Chat[] = JSON.parse(chatsStr);
    return chats.filter(c => c.participants.includes(userId)).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  createChat: async (userIds: string[]): Promise<Chat> => {
    const chatsStr = localStorage.getItem(STORAGE_KEYS.CHATS) || '[]';
    const chats: Chat[] = JSON.parse(chatsStr);
    
    // Check existing
    const existing = chats.find(c => 
      c.participants.length === userIds.length && 
      c.participants.every(id => userIds.includes(id))
    );
    
    if (existing) return existing;

    const newChat: Chat = {
      id: `chat_${Math.random().toString(36).substr(2, 9)}`,
      participants: userIds,
      updated_at: new Date().toISOString(),
      last_message: 'New conversation started',
      is_group: userIds.length > 2
    };
    
    chats.push(newChat);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    return newChat;
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    const msgsStr = localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]';
    const allMessages: Message[] = JSON.parse(msgsStr);
    return allMessages.filter(m => m.chat_id === chatId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  sendMessage: async (chatId: string, senderId: string, content: string, isAi = false): Promise<Message> => {
    const msgsStr = localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]';
    const allMessages: Message[] = JSON.parse(msgsStr);
    
    const newMessage: Message = {
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      chat_id: chatId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
      is_ai_generated: isAi,
      status: 'sent'
    };
    
    allMessages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));

    // Update Chat timestamp
    const chatsStr = localStorage.getItem(STORAGE_KEYS.CHATS) || '[]';
    const chats: Chat[] = JSON.parse(chatsStr);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
      chats[chatIndex].updated_at = newMessage.created_at;
      chats[chatIndex].last_message = content;
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    }

    return newMessage;
  },

  getFriends: async (userId: string): Promise<Friend[]> => {
    const friendsStr = localStorage.getItem(STORAGE_KEYS.FRIENDS) || '[]';
    const allFriends: Friend[] = JSON.parse(friendsStr);
    const myFriends = allFriends.filter(f => f.user_id === userId);
    
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
    const users: User[] = JSON.parse(usersStr);

    return myFriends.map(f => ({
      ...f,
      friend_data: users.find(u => u.id === f.friend_id)
    }));
  },

  addFriend: async (userId: string, friendId: string): Promise<void> => {
    if (userId === friendId) throw new Error("Cannot add yourself");
    const friendsStr = localStorage.getItem(STORAGE_KEYS.FRIENDS) || '[]';
    const allFriends: Friend[] = JSON.parse(friendsStr);
    
    if (allFriends.some(f => f.user_id === userId && f.friend_id === friendId)) return;

    allFriends.push({ id: `fr_${Math.random().toString(36).substr(2, 9)}`, user_id: userId, friend_id: friendId });
    allFriends.push({ id: `fr_${Math.random().toString(36).substr(2, 9)}`, user_id: friendId, friend_id: userId });

    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(allFriends));
  },

  getUserById: async (id: string): Promise<User | undefined> => {
     const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
     const users: User[] = JSON.parse(usersStr);
     return users.find(u => u.id === id);
  },

  updateUserStatus: async (userId: string, status: User['status']) => {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
    const users: User[] = JSON.parse(usersStr);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    
    // Also update current session user
    const currentUserStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.id === userId) {
        currentUser.status = status;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      }
    }
  },

  getStories: async (): Promise<Story[]> => {
      const storiesStr = localStorage.getItem(STORAGE_KEYS.STORIES) || '[]';
      const stories: Story[] = JSON.parse(storiesStr);
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
      const users: User[] = JSON.parse(usersStr);

      // Hydrate with user data
      return stories.map(s => ({
          ...s,
          user_data: users.find(u => u.id === s.user_id)
      })).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addStory: async (userId: string, imageUrl: string, caption?: string): Promise<Story> => {
      const storiesStr = localStorage.getItem(STORAGE_KEYS.STORIES) || '[]';
      const stories: Story[] = JSON.parse(storiesStr);
      
      const newStory: Story = {
          id: `st_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          caption
      };
      
      stories.unshift(newStory);
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
      return newStory;
  }
};

export const mockAuth = {
  signIn: async (username: string): Promise<{ user: User | null; error: string | null }> => {
    await delay(500);
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
    const users: User[] = JSON.parse(usersStr);
    
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      user = {
        id: `uid_${Math.random().toString(36).substr(2, 9)}`,
        username,
        avatar_url: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        status: 'online',
        job_title: 'Team Member'
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { user, error: null };
  },
  
  signOut: async () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  getCurrentUser: (): User | null => {
    const u = localStorage.getItem(STORAGE_KEYS.USER);
    return u ? JSON.parse(u) : null;
  }
};