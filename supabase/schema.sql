-- Supabase Schema for MeetMe Application

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
  job_title VARCHAR(100)
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants UUID[] NOT NULL, -- Array of user IDs
  last_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_group BOOLEAN DEFAULT FALSE,
  group_name VARCHAR(100)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'))
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  caption TEXT
);

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view their chats" ON chats
  FOR SELECT TO authenticated
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update their chats" ON chats
  FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(participants));

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND auth.uid() = ANY(chats.participants)
    )
  );

CREATE POLICY "Users can send messages to their chats" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND auth.uid() = ANY(chats.participants)
    )
    AND auth.uid() = messages.sender_id
  );

-- Friends policies
CREATE POLICY "Users can view their friends" ON friends
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their friends" ON friends
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Stories policies
CREATE POLICY "Users can view all stories" ON stories
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create the stories bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('stories', 'stories', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/*'], NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the stories bucket
CREATE POLICY "Allow public read access to stories" ON storage.objects FOR SELECT TO public USING (bucket_id = 'stories');

CREATE POLICY "Allow authenticated users to upload stories" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Allow users to update their own stories" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'stories');

CREATE POLICY "Allow users to delete their own stories" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'stories');

-- Set up RLS policies for the avatars bucket

-- Allow public read access to avatars (needed for displaying avatars)
CREATE POLICY "Allow public read access to avatars" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND owner = auth.uid()
);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND owner = auth.uid()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chats_participants_idx ON chats USING GIN (participants);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories (created_at DESC);
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends (user_id);