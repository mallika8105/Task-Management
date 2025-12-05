# Notification System Implementation Guide

## Overview
A comprehensive notification system has been implemented for the Task Management System to keep both admins and employees informed about important events.

## Features Implemented

### 1. Database Schema
- **Notifications Table**: Created with the following fields:
  - `id`: Unique identifier
  - `recipient_id`: User receiving the notification
  - `sender_id`: User who triggered the notification
  - `type`: Type of notification (task_assigned, task_completed, comment_added, task_updated, message_sent, pr_raised)
  - `title`: Notification title
  - `message`: Notification message
  - `related_task_id`: Associated task (if applicable)
  - `is_read`: Read status
  - `created_at`, `updated_at`: Timestamps

### 2. Notification Types

#### For Employees:
- ✅ **Task Assigned**: When admin assigns a new task
- ✅ **Task Updated**: When admin updates task details (status, priority, deadline)
- ✅ **Comment Added**: When admin adds a comment to their task

#### For Admins:
- ✅ **Task Completed**: When employee marks a task as completed
- ✅ **Comment Added**: When employee adds a comment to a task
- ✅ **Task Status Changed**: When employee updates task status

### 3. Real-time Updates
- Notifications update in real-time using Supabase real-time subscriptions
- Badge count updates automatically
- No page refresh required

### 4. User Interface
- **Notification Bell Icon**: Shows unread count
- **Notification Panel**: Dropdown panel with:
  - List of all notifications
  - Mark as read functionality
  - Mark all as read option
  - Click to navigate to related task
  - Notification icons and timestamps
  - Different styling for read/unread notifications

## Setup Instructions

### 1. Run Database Migration
Execute the migration file to create the notifications table:

```bash
# Navigate to your Supabase project
# Run the migration SQL file: supabase/migrations/create_notifications_table.sql
```

Or apply it directly in Supabase Studio SQL Editor:
- Go to SQL Editor in Supabase Dashboard
- Copy the contents of `supabase/migrations/create_notifications_table.sql`
- Execute the SQL

### 2. Verify Installation
The system is already integrated into:
- ✅ Admin Layout (`app/admin/layout.tsx`)
- ✅ Employee Layout (`app/(employee)/layout.tsx`)
- ✅ Task Detail Pages (both admin and employee views)

## Testing the Notification System

### Test Scenario 1: Task Assignment Notification
1. Login as **Admin**
2. Navigate to **Admin > Tasks**
3. Click "Create Task" or edit existing task
4. Assign task to an employee
5. **Expected**: Employee receives "New Task Assigned" notification

### Test Scenario 2: Task Completion Notification
1. Login as **Employee**
2. Navigate to **My Tasks**
3. Open a task
4. Change status to "Completed"
5. **Expected**: Admin receives "Task Completed" notification

### Test Scenario 3: Comment Notifications
1. **Employee adds comment**:
   - Login as Employee
   - Open a task
   - Add a comment
   - **Expected**: Admin receives "New Comment" notification

2. **Admin adds comment**:
   - Login as Admin
   - Navigate to task detail
   - Add a comment
   - **Expected**: Assigned employee receives "New Comment" notification

### Test Scenario 4: Task Update Notification
1. Login as **Admin**
2. Edit an assigned task
3. Change priority, status, or deadline
4. Save changes
5. **Expected**: Assigned employee receives "Task Updated" notification

### Test Scenario 5: Real-time Updates
1. Open two browser windows:
   - Window 1: Admin dashboard
   - Window 2: Employee dashboard
2. Perform actions that trigger notifications
3. **Expected**: Notification count updates immediately without refresh

## API Endpoints

### GET /api/notifications
Fetch notifications for current user

**Query Parameters**:
- `countOnly=true`: Returns only unread count
- `limit=50`: Number of notifications to fetch (default: 50)

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "New Task Assigned",
      "message": "You have been assigned a new task: \"Fix login bug\"",
      "type": "task_assigned",
      "is_read": false,
      "created_at": "2024-12-02T10:00:00Z",
      "sender": {
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### POST /api/notifications/mark-read
Mark notification(s) as read

**Request Body**:
```json
{
  "notificationId": "uuid"  // Mark single notification
}
```
or
```json
{
  "markAll": true  // Mark all as read
}
```

## Helper Functions

Located in `lib/supabase/notification-helpers.ts`:

- `createNotification()`: Create a new notification
- `getNotifications()`: Fetch notifications for a user
- `getUnreadNotificationCount()`: Get count of unread notifications
- `markNotificationAsRead()`: Mark single notification as read
- `markAllNotificationsAsRead()`: Mark all notifications as read
- `notifyTaskAssignment()`: Helper for task assignment notifications
- `notifyTaskCompletion()`: Helper for task completion notifications
- `notifyNewComment()`: Helper for comment notifications
- `notifyTaskUpdate()`: Helper for task update notifications

## Component: NotificationPanel

Located in `app/components/NotificationPanel.tsx`

**Props**:
- `userId`: Current user's ID
- `darkMode`: Boolean for dark mode styling

**Features**:
- Real-time subscription to notification changes
- Auto-refresh on new notifications
- Click notification to navigate to related task
- Visual indicators for unread notifications
- Time ago formatting
- Emoji icons for different notification types

## Troubleshooting

### Notifications not appearing?
1. Verify the notifications table exists in Supabase
2. Check browser console for errors
3. Verify user is logged in correctly
4. Check Supabase real-time is enabled

### Notification count not updating?
1. Check real-time subscription in browser dev tools
2. Verify Supabase real-time is configured correctly
3. Clear browser cache and reload

### Notifications not marked as read?
1. Check network requests in browser dev tools
2. Verify the mark-read API endpoint is working
3. Check Supabase permissions

## Future Enhancements

Potential additions:
- Email notifications
- Push notifications (browser)
- Notification preferences/settings
- Notification categories and filtering
- Bulk operations on notifications
- Notification sound effects
- Desktop notifications

## Security Notes

- Notifications are user-specific (filtered by recipient_id)
- No RLS policies enabled for development (should be added for production)
- All API endpoints verify user authentication
- Sensitive data should not be included in notification messages

## Database Performance

- Indexes created on:
  - `recipient_id` for fast user queries
  - `created_at` for chronological ordering
  - `is_read` for filtering unread notifications

## Maintenance

- Old notifications can be archived or deleted periodically
- Consider adding a cleanup job for notifications older than 30 days
- Monitor notification table size and performance
