import React, { useState, useEffect } from 'react';
import { User, Friend } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface ContactsProps {
  currentUser: User;
  onOpenChat: (chatId: string) => void;
  onAddFriend: () => void;
}

const Contacts: React.FC<ContactsProps> = ({ currentUser, onOpenChat, onAddFriend }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = async () => {
    try {
      const data = await mockDB.getFriends(currentUser.id);
      setFriends(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading friends:', error);
      setLoading(false);
      alert('Failed to load contacts. Please try again later.');
    }
  };

  useEffect(() => {
    loadFriends();
    
    // In a real app, we would set up a subscription for friend updates
    // For now, we'll just refresh periodically
    const interval = setInterval(loadFriends, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const startChat = async (friendId: string) => {
    // Find or create a chat with this friend
    const chat = await mockDB.createChat([currentUser.id, friendId]);
    onOpenChat(chat.id);
  };

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Contacts</h1>
          <button 
            onClick={onAddFriend}
            className="bg-primary-600 hover:bg-primary-500 text-white p-2 rounded-xl shadow-lg shadow-primary-900/20"
          >
            <Icons.Plus size={20} />
          </button>
        </div>
      </header>

      <div className="px-6 mb-4">
        <div className="relative group">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : friends.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
              <Icons.Users size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No contacts yet.</p>
            <button 
              onClick={onAddFriend}
              className="mt-4 text-primary-500 hover:text-primary-400 font-medium text-sm"
            >
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map(friend => (
              friend.friend_data && (
                <div 
                  key={friend.id}
                  className="flex items-center gap-4 p-4 hover:bg-dark-surface/50 active:bg-dark-surface transition-colors rounded-2xl cursor-pointer mx-2"
                  onClick={() => friend.friend_data && startChat(friend.friend_data.id)}
                >
                  <div className="relative">
                    <img 
                      src={friend.friend_data.avatar_url} 
                      alt={friend.friend_data.username} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-dark-surface"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{friend.friend_data.username}</h3>
                    <p className="text-gray-400 text-sm truncate max-w-[80%]">{friend.friend_data.job_title}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;