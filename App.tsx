import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ViewState, User, Chat } from './types';
import { supabaseDB as mockDB } from './services/supabaseService';
import { authService } from './services/authService';
import { initializeGemini } from './services/geminiService';
import { Icons } from './components/Icon';
import QRCode from 'react-qr-code';
import { generateSmartReply, chatWithBot } from './services/geminiService';

// -- Components --
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import AddFriend from './pages/AddFriend';
import Login from './pages/Login';
import Stories from './pages/Stories';
import Scan from './pages/Scan';
import Notifications from './pages/Notifications';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.SPLASH);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Initial Load
  useEffect(() => {
    const initApp = async () => {
      // Try to get API Key from storage if previously saved
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) {
          setApiKey(storedKey);
          initializeGemini(storedKey);
      }
      
      // Test real-time connection
      try {
        const isRealtimeWorking = await mockDB.testRealtimeConnection();
        console.log('Real-time connection status:', isRealtimeWorking ? 'CONNECTED' : 'NOT CONNECTED');
      } catch (error) {
        console.error('Error testing real-time connection:', error);
      }
      
      // Simulate splash screen
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user is logged in
      const user = authService.getCurrentUser();
      
      if (user) {
          setCurrentUser(user);
          setView(ViewState.CHATS);
      } else {
          setView(ViewState.LOGIN);
      }
    };
    
    initApp();
    
    // Cleanup function
    return () => {
      // Clean up all real-time subscriptions when app unmounts
      mockDB.unsubscribeAll();
    };
  }, []);

  const handleLogin = async (user: any) => {
    setCurrentUser(user);
    setView(ViewState.CHATS);
  };

  const handleLogout = async () => {
    // Clean up all real-time subscriptions
    mockDB.unsubscribeAll();
    
    await authService.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
  };

  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
    setView(ViewState.CHAT_ROOM);
  };

  const handleApiKeySubmit = (key: string) => {
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
      initializeGemini(key);
  };

  // Rendering
  if (view === ViewState.SPLASH) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black text-white flex-col gap-4">
        <div className="p-4 bg-dark-surface border border-primary-900 rounded-3xl shadow-xl shadow-primary-900/20 animate-pop">
            <Icons.Message size={48} className="text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter animate-fade-in text-primary-500">MeetMe</h1>
      </div>
    );
  }

  if (view === ViewState.LOGIN) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <Layout currentView={view} onChangeView={setView}>
      {view === ViewState.CHATS && currentUser && (
        <ChatList 
          currentUser={currentUser} 
          onOpenChat={handleOpenChat} 
          apiKey={apiKey}
          onSetApiKey={handleApiKeySubmit}
        />
      )}
      
      {view === ViewState.STORIES && currentUser && (
          <Stories currentUser={currentUser} />
      )}

      {view === ViewState.NOTIFICATIONS && currentUser && (
          <Notifications currentUser={currentUser} />
      )}

      {view === ViewState.SCAN && currentUser && (
          <Scan 
            currentUser={currentUser} 
            onScanQR={() => setView(ViewState.ADD_FRIEND)}
            onShowQR={() => setView(ViewState.PROFILE)}
          />
      )}

      {view === ViewState.CHAT_ROOM && currentUser && activeChatId && (
        <ChatRoom 
          currentUser={currentUser} 
          chatId={activeChatId} 
          onBack={() => setView(ViewState.CHATS)}
          apiKey={apiKey}
        />
      )}

      {view === ViewState.ADD_FRIEND && currentUser && (
        <AddFriend 
            currentUser={currentUser}
            onBack={() => setView(ViewState.PROFILE)}
        />
      )}

      {view === ViewState.PROFILE && currentUser && (
        <Profile 
            currentUser={currentUser} 
            onLogout={handleLogout}
            apiKey={apiKey}
            setApiKey={handleApiKeySubmit}
            onOpenChat={handleOpenChat}
            onAddFriend={() => setView(ViewState.ADD_FRIEND)}
        />
      )}
    </Layout>
  );
};

export default App;