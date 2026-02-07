# Supabase Setup Instructions for MeetMe Application

This document provides instructions for setting up the Supabase backend for the MeetMe application.

## Prerequisites

1. Sign up for a free account at [supabase.io](https://supabase.io)
2. Have the Supabase CLI installed (optional but recommended)

## Step 1: Create a New Supabase Project

1. Log in to your Supabase dashboard at [supabase.io/dashboard](https://supabase.io/dashboard)
2. Click "New Project"
3. Fill in the project details:
   - Project name: MeetMe
   - Region: Choose the closest region to your users
   - Database password: Create a strong password
4. Click "Create new project"
5. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Set up the Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql` file
3. Execute the SQL to create all tables, policies, and indexes

Alternatively, if you have the Supabase CLI installed:

```bash
supabase db push
```

## Step 3: Configure Authentication

1. In your Supabase dashboard, navigate to "Authentication" → "Providers"
2. Enable the providers you want to use (Email, Social, etc.)
3. For email/password authentication:
   - Go to "Settings" under Authentication
   - Enable "Email confirmations"
   - Configure any other settings as needed

## Step 4: Get Your Project Credentials

1. In your Supabase dashboard, go to your project settings
2. Click on the "Project Settings" tab
3. Note down:
   - **Project URL** (this is your SUPABASE_URL)
   - **anon public API key** (this is your SUPABASE_ANON_KEY)

## Step 5: Configure Environment Variables

1. Create or update the `.env` file in your project root with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the actual values from Step 4.

## Step 6: Run the Application

After setting up the environment variables, you can run the application as usual:

```bash
npm install
npm run dev
```

## Step 7: Enable Real-time Features (Optional)

The Supabase service includes hooks for real-time functionality. To enable real-time features:

1. In your Supabase dashboard, go to "Database" → "Replication"
2. Enable logical replication for the tables you want to listen to (messages, chats, etc.)
3. Make sure RLS policies are correctly configured to allow real-time subscriptions

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**: Make sure your `.env` file is in the root of your project and the variables are prefixed with `VITE_`.

2. **Connection Errors**: Verify that your Supabase project URL and anon key are correct.

3. **Permission Denied**: Check that your RLS policies are set up correctly in the Supabase dashboard.

4. **Tables Not Found**: Ensure that the schema.sql file was executed successfully and all tables were created.

### Testing the Connection

You can test the connection by adding a simple log in your service:

```typescript
if (supabase) {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Connection test failed:', error);
  } else {
    console.log('Connection successful, found', data?.length, 'users');
  }
}
```

## Security Notes

1. The schema includes Row Level Security (RLS) policies to protect user data
2. Users can only access their own data and data shared with them
3. Always validate inputs on the client-side and rely on RLS for server-side protection
4. For production, consider using service roles for administrative tasks

## Production Deployment

When deploying to production:

1. Create separate staging and production Supabase projects
2. Use environment-specific credentials
3. Set up proper monitoring and analytics
4. Consider setting up a custom domain for your Supabase URL