const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your_supabase_url';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_key';

// Initialize Supabase client for database operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO Server Running');
});

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', async (userData) => {
    try {
      console.log('Authenticating user:', userData.userId);
      
      // Store user connection
      connectedUsers.set(userData.userId, {
        socketId: socket.id,
        userId: userData.userId,
        username: userData.username,
        status: 'online'
      });

      // Update user status in database
      await supabase
        .from('users')
        .update({ status: 'online' })
        .eq('id', userData.userId);

      // Join user to their personal room
      socket.join(`user-${userData.userId}`);
      
      // Join user to all their chat rooms
      const { data: userChats } = await supabase
        .from('chats')
        .select('id')
        .contains('participants', [userData.userId]);
      
      if (userChats) {
        userChats.forEach(chat => {
          socket.join(`chat-${chat.id}`);
        });
      }

      // Notify other users that this user is online
      socket.broadcast.emit('user-status-changed', {
        userId: userData.userId,
        status: 'online',
        username: userData.username
      });

      // Send connection success
      socket.emit('authenticated', { success: true });

    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authenticated', { success: false, error: error.message });
    }
  });

  // Handle sending messages
  socket.on('send-message', async (messageData) => {
    try {
      console.log('Message received:', messageData);
      
      // Save message to database
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: messageData.chatId,
          sender_id: messageData.senderId,
          content: messageData.content,
          created_at: new Date().toISOString(),
          is_ai_generated: messageData.isAiGenerated || false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update chat's last message and timestamp
      await supabase
        .from('chats')
        .update({
          last_message: messageData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageData.chatId);

      // Broadcast message to chat room
      socket.to(`chat-${messageData.chatId}`).emit('new-message', savedMessage);

      // Send confirmation to sender
      socket.emit('message-sent', { messageId: savedMessage.id });

    } catch (error) {
      console.error('Message sending error:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  // Handle user status updates
  socket.on('update-status', async (statusData) => {
    try {
      const user = connectedUsers.get(statusData.userId);
      if (user) {
        user.status = statusData.status;
        
        // Update in database
        await supabase
          .from('users')
          .update({ status: statusData.status })
          .eq('id', statusData.userId);

        // Notify all users
        socket.broadcast.emit('user-status-changed', {
          userId: statusData.userId,
          status: statusData.status
        });
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove user
    for (const [userId, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        connectedUsers.delete(userId);
        
        // Update user status to offline
        try {
          await supabase
            .from('users')
            .update({ status: 'offline' })
            .eq('id', userId);
          
          // Notify others
          socket.broadcast.emit('user-status-changed', {
            userId: userId,
            status: 'offline'
          });
        } catch (error) {
          console.error('Disconnect update error:', error);
        }
        break;
      }
    }
  });
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  // Set all users to offline
  connectedUsers.forEach(async (userData, userId) => {
    try {
      await supabase
        .from('users')
        .update({ status: 'offline' })
        .eq('id', userId);
    } catch (error) {
      console.error('Shutdown update error:', error);
    }
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});