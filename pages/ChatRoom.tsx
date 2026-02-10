import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { notificationService } from '../services/notificationService';
import { generateSmartReply, chatWithBot, summarizeChat, translateMessage } from '../services/geminiService';
import { Icons } from '../components/Icon';

interface ChatRoomProps {
  currentUser: User;
  chatId: string;
  onBack: () => void;
  apiKey: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ currentUser, chatId, onBack, apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBotChat = partner?.id === 'uid_ai_bot';

  useEffect(() => {
    // Load chat details
    const loadDetails = async () => {
        const chats = await mockDB.getChats(currentUser.id);
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            const partnerId = chat.participants.find(p => p !== currentUser.id);
            if (partnerId) {
                const u = await mockDB.getUserById(partnerId);
                if (u) setPartner(u);
            }
        }
    };
    loadDetails();
  }, [chatId, currentUser.id]);

  useEffect(() => {
    const loadMsgs = async () => {
        const msgs = await mockDB.getMessages(chatId);
        setMessages(msgs);
        
        // Mark messages as read when chat is opened
        try {
          await mockDB.markMessagesAsRead(chatId, currentUser.id);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
    };
    loadMsgs();
  }, [chatId, currentUser.id]);
  
  useEffect(() => {
    console.log('Setting up real-time subscription for chat:', chatId);
    
    // Initialize notification service
    notificationService.initialize();
    
    // Set up real-time subscription for new messages
    const unsubscribe = mockDB.subscribeToChatMessages(chatId, async (newMessage) => {
      console.log('Received real-time message:', newMessage);
      
      // Show notification if message is from another user and app is not focused
      if (newMessage.sender_id !== currentUser.id && !notificationService.isAppFocused()) {
        try {
          // Get sender info to display in notification
          const sender = await mockDB.getUserById(newMessage.sender_id);
          
          notificationService.showNotification({
            title: sender?.username || 'New Message',
            body: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
            data: {
              chatId: chatId,
              senderId: newMessage.sender_id,
              senderName: sender?.username
            }
          });
        } catch (error) {
          console.error('Error getting sender info for notification:', error);
        }
      }
      
      setMessages(prev => {
        // Avoid duplicate messages by checking if message already exists
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (!exists) {
          // Check for optimistic update duplicates (same content from same sender within last 2 seconds)
          const isDuplicateOptimistic = prev.some(msg => 
            msg.sender_id === newMessage.sender_id &&
            msg.content === newMessage.content &&
            msg.id === 'temp' &&
            new Date(newMessage.created_at).getTime() - new Date(msg.created_at).getTime() < 2000
          );
          
          if (isDuplicateOptimistic) {
            // Replace the temporary optimistic message with the real one
            return prev.map(msg => 
              msg.id === 'temp' && 
              msg.sender_id === newMessage.sender_id && 
              msg.content === newMessage.content
                ? { ...newMessage, status: 'sent' }
                : msg
            );
          } else {
            // Add new message and sort by timestamp to maintain order
            const updatedMessages = [...prev, newMessage];
            return updatedMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
        }
        return prev;
      });
    });
    
    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription for chat:', chatId);
      unsubscribe();
    };
  }, [chatId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;
    
    // Optimistic Update
    const tempMsg: Message = {
        id: 'temp',
        chat_id: chatId,
        sender_id: currentUser.id,
        content: text,
        created_at: new Date().toISOString(),
        status: 'sent'
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setSuggestedReply(null); // Clear suggestion

    try {
      // Send to Supabase
      const sentMessage = await mockDB.sendMessage(chatId, currentUser.id, text);
      
      // Update the temp message with the real one from DB
      setMessages(prev => 
        prev.map(msg => 
          msg.id === 'temp' && 
          msg.sender_id === currentUser.id && 
          msg.content === text &&
          // Additional safety check: ensure we're replacing the most recent temp message
          prev.filter(m => m.id === 'temp' && m.sender_id === currentUser.id).pop() === msg
            ? { ...sentMessage, status: 'sent' } // Use the actual message from DB
            : msg
        )
      );

      // If talking to Bot
      if (isBotChat) {
          setIsAiThinking(true);
          const reply = await chatWithBot([...messages, sentMessage]);
          await mockDB.sendMessage(chatId, 'uid_ai_bot', reply, true);
          setIsAiThinking(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== 'temp'));
      alert('Failed to send message. Please try again.');
    }
  };

  const requestAiSuggestion = async () => {
    if (!apiKey) { alert("Please configure API Key in Profile."); return; }
    setIsAiThinking(true);
    const suggestion = await generateSmartReply(messages, currentUser.id);
    setSuggestedReply(suggestion);
    setIsAiThinking(false);
  };

  const handleSummarize = async () => {
      setShowMenu(false);
      if (!apiKey) { alert("Enterprise feature: Requires API Key."); return; }
      setIsAiThinking(true);
      const summary = await summarizeChat(messages, currentUser.id);
      setSummaryText(summary);
      setShowSummary(true);
      setIsAiThinking(false);
  };

  const handleTranslate = async (msgId: string, text: string) => {
      if (!apiKey) return;
      // Optimistic visual feedback could be added here
      const translated = await translateMessage(text);
      alert(`Translation:\n\n${translated}`); // Simple alert for demo, better UI would replace text or show modal
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Enterprise Header */}
      <div className="flex items-center gap-3 p-3 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border z-20 shadow-sm relative">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <Icons.Back size={24} />
        </button>
        {partner && (
            <div className="flex-1 flex items-center gap-3">
                <div className="relative">
                    <img src={partner.avatar_url} className="w-10 h-10 rounded-full border border-dark-border" alt="" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-surface ${partner.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                </div>
                <div>
                    <h2 className="font-bold leading-none text-sm">{partner.username}</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">{partner.job_title || 'Colleague'}</p>
                </div>
            </div>
        )}
        <div className="flex items-center gap-1">
             <button 
                className="p-2 hover:bg-white/10 rounded-full text-primary-400" 
                title="Voice Call (Mocked)"
                onClick={() => alert('Voice call feature is not implemented yet')}
            >
                <Icons.Phone size={20} />
            </button>
            <button 
                className="p-2 hover:bg-white/10 rounded-full text-primary-400" 
                title="Video Call (Mocked)"
                onClick={() => alert('Video call feature is not implemented yet')}
            >
                <Icons.Video size={20} />
            </button>
            <button 
                className="p-2 hover:bg-white/10 rounded-full text-gray-400"
                onClick={() => setShowMenu(!showMenu)}
            >
                <Icons.More size={20} />
            </button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
            <div className="absolute top-full right-4 mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden animate-pop z-50">
                <button 
                    onClick={handleSummarize}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2 text-white"
                >
                    <Icons.Sparkles size={16} className="text-yellow-500" />
                    Summarize Chat
                </button>
                <button className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2 text-gray-300">
                    <Icons.Search size={16} />
                    Search in Chat
                </button>
                <button className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2 text-red-400 border-t border-dark-border">
                    <Icons.LogOut size={16} />
                    Block User
                </button>
            </div>
        )}
      </div>

      {/* Summary Modal */}
      {showSummary && (
          <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
              <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                  <button onClick={() => setShowSummary(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                      <Icons.Close size={20} />
                  </button>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Icons.Bot className="text-primary-500" />
                      AI Summary
                  </h3>
                  <div className="prose prose-invert prose-sm max-h-[60vh] overflow-y-auto text-gray-300">
                      <p className="whitespace-pre-line leading-relaxed">{summaryText}</p>
                  </div>
              </div>
          </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    <div 
                        className={`
                            max-w-[75%] p-3 rounded-2xl text-sm relative shadow-sm
                            ${isMe 
                                ? 'bg-primary-600 text-white rounded-tr-sm' 
                                : 'bg-dark-surface text-gray-100 rounded-tl-sm border border-dark-border'
                            }
                        `}
                        onDoubleClick={() => handleTranslate(msg.id, msg.content)}
                    >
                        {msg.content}
                        <div className={`flex items-center gap-1 mt-1 opacity-60 text-[10px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {msg.is_ai_generated && <Icons.Bot size={10} />}
                            {isMe && (
                                <span className="ml-1 text-blue-200">
                                    <Icons.CheckCheck size={12} />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
        {isAiThinking && (
             <div className="flex justify-start animate-fade-in">
                 <div className="bg-dark-surface border border-dark-border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                     <Icons.Bot size={16} className="text-primary-500 animate-pulse" />
                     <span className="text-xs text-gray-400">Thinking...</span>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestion Bubble */}
      {suggestedReply && (
          <div className="px-4 pb-2 animate-slide-up">
              <div className="bg-gradient-to-r from-dark-surface to-primary-900/20 border border-primary-500/30 rounded-xl p-3 flex justify-between items-center shadow-lg">
                  <div className="text-xs text-primary-200 italic flex-1 mr-2">
                      <span className="font-bold not-italic text-primary-500 mr-2">Suggestion:</span>
                      "{suggestedReply}"
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSuggestedReply(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
                        <Icons.Close size={14} />
                    </button>
                    <button onClick={() => handleSend(suggestedReply)} className="bg-primary-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20">
                        Send
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-dark-surface border-t border-dark-border">
        <div className="flex items-end gap-2 bg-dark-bg p-2 rounded-2xl border border-dark-border focus-within:border-primary-500 transition-colors">
            
            <button className="p-2.5 text-gray-500 hover:text-white transition-colors">
                <Icons.Plus size={20} />
            </button>

            <div className="flex-1 min-w-0 py-2">
                 <textarea 
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none text-sm max-h-24"
                    style={{ minHeight: '20px' }}
                />
            </div>
            
            {!isBotChat && apiKey && (
                <button 
                    onClick={requestAiSuggestion}
                    className={`p-2.5 rounded-xl transition-all ${isAiThinking ? 'text-gray-500' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                    disabled={isAiThinking}
                    title="Get AI Suggestion"
                >
                    <Icons.Sparkles size={20} />
                </button>
            )}

            <button 
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-xl transition-all ${inputText.trim() ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-dark-surface text-gray-600'}`}
            >
                <Icons.Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;