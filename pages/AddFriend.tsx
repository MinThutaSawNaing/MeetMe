import React, { useState, useEffect } from 'react';
import { User, Friend } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface AddFriendProps {
  currentUser: User;
  onBack: () => void;
}

const AddFriend: React.FC<AddFriendProps> = ({ currentUser, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = async () => {
    try {
      // Get all users except the current user
      const allUsers = await mockDB.getAllUsers(currentUser.id);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to some default users if API fails
      const fallbackUsers: User[] = [
        { id: 'uid_demo_friend', username: 'Sarah Parker', status: 'busy', job_title: 'Product Manager', avatar_url: 'https://picsum.photos/200/200?random=2', created_at: new Date().toISOString() },
        { id: 'uid_ai_bot', username: 'Gemini Assistant', status: 'online', job_title: 'Virtual Assistant', avatar_url: 'https://picsum.photos/200/200?random=1', created_at: new Date().toISOString() }
      ];
      setUsers(fallbackUsers);
    }
  };

  const loadFriends = async () => {
    const data = await mockDB.getFriends(currentUser.id);
    setFriends(data);
  };

  useEffect(() => {
    loadUsers();
    loadFriends();
    setLoading(false);
  }, [currentUser.id]);

  const isFriend = (userId: string) => {
    return friends.some(f => f.friend_id === userId);
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await mockDB.addFriend(currentUser.id, userId);
      setSuccessMessage(`${users.find(u => u.id === userId)?.username} added successfully!`);
      loadFriends(); // Refresh the friends list
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.id !== currentUser.id &&
    !isFriend(user.id)
  );

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <Icons.Back size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add Friend</h1>
      </header>

      {successMessage && (
        <div className="mx-6 mb-4 p-3 bg-green-900/30 border border-green-800/50 text-green-400 rounded-xl text-center">
          {successMessage}
        </div>
      )}

      <div className="px-6 mb-4">
        <div className="relative group">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
              <Icons.Users size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No users found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div 
                key={user.id}
                className="flex items-center gap-4 p-4 bg-dark-surface/30 rounded-2xl"
              >
                <div className="relative">
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-dark-surface"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{user.username}</h3>
                  <p className="text-gray-400 text-sm truncate max-w-[80%]">{user.job_title}</p>
                </div>
                <button 
                  onClick={() => handleAddFriend(user.id)}
                  className="bg-primary-600 hover:bg-primary-500 text-white p-2 rounded-xl shadow-lg shadow-primary-900/20"
                >
                  <Icons.Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriend;