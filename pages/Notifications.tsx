import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { supabaseDB as mockDB } from '../services/supabaseService';
import { Icons } from '../components/Icon';

interface NotificationsProps {
  currentUser: User;
}

const Notifications: React.FC<NotificationsProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('all');

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // In a real implementation, we would fetch from database
        // For now, we'll create mock notifications
        const mockNotifications: Notification[] = [
          {
            id: '1',
            user_id: currentUser.id,
            type: 'message',
            title: 'New Message',
            message: 'You have a new message from John',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_read: false,
            metadata: { sender: 'John', chat_id: 'chat1' }
          },
          {
            id: '2',
            user_id: currentUser.id,
            type: 'login',
            title: 'Login Alert',
            message: 'New login detected from your account',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            is_read: true,
            metadata: { ip: '192.168.1.100', location: 'New York, NY' }
          },
          {
            id: '3',
            user_id: currentUser.id,
            type: 'config_change',
            title: 'Settings Updated',
            message: 'Your profile settings have been updated',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            is_read: true,
            metadata: { changed_fields: ['avatar_url', 'job_title'] }
          },
          {
            id: '4',
            user_id: currentUser.id,
            type: 'system',
            title: 'System Maintenance',
            message: 'Scheduled maintenance completed successfully',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            is_read: true,
            metadata: { maintenance_type: 'database_optimization' }
          }
        ];
        
        setNotifications(mockNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    };

    loadNotifications();
  }, [currentUser.id]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <Icons.Message size={20} className="text-blue-500" />;
      case 'login':
        return <Icons.User size={20} className="text-green-500" />;
      case 'config_change':
        return <Icons.Settings size={20} className="text-yellow-500" />;
      case 'system':
        return <Icons.Briefcase size={20} className="text-purple-500" />;
      default:
        return <Icons.Bell size={20} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'login':
        return 'border-green-500/30 bg-green-500/10';
      case 'config_change':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'system':
        return 'border-purple-500/30 bg-purple-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.is_read;
    }
    if (activeTab === 'system') {
      return notification.type === 'system' || notification.type === 'config_change';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-full pt-6 pb-20">
      <header className="px-6 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          {unreadCount > 0 
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up! No new notifications.'
          }
        </p>
      </header>

      {/* Tabs */}
      <div className="px-6 mb-4 flex gap-2">
        {(['all', 'unread', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                : 'bg-dark-surface text-gray-400 hover:text-white hover:bg-dark-border'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center p-10 opacity-50 flex flex-col items-center">
            <div className="bg-dark-surface p-4 rounded-full mb-4">
              <Icons.Bell size={32} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium">No notifications found</p>
            <p className="text-gray-500 text-xs mt-2">
              {activeTab === 'unread' 
                ? 'All notifications are read'
                : activeTab === 'system'
                ? 'No system notifications'
                : 'No notifications yet'
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02] ${
                notification.is_read
                  ? 'bg-dark-surface/30 border-dark-border/30'
                  : `bg-dark-surface/50 ${getNotificationColor(notification.type)}`
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-sm ${
                      notification.is_read ? 'text-gray-300' : 'text-white'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    notification.is_read ? 'text-gray-400' : 'text-gray-300'
                  }`}>
                    {notification.message}
                  </p>
                  {notification.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      {notification.type === 'message' && notification.metadata.sender && (
                        <span>From: {notification.metadata.sender}</span>
                      )}
                      {notification.type === 'login' && notification.metadata.location && (
                        <span>Location: {notification.metadata.location}</span>
                      )}
                      {notification.type === 'config_change' && notification.metadata.changed_fields && (
                        <span>Changed: {notification.metadata.changed_fields.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
                {!notification.is_read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;