import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { notifyUserLogin } from "@/lib/supabase/notification-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail } = body;

    if (!userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userName, userEmail" },
        { status: 400 }
      );
    }

    // Fetch all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return NextResponse.json(
        { error: "Failed to fetch admin users" },
        { status: 500 }
      );
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin users found to notify");
      return NextResponse.json(
        { message: "No admin users to notify" },
        { status: 200 }
      );
    }

    // Create notification for each admin
    const notificationPromises = adminUsers.map((admin) =>
      notifyUserLogin(admin.id, userId, userName, userEmail)
    );

    await Promise.all(notificationPromises);

    return NextResponse.json(
      { message: "Login notifications sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in login notification API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
