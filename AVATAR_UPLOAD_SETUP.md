# Profile Photo Upload - Supabase Setup Guide

## Overview
This guide explains how to set up Supabase Storage for profile photo uploads with automatic compression and security policies.

## Prerequisites
- Supabase project created
- Supabase credentials configured in your `.env` file

## Setup Steps

### 1. Run the Database Schema

Execute the `schema.sql` file in your Supabase SQL editor to:

- Create the `avatars` storage bucket
- Set up Row Level Security (RLS) policies
- Configure access controls for avatar uploads

```sql
-- Run this in your Supabase SQL editor
-- Copy the contents of supabase/schema.sql and execute
```

### 2. Storage Bucket Configuration

The setup will automatically create:
- **Bucket Name**: `avatars`
- **Public Access**: Yes (required for displaying avatars)
- **File Size Limit**: 2MB
- **Allowed Types**: All image formats (`image/*`)

### 3. Security Policies Applied

The following Row Level Security policies are configured:

1. **Public Read Access**: Anyone can view avatars (needed for display)
2. **Authenticated Upload**: Only logged-in users can upload avatars
3. **Owner Updates**: Users can only update their own avatars
4. **Owner Deletion**: Users can only delete their own avatars

### 4. Manual Verification (Optional)

If you want to verify the setup manually:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Verify the `avatars` bucket exists
4. Check **Policies** tab to confirm RLS policies are applied

### 5. Testing the Feature

After setup:

1. Log in to your app
2. Go to Profile page
3. Click the "Edit" button
4. Click on your avatar to upload a new photo
5. The image will be automatically compressed to ≤1.5MB
6. The compressed image will be uploaded to Supabase Storage

## How It Works

### Automatic Compression
- Images are compressed to maximum 1.5MB
- Maintains aspect ratio with max dimensions 1024x1024px
- Converts to JPEG format for optimal compression
- Quality setting: 80% (good balance of size/quality)

### File Naming
- Format: `userId_timestamp.extension`
- Example: `123e4567-e89b-12d3-a456-426614174000_1707920400000.jpg`

### Storage Structure
```
avatars/
├── userId_timestamp.jpg
├── userId_timestamp.png
└── ...
```

## Troubleshooting

### Common Issues

1. **Upload fails with permission error**
   - Ensure user is authenticated
   - Verify RLS policies are applied correctly

2. **Avatar doesn't display**
   - Check if bucket is set to public
   - Verify the avatar URL is correct

3. **Compression fails**
   - Ensure file is a valid image format
   - Check file size is under 10MB before compression

### Debugging Steps

1. Check browser console for error messages
2. Verify Supabase credentials in `.env`
3. Confirm storage bucket exists in Supabase dashboard
4. Test with a small image file first

## Security Notes

- All avatar URLs are public for display purposes
- Only authenticated users can upload/update/delete
- Files are stored with user ID in filename for ownership tracking
- RLS policies prevent unauthorized access to storage operations

## Performance Optimization

The compression service:
- Reduces bandwidth usage
- Improves page load times
- Optimizes storage costs
- Maintains visual quality for profile display