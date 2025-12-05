import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/supabase/notification-helpers";

export async function POST(request: NextRequest) {
  try {
    const { notificationId, markAll } = await request.json();

    if (markAll) {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data, error } = await markAllNotificationsAsRead(user.id);
      if (error) {
        return NextResponse.json(
          { error: "Failed to mark all notifications as read" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await markNotificationAsRead(notificationId);
    if (error) {
      return NextResponse.json(
        { error: "Failed to mark notification as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in POST /api/notifications/mark-read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
