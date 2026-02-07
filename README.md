# MeetMe - Real Time Chat Application

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Overview

MeetMe is a modern, real-time chat application built with React and powered by Supabase backend services. The app features enterprise-grade messaging capabilities with AI integration for smart replies, summaries, and translation.

## Features

- 💬 **Real-time Messaging**: Instant messaging with delivery status indicators
- 👥 **Contact Management**: Add friends, manage contacts, and scan QR codes
- 📸 **Stories**: Share moments with temporary story posts
- 🤖 **AI Integration**: Smart replies, conversation summaries, and translation powered by Google Gemini
- 🔐 **Secure Authentication**: User authentication with Supabase Auth
- 🌙 **Dark Theme**: Beautiful dark-themed UI optimized for night use
- 📱 **Responsive Design**: Works seamlessly across devices

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: Google Gemini API
- **UI**: Custom styled components
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase account
- A Google Gemini API key (optional, for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MinThutaSawNaing/MeetMe.git
   cd MeetMe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the application:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a new project at [supabase.io](https://supabase.io)
2. Copy your Project URL and Anonymous Key from Project Settings
3. Execute the schema from `supabase/schema.sql` in your Supabase SQL Editor
4. Configure Row Level Security (RLS) policies as defined in the schema

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous API key
- `VITE_GEMINI_API_KEY`: (Optional) Your Google Gemini API key for AI features

## Project Structure

```
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # Backend service integrations
│   ├── supabaseClient.ts
│   ├── supabaseService.ts
│   └── geminiService.ts
├── supabase/           # Supabase schema
│   └── schema.sql
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Powered by Supabase for real-time backend services
- AI features powered by Google Gemini
- Icons from Lucide React

## Support

For support, please open an issue in the GitHub repository.