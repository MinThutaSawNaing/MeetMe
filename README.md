# MeetMe - Modern Chat Application

A feature-rich chat application built with React, TypeScript, and modern web technologies.

## Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Authentication**: Secure login system
- **Chat Management**: Create and manage individual and group chats
- **AI Integration**: Smart replies and chat summarization using Google Gemini
- **Story Sharing**: Share photos and videos with automatic expiration
- **QR Code Scanning**: Add friends via QR code scanning
- **Modern UI**: Glassmorphism design with vibrant gradients
- **Responsive Design**: Works on mobile and desktop devices

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (Database, Authentication, Storage)
- **Real-time**: Socket.IO (Custom WebSocket implementation)
- **AI Services**: Google Gemini API
- **UI Components**: Lucide React icons
- **QR Code**: @zxing/library for scanning

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd meetme
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL setup scripts from the `supabase/` directory
   - Configure storage buckets for stories

### Running the Application

**Option 1: Run both server and client (Recommended)**
```bash
# Terminal 1: Start Socket.IO server
npm run server

# Terminal 2: Start React development server
npm run dev
```

**Option 2: Run with helper script**
```bash
# This will start the Socket.IO server
npm start

# In another terminal, start the React app
npm run dev
```

The application will be available at `http://localhost:5173` and the Socket.IO server at `http://localhost:3001`.

## Real-time Communication Architecture

This application uses a custom Socket.IO implementation for real-time communication instead of Supabase's built-in real-time features.

### Key Components:

1. **Socket.IO Server** (`socket-server.js`):
   - Handles WebSocket connections
   - Manages user authentication and presence
   - Broadcasts messages to chat rooms
   - Updates user status in real-time

2. **Socket.IO Client** (`services/websocketService.ts`):
   - Manages connection lifecycle
   - Handles reconnection logic
   - Provides clean API for real-time operations
   - Automatic cleanup of subscriptions

3. **Integration Points**:
   - `ChatRoom.tsx`: Real-time message receiving
   - `ChatList.tsx`: User status updates
   - `App.tsx`: Connection management

### Migration from Supabase Real-time:

The application was migrated from Supabase's real-time subscriptions to a custom Socket.IO implementation for:
- Better control over connection management
- More flexible event handling
- Improved error handling and reconnection logic
- Custom business logic for message processing

## Development

### Project Structure

```
meetme/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # Business logic and API services
├── supabase/           # Database setup and configuration
├── types.ts            # TypeScript type definitions
└── ...
```

### Key Services

- `supabaseService.ts`: Database operations and authentication
- `websocketService.ts`: Socket.IO client implementation
- `geminiService.ts`: AI-powered features
- `supabaseClient.ts`: Supabase client configuration

## Deployment

### Frontend
Build the application:
```bash
npm run build
```

Deploy the `dist/` folder to your preferred hosting platform (Netlify, Vercel, etc.).

### Backend
Deploy the Socket.IO server to a Node.js hosting platform (Railway, Render, etc.).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.