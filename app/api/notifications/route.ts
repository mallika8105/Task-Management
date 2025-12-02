import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getNotifications, getUnreadNotificationCount } from "@/lib/supabase/notification-helpers";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Get current user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user data to retrieve user ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if request is for count only
    const searchParams = request.nextUrl.searchParams;
    const countOnly = searchParams.get("countOnly") === "true";

    if (countOnly) {
      const { count, error } = await getUnreadNotificationCount(userData.id);
      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch notification count" },
          { status: 500 }
        );
      }
      return NextResponse.json({ count });
    }

    // Get notifications
    const limit = parseInt(searchParams.get("limit") || "50");
    const { data: notifications, error } = await getNotifications(userData.id, limit);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
