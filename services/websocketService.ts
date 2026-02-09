import { io, Socket } from 'socket.io-client';
import { Message, Chat, User } from '../types';

interface SocketCallbacks {
  onMessage?: (message: Message) => void;
  onChatUpdate?: (chats: Chat[]) => void;
  onUserStatusChange?: (userData: { userId: string; status: string }) => void;
  onTyping?: (typingData: { userId: string; username: string; isTyping: boolean }) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

class SocketIOManager {
  private static instance: SocketIOManager;
  private socket: Socket | null = null;
  private callbacks: Map<string, SocketCallbacks> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnected = false;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): SocketIOManager {
    if (!SocketIOManager.instance) {
      SocketIOManager.instance = new SocketIOManager();
    }
    return SocketIOManager.instance;
  }

  /**
   * Initialize Socket.IO connection
   */
  public initialize(userId: string, username: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        resolve(true);
        return;
      }

      this.userId = userId;
      
      // Connect to Socket.IO server
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        timeout: 20000,
      });

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Socket.IO connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Authenticate user
        this.socket?.emit('authenticate', { userId, username });
        
        if (this.callbacks.has('global')) {
          const globalCallbacks = this.callbacks.get('global');
          globalCallbacks?.onConnect?.();
        }
      });

      this.socket.on('authenticated', (data) => {
        console.log('Authentication result:', data);
        resolve(data.success);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnected = false;
        
        if (this.callbacks.has('global')) {
          const globalCallbacks = this.callbacks.get('global');
          globalCallbacks?.onError?.(error);
        }
        
        this.handleReconnection();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnected = false;
        
        if (this.callbacks.has('global')) {
          const globalCallbacks = this.callbacks.get('global');
          globalCallbacks?.onDisconnect?.();
        }
        
        if (reason === 'io server disconnect') {
          // Server actively disconnected, don't reconnect automatically
          console.log('Server initiated disconnect');
        } else {
          // Client-side disconnect, attempt reconnection
          this.handleReconnection();
        }
      });

      // Handle real-time events
      this.setupEventListeners();
    });
  }

  /**
   * Setup event listeners for real-time updates
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Handle new messages
    this.socket.on('new-message', (message: Message) => {
      console.log('Received new message:', message);
      
      // Notify chat-specific callbacks
      const chatCallbacks = this.callbacks.get(`chat-${message.chat_id}`);
      if (chatCallbacks?.onMessage) {
        chatCallbacks.onMessage(message);
      }
      
      // Notify global callbacks
      const globalCallbacks = this.callbacks.get('global');
      if (globalCallbacks?.onMessage) {
        globalCallbacks.onMessage(message);
      }
    });

    // Handle user status changes
    this.socket.on('user-status-changed', (userData) => {
      console.log('User status changed:', userData);
      
      const globalCallbacks = this.callbacks.get('global');
      if (globalCallbacks?.onUserStatusChange) {
        globalCallbacks.onUserStatusChange(userData);
      }
    });

    // Handle typing indicators
    this.socket.on('user-typing', (typingData) => {
      console.log('User typing:', typingData);
      
      const chatCallbacks = this.callbacks.get(`chat-${typingData.chatId}`);
      if (chatCallbacks?.onTyping) {
        chatCallbacks.onTyping(typingData);
      }
    });

    // Handle message errors
    this.socket.on('message-error', (error) => {
      console.error('Message error:', error);
      
      const globalCallbacks = this.callbacks.get('global');
      if (globalCallbacks?.onError) {
        globalCallbacks.onError(error);
      }
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this.userId && this.socket) {
          // Re-authenticate on reconnection
          this.socket.emit('authenticate', { 
            userId: this.userId, 
            username: this.getUsername() 
          });
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Get username (you might want to store this or pass it differently)
   */
  private getUsername(): string {
    // This is a placeholder - you might want to store username in localStorage
    // or pass it through a different mechanism
    return 'User';
  }

  /**
   * Subscribe to chat messages
   */
  public subscribeToChatMessages(
    chatId: string,
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  ): void {
    const channelName = `chat-${chatId}`;
    
    this.callbacks.set(channelName, {
      onMessage,
      onError
    });
  }

  /**
   * Subscribe to user status changes
   */
  public subscribeToUserStatus(
    onUserStatusChange: (userData: { userId: string; status: string }) => void
  ): void {
    const globalCallbacks = this.callbacks.get('global') || {};
    this.callbacks.set('global', {
      ...globalCallbacks,
      onUserStatusChange
    });
  }

  /**
   * Subscribe to global events
   */
  public subscribeToGlobal(
    callbacks: Partial<SocketCallbacks>
  ): void {
    const existingCallbacks = this.callbacks.get('global') || {};
    this.callbacks.set('global', { ...existingCallbacks, ...callbacks });
  }

  /**
   * Send a message
   */
  public sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    isAiGenerated: boolean = false
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        console.error('Socket not connected');
        resolve(false);
        return;
      }

      const messageData = {
        chatId,
        senderId,
        content,
        isAiGenerated
      };

      this.socket.emit('send-message', messageData);

      // Listen for confirmation
      const handleConfirmation = (data: { messageId: string }) => {
        this.socket?.off('message-sent', handleConfirmation);
        resolve(true);
      };

      const handleError = (error: any) => {
        this.socket?.off('message-error', handleError);
        console.error('Message sending failed:', error);
        resolve(false);
      };

      this.socket.once('message-sent', handleConfirmation);
      this.socket.once('message-error', handleError);

      // Timeout after 5 seconds
      setTimeout(() => {
        this.socket?.off('message-sent', handleConfirmation);
        this.socket?.off('message-error', handleError);
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Update user status
   */
  public updateUserStatus(userId: string, status: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-status', { userId, status });
    }
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(chatId: string, userId: string, username: string, isTyping: boolean): void {
    if (this.socket && this.isConnected) {
      if (isTyping) {
        this.socket.emit('typing-start', { chatId, userId, username });
      } else {
        this.socket.emit('typing-stop', { chatId, userId, username });
      }
    }
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channelName: string): void {
    this.callbacks.delete(channelName);
  }

  /**
   * Unsubscribe from all channels
   */
  public unsubscribeAll(): void {
    this.callbacks.clear();
  }

  /**
   * Disconnect from Socket.IO server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.callbacks.clear();
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { 
    connected: boolean; 
    socketId: string | null;
    userId: string | null;
  } {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      userId: this.userId
    };
  }

  /**
   * Check if connected
   */
  public isConnectedToServer(): boolean {
    return this.isConnected && this.socket !== null;
  }
}

export const socketIOManager = SocketIOManager.getInstance();

// Enhanced real-time functions that work with Socket.IO
export const socketRealtimeService = {
  // Initialize connection
  initialize: (userId: string, username: string) => {
    return socketIOManager.initialize(userId, username);
  },

  // Subscribe to chat messages
  subscribeToChatMessages: (
    chatId: string,
    callback: (message: Message) => void
  ) => {
    socketIOManager.subscribeToChatMessages(chatId, callback);
    return () => socketIOManager.unsubscribe(`chat-${chatId}`);
  },

  // Subscribe to user status changes
  subscribeToUserStatus: (
    callback: (userData: { userId: string; status: string }) => void
  ) => {
    socketIOManager.subscribeToUserStatus(callback);
    return () => {}; // No specific cleanup needed for global subscriptions
  },

  // Send a message
  sendMessage: (
    chatId: string,
    senderId: string,
    content: string,
    isAiGenerated: boolean = false
  ) => {
    return socketIOManager.sendMessage(chatId, senderId, content, isAiGenerated);
  },

  // Update user status
  updateUserStatus: (userId: string, status: string) => {
    socketIOManager.updateUserStatus(userId, status);
  },

  // Send typing indicator
  sendTypingIndicator: (
    chatId: string,
    userId: string,
    username: string,
    isTyping: boolean
  ) => {
    socketIOManager.sendTypingIndicator(chatId, userId, username, isTyping);
  },

  // Unsubscribe from all connections
  unsubscribeAll: () => {
    socketIOManager.unsubscribeAll();
  },

  // Disconnect
  disconnect: () => {
    socketIOManager.disconnect();
  },

  // Get connection status
  getConnectionStatus: () => {
    return socketIOManager.getConnectionStatus();
  }
};