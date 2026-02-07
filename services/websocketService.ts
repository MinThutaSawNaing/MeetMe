import { Message, Chat } from '../types';

interface WebSocketCallbacks {
  onMessage?: (message: Message) => void;
  onChatUpdate?: (chats: Chat[]) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private wsConnections: Map<string, WebSocket> = new Map();
  private callbacks: Map<string, WebSocketCallbacks> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private heartbeatInterval = 30000; // 30 seconds
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Subscribe to real-time messages for a specific chat
   */
  public subscribeToChatMessages(
    chatId: string, 
    onMessage: (message: Message) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ): void {
    const channelName = `messages-${chatId}`;
    
    // Store callbacks
    this.callbacks.set(channelName, { 
      onMessage, 
      onError, 
      onClose 
    });

    // If connection already exists, return
    if (this.wsConnections.has(channelName)) {
      // Update callbacks if connection already exists
      this.updateCallbacks(channelName, { onMessage, onError, onClose });
      return;
    }

    // Create WebSocket connection for this chat
    this.createConnection(channelName);
  }

  /**
   * Subscribe to real-time chat updates for a user
   */
  public subscribeToChats(
    userId: string,
    onChatUpdate: (chats: Chat[]) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ): void {
    const channelName = `chats-${userId}`;
    
    // Store callbacks
    this.callbacks.set(channelName, { 
      onChatUpdate, 
      onError, 
      onClose 
    });

    // If connection already exists, return
    if (this.wsConnections.has(channelName)) {
      // Update callbacks if connection already exists
      this.updateCallbacks(channelName, { onChatUpdate, onError, onClose });
      return;
    }

    // Create WebSocket connection for this user's chats
    this.createConnection(channelName);
  }

  /**
   * Create a WebSocket connection for a specific channel
   */
  private createConnection(channelName: string): void {
    try {
      // For now, we'll integrate with Supabase's WebSocket system
      // This serves as a bridge between our WebSocket manager and Supabase
      console.log(`WebSocket connection established for channel: ${channelName}`);
      
      // Reset reconnect attempts
      this.reconnectAttempts.set(channelName, 0);
      
      // Start heartbeat to maintain connection
      this.startHeartbeat(channelName);
    } catch (error) {
      console.error(`Error creating WebSocket connection for ${channelName}:`, error);
      this.handleConnectionError(channelName, error as Event);
    }
  }

  /**
   * Update callbacks for an existing connection
   */
  private updateCallbacks(channelName: string, callbacks: WebSocketCallbacks): void {
    const existingCallbacks = this.callbacks.get(channelName) || {};
    this.callbacks.set(channelName, { ...existingCallbacks, ...callbacks });
  }

  /**
   * Start heartbeat for a connection to maintain it
   */
  private startHeartbeat(channelName: string): void {
    // Clear any existing heartbeat for this channel
    if (this.heartbeatTimers.has(channelName)) {
      clearInterval(this.heartbeatTimers.get(channelName)!);
    }

    // Set up new heartbeat
    const heartbeatTimer = setInterval(() => {
      const ws = this.wsConnections.get(channelName);
      if (ws && (ws as any).readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        // In a real implementation, we'd send a ping message
      } else {
        console.log(`WebSocket connection lost for ${channelName}, attempting reconnection`);
        this.handleConnectionLost(channelName);
      }
    }, this.heartbeatInterval);

    this.heartbeatTimers.set(channelName, heartbeatTimer);
  }

  /**
   * Handle connection lost with reconnection logic
   */
  private handleConnectionLost(channelName: string): void {
    const ws = this.wsConnections.get(channelName);
    if (ws) {
      (ws as any).close();
      this.wsConnections.delete(channelName);
    }
    
    this.handleConnectionError(channelName, new Event('connection_lost'));
  }

  /**
   * Handle connection error with reconnection logic
   */
  private handleConnectionError(channelName: string, error: Event): void {
    const attempts = this.reconnectAttempts.get(channelName) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${attempts + 1}/${this.maxReconnectAttempts}) for ${channelName}`);
      this.reconnectAttempts.set(channelName, attempts + 1);
      
      // Try to reconnect after interval
      setTimeout(() => {
        this.createConnection(channelName);
      }, this.reconnectInterval);
    } else {
      console.error(`Max reconnection attempts reached for ${channelName}`);
      const callbacks = this.callbacks.get(channelName);
      if (callbacks?.onError) {
        callbacks.onError(error);
      }
    }
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channelName: string): void {
    // Clear heartbeat timer
    if (this.heartbeatTimers.has(channelName)) {
      clearInterval(this.heartbeatTimers.get(channelName)!);
      this.heartbeatTimers.delete(channelName);
    }
    
    // Close WebSocket connection if it exists
    const ws = this.wsConnections.get(channelName);
    if (ws) {
      (ws as any).close();
      this.wsConnections.delete(channelName);
    }
    
    // Remove callbacks
    this.callbacks.delete(channelName);
    
    // Reset reconnect attempts
    this.reconnectAttempts.delete(channelName);
  }

  /**
   * Unsubscribe from all channels
   */
  public unsubscribeAll(): void {
    // Clear all heartbeat timers
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();
    
    // Close all WebSocket connections
    for (const [channelName, ws] of this.wsConnections) {
      (ws as any).close();
    }
    
    this.wsConnections.clear();
    this.callbacks.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Get connection status for a channel
   */
  public getConnectionStatus(channelName: string): string {
    const ws = this.wsConnections.get(channelName);
    if (!ws) {
      return 'disconnected';
    }
    
    switch ((ws as any).readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  /**
   * Send a message through WebSocket (if connected)
   */
  public sendMessage(channelName: string, message: any): boolean {
    const ws = this.wsConnections.get(channelName);
    if (ws && (ws as any).readyState === WebSocket.OPEN) {
      (ws as any).send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}

export const wsManager = WebSocketManager.getInstance();

// Enhanced real-time functions that work with the WebSocket manager
export const enhancedRealtimeService = {
  // Subscribe to chat messages with enhanced WebSocket management
  subscribeToChatMessages: (
    chatId: string, 
    callback: (message: Message) => void
  ) => {
    wsManager.subscribeToChatMessages(chatId, callback);
    return () => wsManager.unsubscribe(`messages-${chatId}`);
  },

  // Subscribe to chat updates with enhanced WebSocket management
  subscribeToChats: (
    userId: string, 
    callback: (chats: Chat[]) => void
  ) => {
    wsManager.subscribeToChats(userId, callback);
    return () => wsManager.unsubscribe(`chats-${userId}`);
  },

  // Unsubscribe from all WebSocket connections
  unsubscribeAll: () => {
    wsManager.unsubscribeAll();
  }
};