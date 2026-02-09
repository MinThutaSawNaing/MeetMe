# MeetMe - Modern Chat Application

A feature-rich chat application built with React, TypeScript, and modern web technologies.

## Features

- **Email/Password Authentication**: Secure user authentication using Supabase Auth
- **Real-time Messaging**: Instant message delivery using Supabase real-time
- **User Management**: Create accounts, login, and password reset functionality
- **Chat Management**: Create and manage individual and group chats
- **AI Integration**: Smart replies and chat summarization using Google Gemini
- **Story Sharing**: Share photos and videos with automatic expiration
- **QR Code Scanning**: Add friends via QR code scanning
- **Modern UI**: Glassmorphism design with vibrant gradients
- **Responsive Design**: Works on mobile and desktop devices

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (Database, Authentication, Storage, Real-time)
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
   - Enable Email authentication provider
   - Run the SQL setup scripts from the `supabase/` directory
   - Configure storage buckets for stories
   - Enable real-time for messages, chats, and users tables

### Running the Application

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

## Authentication Setup

### Supabase Configuration:

1. **Enable Email Authentication**:
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable the Email provider
   - Configure email templates as needed

2. **Enable Real-time**:
   - Go to Supabase Dashboard → Database → Realtime
   - Enable real-time for `messages`, `chats`, and `users` tables

3. **Configure Site URL** (for password reset):
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set your Site URL to your deployment URL

## Real-time Communication Architecture

This application uses Supabase's built-in real-time features for instant message delivery and chat updates.

### Key Components:

1. **Supabase Real-time Subscriptions**:
   - Automatic message broadcasting using PostgreSQL changes
   - Real-time chat list updates
   - User status synchronization
   - Built-in connection management

2. **Integration Points**:
   - `ChatRoom.tsx`: Real-time message receiving
   - `ChatList.tsx`: Chat updates and user status
   - `App.tsx`: Subscription management

Supabase handles all the real-time infrastructure, providing:
- Reliable WebSocket connections
- Automatic reconnection
- PostgreSQL change tracking
- Scalable real-time delivery
- No additional server costs

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

- `authService.ts`: Email/password authentication and session management
- `supabaseService.ts`: Database operations and real-time subscriptions
- `geminiService.ts`: AI-powered features
- `supabaseClient.ts`: Supabase client configuration

## Deployment

### Frontend
Build the application:
```bash
npm run build
```

Deploy the `dist/` folder to your preferred hosting platform (Netlify, Vercel, etc.).

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