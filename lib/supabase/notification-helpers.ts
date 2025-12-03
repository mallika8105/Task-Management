import { supabase } from "./client";

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: 'task_assigned' | 'task_completed' | 'task_in_progress' | 'comment_added' | 'task_updated' | 'message_sent' | 'pr_raised' | 'user_signup' | 'user_login';
  title: string;
  message: string;
  related_task_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

/**
 * Create a new notification
 */
export async function createNotification({
  recipientId,
  senderId,
  type,
  title,
  message,
  relatedTaskId = null,
}: {
  recipientId: string;
  senderId: string | null;
  type: Notification['type'];
  title: string;
  message: string;
  relatedTaskId?: string | null;
}) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        title,
        message,
        related_task_id: relatedTaskId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { data: null, error };
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        sender:sender_id (
          full_name,
          email
        )
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { data: null, error };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error: any) {
    // Only log meaningful errors
    if (error && (error.message || error.code || Object.keys(error).length > 0)) {
      console.error("Error fetching unread notification count:", error);
    }
    return { count: 0, error };
  }
}

/**
 * Mark notification as read (deletes the notification)
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { data: null, error };
  }
}

/**
 * Mark all notifications as read for a user (deletes all notifications)
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", userId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return { data: null, error };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error };
  }
}

/**
 * Helper to create notification for task assignment
 */
export async function notifyTaskAssignment(
  taskId: string,
  assignedToId: string,
  assignedById: string,
  taskTitle: string
) {
  return createNotification({
    recipientId: assignedToId,
    senderId: assignedById,
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You have been assigned a new task: "${taskTitle}"`,
    relatedTaskId: taskId,
  });
}

/**
 * Helper to create notification for task completion
 */
export async function notifyTaskCompletion(
  taskId: string,
  adminId: string,
  completedById: string,
  taskTitle: string
) {
  return createNotification({
    recipientId: adminId,
    senderId: completedById,
    type: "task_completed",
    title: "Task Completed",
    message: `Task "${taskTitle}" has been marked as completed`,
    relatedTaskId: taskId,
  });
}

/**
 * Helper to create notification for new comment
 */
export async function notifyNewComment(
  taskId: string,
  recipientId: string,
  commenterId: string,
  taskTitle: string,
  commentText: string
) {
  const truncatedComment = commentText.length > 50 
    ? commentText.substring(0, 50) + "..." 
    : commentText;
  
  return createNotification({
    recipientId: recipientId,
    senderId: commenterId,
    type: "comment_added",
    title: "New Comment",
    message: `New comment on "${taskTitle}": ${truncatedComment}`,
    relatedTaskId: taskId,
  });
}

/**
 * Helper to create notification for task update
 */
export async function notifyTaskUpdate(
  taskId: string,
  assignedToId: string,
  updatedById: string,
  taskTitle: string,
  updateDetails: string
) {
  return createNotification({
    recipientId: assignedToId,
    senderId: updatedById,
    type: "task_updated",
    title: "Task Updated",
    message: `Task "${taskTitle}" has been updated: ${updateDetails}`,
    relatedTaskId: taskId,
  });
}

/**
 * Helper to create notification for user signup
 */
export async function notifyUserSignup(
  adminId: string,
  newUserId: string,
  newUserName: string,
  newUserEmail: string
) {
  return createNotification({
    recipientId: adminId,
    senderId: newUserId,
    type: "user_signup",
    title: "New User Signup",
    message: `${newUserName} (${newUserEmail}) has accepted the invitation and signed up`,
    relatedTaskId: null,
  });
}

/**
 * Helper to create notification for user login
 * Prevents duplicate notifications within 1 hour and cleans up old login notifications
 */
export async function notifyUserLogin(
  adminId: string,
  userId: string,
  userName: string,
  userEmail: string
) {
  try {
    // Check for existing login notification from this user to this admin within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", adminId)
      .eq("sender_id", userId)
      .eq("type", "user_login")
      .gte("created_at", oneHourAgo);

    // If a recent notification exists, skip creating a new one
    if (existingNotifications && existingNotifications.length > 0) {
      console.log(`Skipping duplicate login notification for user ${userId} to admin ${adminId}`);
      return { data: null, error: null };
    }

    // Delete old login notifications from this user to this admin (older than 1 hour)
    await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", adminId)
      .eq("sender_id", userId)
      .eq("type", "user_login")
      .lt("created_at", oneHourAgo);

    // Create new notification
    return createNotification({
      recipientId: adminId,
      senderId: userId,
      type: "user_login",
      title: "User Login",
      message: `${userName} (${userEmail}) has logged in successfully`,
      relatedTaskId: null,
    });
  } catch (error) {
    console.error("Error in notifyUserLogin:", error);
    return { data: null, error };
  }
}

/**
 * Helper to create notification for task in progress
 */
export async function notifyTaskInProgress(
  taskId: string,
  adminId: string,
  startedById: string,
  taskTitle: string
) {
  return createNotification({
    recipientId: adminId,
    senderId: startedById,
    type: "task_in_progress",
    title: "Task Started",
    message: `Task "${taskTitle}" has been marked as in progress`,
    relatedTaskId: taskId,
  });
}
