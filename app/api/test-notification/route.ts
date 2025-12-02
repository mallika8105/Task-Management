import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/supabase/notification-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, senderId, taskId } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: "recipientId is required" },
        { status: 400 }
      );
    }

    // Create a test notification
    const result = await createNotification({
      recipientId: recipientId,
      senderId: senderId || null,
      type: "task_assigned",
      title: "Test Notification",
      message: "This is a test notification to verify the system is working",
      relatedTaskId: taskId || null,
    });

    if (result.error) {
      console.error("Error creating test notification:", result.error);
      return NextResponse.json(
        { error: "Failed to create notification", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification created successfully",
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in test notification route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
