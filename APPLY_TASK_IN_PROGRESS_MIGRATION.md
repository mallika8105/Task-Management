# Apply Task In Progress Notification Migration

## Quick Start

You need to apply a database migration to enable the new "in progress" notification feature.

## Step-by-Step Instructions

### Using Supabase Dashboard (Easiest Method)

1. **Login to Supabase**
   - Go to https://supabase.com
   - Login to your account
   - Select your Task Management System project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New query** button

3. **Run the Migration**
   - Copy and paste this SQL command:
   ```sql
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_in_progress';
   ```
   
4. **Execute**
   - Click the **Run** button (or press Ctrl+Enter)
   - You should see a success message

5. **Verify**
   - The migration is now applied
   - The application will now support "in progress" notifications

## What This Does

This adds a new notification type called `task_in_progress` to your database, which allows the system to send notifications when users mark tasks as "in progress".

## After Migration

Once the migration is applied:

1. **Test the Feature**
   - Login as a regular user
   - Open a task and change status to "In Progress"
   - The admin will receive a notification with a 🚀 rocket icon

2. **Mark as Read Behavior**
   - Notifications are now deleted when marked as read (cleaner interface)
   - "Mark all read" will delete all notifications

## Troubleshooting

**If you get an error:**
- Make sure you're connected to the correct database
- The `notification_type` enum must already exist (it should from previous migrations)
- If the value already exists, the `IF NOT EXISTS` clause will prevent errors

**If notifications don't appear:**
- Check browser console for errors
- Verify the migration was successful
- Make sure your Next.js app is running and connected to Supabase

## Need Help?

If you encounter any issues:
1. Check the full documentation in `TASK_IN_PROGRESS_NOTIFICATION_IMPLEMENTATION.md`
2. Verify your Supabase connection in `.env.local`
3. Check for any console errors in the browser

---

✅ Once this migration is applied, the task "in progress" notification feature is fully functional!
