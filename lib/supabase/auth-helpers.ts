import { supabase } from "./client";
import { sendRegistrationConfirmationEmail, sendPasswordResetEmail as sendBrevoPasswordResetEmail } from '@/lib/brevo/emailService';

// Set this to true to use mock authentication for development/testing
export const USE_MOCK_AUTH = false;

// Mock user data for development
export const MOCK_ADMIN_USER = {
  id: "32d5a9d1-9ee5-4911-87ac-fd39e0275750", // Use the actual ID from auth.users
  email: "mallikam8105@gmail.com",
  user_metadata: {
    role: "admin",
    full_name: "Mallika Admin",
    avatar: "/avatars/01.png" // Add a mock avatar for consistency
  },
  role: "admin", // Custom role from public.users
  // Add other necessary user properties if your app expects them
};

// 🟢 Sign in existing user
export async function signInWithEmail(email: string, password: string) {
  if (USE_MOCK_AUTH && email === MOCK_ADMIN_USER.email && password === "pass123") {
    console.log("Using mock sign-in for admin user.");
    // Simulate a successful sign-in by returning a mock session/user data
    return { user: MOCK_ADMIN_USER, session: { access_token: "mock_token", refresh_token: "mock_refresh" } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// 🟢 Sign out current user
export async function signOut() {
  if (USE_MOCK_AUTH) {
    console.log("Using mock sign-out.");
    return; // Simulate successful sign-out
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 🟢 Get the current logged-in user (client-side safe)
export async function getCurrentUser() {
  if (USE_MOCK_AUTH) {
    console.log("Using mock getCurrentUser for admin user.");
    return MOCK_ADMIN_USER;
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return null;
    }

    if (!session) {
      return null;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return null;
    }
    
    if (!user) {
      return null;
    }

    // Fetch the user's role, profile_image, and status from the public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, profile_image, status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error getting user profile from 'public.users':", profileError);
      // If there's an error fetching the profile (e.g., no entry yet),
      // the user might have just signed up and the trigger hasn't completed yet.
      // Return null to force a re-authentication
      return null;
    }

    // Check if user is inactive - deny access if so
    if (userProfile.status === 'inactive') {
      console.log("User is inactive, signing them out");
      // Sign out the user
      await supabase.auth.signOut();
      return null;
    }

    // Combine the auth user object with the role and profile_image from the public.users table
    return { ...user, role: userProfile.role, profile_image: userProfile.profile_image };
  } catch (error) {
    console.error("Unexpected error in getCurrentUser:", error);
    return null;
  }
}

// 🟢 Sign up a new user
export async function signUpNewUser(
  email: string,
  password: string,
  fullName: string,
  role: "admin" | "employee" = "employee"
) {
  // Mocking signup is not typically needed for this scenario, but can be added if required.
  if (USE_MOCK_AUTH) {
    console.log("Mock signup called, but not fully implemented. Proceeding with real signup.");
  }
  console.log("Signing up new user with data:", { email, fullName, role }); // Debug log
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify`,
      // Skip email confirmation for invited users
      // Note: This requires "Enable email confirmations" to be disabled in Supabase settings,
      // OR the Service Role key to be used (not recommended for client-side)
    },
  });

  if (error) throw error;

  // Ensure user entry is created in public.users table
  if (data.user) {
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user exists in public.users, if not create manually
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();
    
    if (!existingUser) {
      console.log("User not found in public.users, creating manually...");
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
        }]);
      
      if (insertError) {
        console.error("Error creating user in public.users:", insertError);
      } else {
        console.log("User created successfully in public.users");
      }
    }
  }

  // If email confirmation is required (no session immediately), send Brevo email
  if (!data.session) {
    // Supabase handles sending its own verification email when `emailRedirectTo` is set.
    // If you want to *replace* Supabase's email with Brevo, you would need to:
    // 1. Disable email confirmations in your Supabase project settings.
    // 2. Manually generate and store a verification token in your database.
    // 3. Construct the verification link with your custom token.
    // 4. Send the Brevo email with this custom link.
    // 5. Implement a backend route to verify this custom token.

    // For now, we will send a *separate* Brevo email as a custom notification.
    // The user will still need to click the link from the *Supabase-generated* email
    // to complete the actual email verification process.
    const brevoVerificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify`; // Link to your app's verification page

    await sendRegistrationConfirmationEmail(
      email,
      fullName,
      brevoVerificationLink
    );
  }

  return data;
}

// 🟢 Resend confirmation email
export async function resendConfirmationEmail(email: string) {
  if (USE_MOCK_AUTH) {
    console.log("Mock resend confirmation email called.");
    return; // Simulate successful send
  }
  // When using Brevo for signup emails, resending should also use Brevo
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify`,
    },
  });

  if (error) throw error;

  // Similar to signup, send a separate Brevo email as a custom notification.
  const brevoVerificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify`;
  await sendRegistrationConfirmationEmail(
    email,
    "User", // Placeholder name, ideally fetch from DB if available
    brevoVerificationLink
  );
}

// 🟢 Send password reset email
export async function sendPasswordResetEmail(email: string, redirectTo?: string) {
  if (USE_MOCK_AUTH) {
    console.log("Mock send password reset email called.");
    return;
  }

  // Supabase's `resetPasswordForEmail` sends the email directly.
  // To use Brevo for password reset, you would typically need to:
  // 1. Disable password reset emails in your Supabase project settings.
  // 2. Create a Next.js API route (e.g., /api/auth/reset-password-proxy)
  // 3. Configure Supabase's `resetPasswordForEmail` to redirect to this proxy route.
  //    (Note: Supabase's `resetPasswordForEmail` does not return the reset token directly,
  //     it sends the email itself. The `redirectTo` URL is where the user lands *after* clicking
  //     the link in the Supabase email, and it contains the `access_token` and `refresh_token`.)
  // 4. In the proxy route, extract the `access_token` and `refresh_token` from the URL.
  // 5. Construct your Brevo reset link using these tokens (e.g., `${process.env.NEXT_PUBLIC_BASE_URL}/auth/update-password?token=${access_token}`).
  // 6. Call `sendBrevoPasswordResetEmail` with this custom link.
  // 7. Redirect the user to the actual update-password page.

  // For simplicity and to demonstrate Brevo integration, we will trigger Supabase's
  // password reset flow (which sends its own email) and *also* send a separate
  // Brevo email with a generic link to the update-password page.
  // The user should ideally use the link from the Supabase-generated email for the actual reset.

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_BASE_URL}/auth/update-password`,
  });

  if (error) throw error;

  // Send a separate Brevo email with a link to the password update page.
  // This is a demonstration of using Brevo, but the actual password reset
  // mechanism is still primarily driven by Supabase's email.
  const brevoResetLink = redirectTo || `${process.env.NEXT_PUBLIC_BASE_URL}/auth/update-password`;
  await sendBrevoPasswordResetEmail(email, "User", brevoResetLink); // Placeholder name
}
