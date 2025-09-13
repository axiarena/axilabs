# Backend-Frontend Connection Setup Guide

## ✅ Database Setup Complete!

Great! Your database tables are now created. Let's test the connection:

## Step 1: Restart Your Development Server

```bash
npm run dev
```

## Step 2: Check Browser Console

1. Open your app in the browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for these messages:
   - `✅ Supabase connection test successful`
   - `Database is accessible and ready`

## Step 3: Test User Registration

1. Click the **Login** button in your app
2. Click **Sign Up** tab
3. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click **Create Account & Get AXI Number**

## Expected Results:

### ✅ Success Case:
- You should see a welcome popup: "🎉 Welcome to AXI AGI LAB! You are user #1"
- Check your Supabase Table Editor → user_profiles table
- You should see your new user with AXI number #1

### ❌ If Still Having Issues:

**Check Browser Console for errors:**
- Press F12 → Console tab
- Look for any red error messages
- Share the exact error message

**Common Issues:**
1. **Environment variables not loaded** - Restart dev server after creating .env
2. **Wrong Supabase URL/Key** - Double-check your .env file
3. **RLS policies too restrictive** - The SQL I provided should fix this

## Your .env File Should Look Like:

```env
VITE_SUPABASE_URL=https://thewvbhdhlcqhjpxgxp.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Next Steps After Success:

1. ✅ Create your first AXIOM
2. ✅ Save it publicly 
3. ✅ Check it appears in Browse section
4. ✅ Test all features work

Let me know what happens when you try to register a user!