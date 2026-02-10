import React from 'react';
import { ViewState } from '../types';
import { Icons } from './Icon';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const isChatRoom = currentView === ViewState.CHAT_ROOM;
  const isSplash = currentView === ViewState.SPLASH || currentView === ViewState.LOGIN;
  
  // Hide nav in Scan mode too for immersive experience, or show it? Let's show it but maybe overlay
  // For simplicity, hide nav in Chat Room only.
  
  if (isSplash) return <>{children}</>;

  return (
    <div className="flex flex-col h-full bg-dark-bg text-white max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Content Area */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${!isChatRoom ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isChatRoom && (
        <nav className="absolute bottom-0 w-full bg-dark-surface/95 backdrop-blur-xl border-t border-dark-border px-4 py-3 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => onChangeView(ViewState.CHATS)}
            className={`flex flex-col items-center gap-1 transition-all w-14 ${currentView === ViewState.CHATS ? 'text-primary-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icons.Message size={24} fill={currentView === ViewState.CHATS ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">Chats</span>
          </button>

          <button 
            onClick={() => onChangeView(ViewState.STORIES)}
            className={`flex flex-col items-center gap-1 transition-all w-14 ${currentView === ViewState.STORIES ? 'text-primary-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icons.Aperture size={24} className={currentView === ViewState.STORIES ? "animate-spin-slow" : ""} />
            <span className="text-[10px] font-medium">Stories</span>
          </button>

          {/* Central Scan Button */}
          <button 
            onClick={() => onChangeView(ViewState.SCAN)}
            className="flex flex-col items-center justify-center -mt-8"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${currentView === ViewState.SCAN ? 'bg-primary-500 scale-110 shadow-primary-500/50' : 'bg-dark-surface border border-dark-border text-primary-500 hover:bg-dark-border'}`}>
                <Icons.Scan size={28} />
            </div>
            <span className={`text-[10px] font-medium mt-1 ${currentView === ViewState.SCAN ? 'text-primary-500' : 'text-gray-500'}`}>Scan</span>
          </button>

          <button 
            onClick={() => onChangeView(ViewState.NOTIFICATIONS)}
            className={`flex flex-col items-center gap-1 transition-all w-14 ${currentView === ViewState.NOTIFICATIONS ? 'text-primary-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icons.Bell size={24} fill={currentView === ViewState.NOTIFICATIONS ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">Noti</span>
          </button>

          <button 
            onClick={() => onChangeView(ViewState.CONTACTS)}
            className={`flex flex-col items-center gap-1 transition-all w-14 ${currentView === ViewState.CONTACTS || currentView === ViewState.ADD_FRIEND ? 'text-primary-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icons.Users size={24} fill={currentView === ViewState.CONTACTS ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">Contacts</span>
          </button>

          <button 
            onClick={() => onChangeView(ViewState.PROFILE)}
            className={`flex flex-col items-center gap-1 transition-all w-14 ${currentView === ViewState.PROFILE ? 'text-primary-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icons.User size={24} fill={currentView === ViewState.PROFILE ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};