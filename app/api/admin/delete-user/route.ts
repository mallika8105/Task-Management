import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let email: string;
    
    try {
      const body = await request.json();
      email = body.email;
    } catch (parseError) {
      console.error("API: Failed to parse request body:", parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    console.log("API: Received request to delete user with email:", email);

    if (!email) {
      console.error("API: Email is required for deletion.");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log("API: Authorization header present:", !!authHeader);

    // Create a Supabase admin client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("API: Missing Supabase configuration");
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 });
    }

    const adminSupabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user is an admin
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("API: Authentication failed:", authError?.message);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is admin
      const { data: userData, error: fetchUserError } = await adminSupabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (fetchUserError || userData?.role !== "admin") {
        console.error("API: User is not an admin");
        return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
      }

      console.log("API: Admin user verified:", user.email);
    }

    console.log("API: Attempting to find and delete user from Supabase Auth.");
    
    // List all users and find the one with the matching email
    const { data: usersList, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("API: Error listing users from Supabase Auth:", listError);
      return NextResponse.json({ 
        error: listError.message || "Failed to list users from Supabase Auth." 
      }, { status: 500 });
    }

    console.log("API: Successfully listed", usersList.users.length, "users from Supabase Auth.");

    const userToDelete = usersList.users.find((u) => u.email === email);
    
    if (userToDelete) {
      console.log("API: Found user to delete:", userToDelete.id);
      
      // Delete from Supabase Auth
      const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(
        userToDelete.id
      );
      
      if (deleteAuthError) {
        console.error("API: Error deleting user from Supabase Auth:", deleteAuthError);
        return NextResponse.json({ 
          error: deleteAuthError.message || "Failed to delete user from Supabase Auth." 
        }, { status: 500 });
      }
      
      console.log(`API: User with ID ${userToDelete.id} deleted from Supabase Auth.`);

      // Soft delete from public.users table (mark as inactive instead of deleting)
      console.log("API: Marking user as inactive in public.users table with email:", email);
      const { error: updateUserTableError } = await adminSupabase
        .from("users")
        .update({ status: 'inactive' })
        .eq("email", email);
      
      if (updateUserTableError) {
        console.error("API: Error updating user status in public.users table:", updateUserTableError);
        return NextResponse.json({ 
          error: updateUserTableError.message || "Failed to update user status in database." 
        }, { status: 500 });
      }
      
      console.log(`API: User with email ${email} marked as inactive successfully in public.users table.`);

      return NextResponse.json({ 
        message: `User with email ${email} deleted successfully.` 
      }, { status: 200 });
    } else {
      console.log(`API: No active user found with email ${email} in Supabase Auth.`);
      return NextResponse.json({ 
        message: `No active user found with email ${email}.` 
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error("API: An unexpected error occurred during user deletion:", error);
    console.error("API: Error stack:", error.stack);
    
    // Ensure we always return valid JSON
    const errorMessage = error?.message || "An unexpected error occurred during user deletion";
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
