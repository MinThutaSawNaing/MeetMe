import React, { useEffect, useState } from 'react';
import { User, Chat } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface ChatListProps {
  currentUser: User;
  onOpenChat: (chatId: string) => void;
  apiKey: string;
  onSetApiKey: (key: string) => void;
}

interface ChatItemProps {
  chat: Chat;
  currentUser: User;
  onOpenChat: (chatId: string) => void;
}

const getStatusColor = (status?: string) => {
    switch(status) {
        case 'online': return 'bg-green-500';
        case 'busy': return 'bg-red-500';
        case 'away': return 'bg-yellow-500';
        default: return 'bg-gray-500';
    }
};

const ChatItem: React.FC<ChatItemProps> = ({ chat, currentUser, onOpenChat }) => {
    const [otherUser, setOtherUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const uid = chat.participants.find(p => p !== currentUser.id);
            if (uid) {
                const u = await mockDB.getUserById(uid);
                if (u) setOtherUser(u);
            }
        };
        fetchUser();
    }, [chat, currentUser.id]);

    if (!otherUser) return null;

    return (
        <div 
            onClick={() => onOpenChat(chat.id)}
            className="flex items-center gap-4 p-4 hover:bg-dark-surface/50 active:bg-dark-surface transition-colors rounded-2xl cursor-pointer mb-2 mx-2 group border border-transparent hover:border-dark-border"
        >
            <div className="relative">
                <img 
                    src={otherUser.avatar_url} 
                    alt={otherUser.username} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-dark-surface group-hover:border-primary-500/50 transition-colors"
                />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(otherUser.status)} border-2 border-dark-bg rounded-full`}></div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-white truncate">{otherUser.username}</h3>
                    <span className="text-[10px] text-gray-500 font-medium">
                        {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-gray-400 text-sm truncate max-w-[80%]">{chat.last_message}</p>
                    {/* Fake unread badge for enterprise feel */}
                    {Math.random() > 0.8 && (
                        <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md shadow-primary-900/50">
                            {Math.floor(Math.random() * 3) + 1}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatList: React.FC<ChatListProps> = ({ currentUser, onOpenChat, apiKey, onSetApiKey }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadChats = async () => {
    try {
      const data = await mockDB.getChats(currentUser.id);
      setChats(data);
      if (loading) setLoading(false);
    } catch (error) {
      console.error('Error loading chats:', error);
      if (loading) setLoading(false);
      alert('Failed to load chats. Please try again later.');
    }
  };

  useEffect(() => {
    loadChats();
    
    // Set up real-time subscription for chat updates
    const chatSubscription = mockDB.subscribeToChats(currentUser.id, setChats);
    
    // Clean up subscription on unmount
    return () => {
      mockDB.unsubscribeFromChannel(`chats-${currentUser.id}`);
    };
  }, [currentUser.id]);

  useEffect(() => {
    let result = chats;
    
    // Filter by Tab
    if (activeTab === 'groups') {
        result = result.filter(c => c.is_group);
    } else if (activeTab === 'direct') {
        result = result.filter(c => !c.is_group);
    }
    
    setFilteredChats(result);
  }, [chats, activeTab, searchTerm]);

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">MeetMe</h1>
            <div className="flex items-center gap-2 mt-1">
                 <div className={`w-2 h-2 rounded-full ${getStatusColor(currentUser.status)}`}></div>
                 <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{currentUser.status || 'Offline'}</p>
            </div>
        </div>
        {!apiKey && (
            <button 
                onClick={() => setShowKeyModal(true)}
                className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-2 rounded-xl shadow-lg shadow-primary-900/20 hover:scale-105 transition-transform"
                title="Enable Enterprise AI"
            >
                <Icons.Sparkles size={20} />
            </button>
        )}
      </header>

      {/* Enterprise Search Bar */}
      <div className="px-6 mb-4">
          <div className="relative group">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                  type="text" 
                  placeholder="Search conversations, files, or people..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary-500 transition-all placeholder-gray-600"
              />
          </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-2 flex gap-4 border-b border-dark-border/50">
          {['all', 'direct', 'groups'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-bold capitalize transition-colors relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
              </button>
          ))}
      </div>

      {/* AI Key Modal */}
      {showKeyModal && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-dark-surface border border-dark-border p-6 rounded-3xl w-full max-w-xs animate-pop shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Activate Intelligence</h2>
                    <Icons.Bot className="text-primary-500" />
                  </div>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Enter your Gemini API key to unlock <span className="text-white font-semibold">Smart Summaries</span>, <span className="text-white font-semibold">Auto-Translation</span>, and <span className="text-white font-semibold">AI Responses</span>.
                  </p>
                  <input 
                    type="password" 
                    placeholder="Paste API Key here"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 mb-4 focus:border-primary-500 outline-none transition-colors"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                  />
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowKeyModal(false)}
                        className="flex-1 py-3 text-gray-400 hover:text-white font-medium"
                      >
                          Later
                      </button>
                      <button 
                        onClick={() => {
                            onSetApiKey(tempKey);
                            setShowKeyModal(false);
                        }}
                        className="flex-1 bg-primary-600 rounded-xl py-3 font-bold hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20"
                      >
                          Activate
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 mt-2">
        {loading ? (
           <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
                <Icons.Briefcase size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No active conversations found.</p>
          </div>
        ) : (
          filteredChats.map(chat => <ChatItem key={chat.id} chat={chat} currentUser={currentUser} onOpenChat={onOpenChat} />)
        )}
      </div>
    </div>
  );
};

export default ChatList;