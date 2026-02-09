// Simple script to start the Socket.IO server
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Socket.IO server...');

// Start the Socket.IO server
const server = spawn('node', [path.join(__dirname, 'socket-server.js')], {
  stdio: 'inherit'
});

server.on('close', (code) => {
  console.log(`Socket.IO server exited with code ${code}`);
});

server.on('error', (error) => {
  console.error('Failed to start Socket.IO server:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Socket.IO server...');
  server.kill('SIGINT');
});