import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyUserSignup } from "@/lib/supabase/notification-helpers";

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Create user with admin client (auto-confirms email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role || "employee",
      },
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // The trigger handle_new_user() will automatically create the user in public.users
    // So we don't need to manually insert here
    
    if (authData.user) {
      // Notify all admins about the new user signup
      try {
        const { data: admins, error: adminError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("role", "admin");

        if (!adminError && admins && admins.length > 0) {
          // Create notification for each admin
          for (const admin of admins) {
            await notifyUserSignup(
              admin.id,
              authData.user.id,
              fullName,
              email
            );
          }
        }
      } catch (notificationError) {
        console.error("Error creating admin notifications:", notificationError);
        // Don't fail the signup if notification creation fails
      }

      // Generate a session for the user so they can log in immediately
      const { data: sessionData, error: sessionError } = 
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });

      if (sessionError) {
        console.error("Error generating session:", sessionError);
        return NextResponse.json({
          success: true,
          user: authData.user,
          message: "Account created successfully! Please use the login page to sign in.",
        });
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        session: sessionData,
      });
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
