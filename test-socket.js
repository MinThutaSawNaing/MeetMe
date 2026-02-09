// Test script for Socket.IO functionality
const io = require('socket.io-client');

console.log('Testing Socket.IO connection...');

// Connect to the server
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log('Socket ID:', socket.id);
  
  // Test authentication
  socket.emit('authenticate', {
    userId: 'test-user-123',
    username: 'TestUser'
  });
});

socket.on('authenticated', (data) => {
  console.log('✅ Authentication result:', data);
  
  if (data.success) {
    console.log('✅ Authentication successful');
    
    // Test sending a message
    socket.emit('send-message', {
      chatId: 'test-chat-123',
      senderId: 'test-user-123',
      content: 'Hello from test client!',
      isAiGenerated: false
    });
  } else {
    console.log('❌ Authentication failed:', data.error);
  }
});

socket.on('message-sent', (data) => {
  console.log('✅ Message sent confirmation:', data);
});

socket.on('new-message', (message) => {
  console.log('✅ Received message:', message);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Test timeout
setTimeout(() => {
  console.log('Test completed');
  socket.disconnect();
  process.exit(0);
}, 10000);