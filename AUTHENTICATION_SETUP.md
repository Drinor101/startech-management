# Authentication Setup Guide

This guide will help you set up authentication with Supabase for the Startech application.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase project URL and anon key

## Step 1: Environment Variables

1. Copy your Supabase project URL and anon key from your Supabase dashboard
2. Update the `.env.local` file with your actual values:

```env
VITE_SUPABASE_URL=your_actual_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

## Step 2: Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-setup.sql` to create the necessary tables and policies

## Step 3: Create Admin User

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Create a user with:
   - Email: `admin@startech.com` (or your preferred admin email)
   - Password: Choose a secure password
   - Auto Confirm User: Yes
5. After creating the user, go to the SQL Editor and run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@startech.com';
```

### Option 2: Using the Script

1. Add your Supabase service role key to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. Install dependencies and run the script:
```bash
npm install dotenv
node create-admin.js
```

## Step 4: Test the Application

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the application
3. You should see the login form
4. Use your admin credentials to log in

## Features

- ✅ Login form with email and password
- ✅ Protected routes (requires authentication)
- ✅ Role-based access control (admin/user)
- ✅ User profile display in header
- ✅ Logout functionality
- ✅ Automatic session management
- ✅ Loading states and error handling

## User Roles

- **Admin**: Full access to all features
- **User**: Standard user access (can be customized)

## Security Features

- Row Level Security (RLS) enabled on users table
- Secure password authentication via Supabase Auth
- Protected routes that require authentication
- Role-based access control

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure your `.env.local` file has the correct Supabase URL and anon key

2. **"Failed to fetch user profile"**
   - Ensure the `users` table exists and has the correct structure
   - Check that RLS policies are properly configured

3. **Login not working**
   - Verify the user exists in Supabase Auth
   - Check that the user has a corresponding record in the `users` table

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correctly set
4. Check that the database tables and policies are properly created
