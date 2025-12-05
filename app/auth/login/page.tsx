"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail, resendConfirmationEmail, getCurrentUser, sendPasswordResetEmail, USE_MOCK_AUTH } from "@/lib/supabase/auth-helpers";
import { acceptInvitation } from "@/lib/supabase/invitation-helpers"; // Import acceptInvitation
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null); // New state for reset messages
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for signup success and pre-fill email
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const signupSuccess = searchParams.get("signup");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (signupSuccess === "success") {
      setResetMessage("Account created successfully! You can now log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetMessage(null); // Clear reset message on login attempt

    try {
      // Use mock sign-in if USE_MOCK_AUTH is true
      if (USE_MOCK_AUTH && email === "mallikam8105@gmail.com" && password === "pass123") {
        console.log("Mock login successful.");
        const user = await getCurrentUser(); // This will return the mock admin user
        if (user && user.role === 'admin') { // Check user.role directly from mock user
          router.push("/admin/dashboard");
        } else {
          setError("Mock login successful, but user is not an admin.");
        }
      } else {
        // Proceed with real Supabase sign-in
        await signInWithEmail(email, password);
        const user = await getCurrentUser(); // Fetch the latest user data after sign-in

        if (user) {
          // Mark invitation as accepted after successful signup/login
          await acceptInvitation(email, user.id);

          // Route based on the checkbox selection
          if (isAdmin) {
            if (user.role === "admin") {
              router.push("/admin/dashboard");
            } else {
              setError("You don't have admin privileges.");
              return;
            }
          } else {
            // Send login notification to admins (only for non-admin users)
            if (user.role !== 'admin') {
              try {
                await fetch('/api/auth/login-notification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    userName: user.user_metadata?.full_name || email,
                    userEmail: email,
                  }),
                });
              } catch (notifErr) {
                // Log error but don't block login
                console.error('Failed to send login notification:', notifErr);
              }
              router.push("/dashboard");
            } else {
              setError("Please check 'I am admin' if you have admin privileges.");
              return;
            }
          }
        } else {
          setError("Login successful, but could not retrieve user data. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Sign-in error:", err); // Log the full error object
      
      // Handle different error types
      let errorMessage = "An unexpected error occurred.";
      
      if (err?.message) {
        errorMessage = err.message;
        
        // Check for specific error messages
        if (err.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email to confirm your account before signing in.";
        } else if (err.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (err.message.includes("User not found")) {
          errorMessage = "No account found with this email. Please sign up first.";
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (err?.error) {
        errorMessage = err.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError(null);
    setResetMessage(null); // Clear reset message on resend attempt
    try {
      await resendConfirmationEmail(email);
      setResetMessage("A new confirmation email has been sent. Please check your inbox."); // Changed to setResetMessage
    } catch (err: any) {
      console.error("Resend confirmation error:", err);
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setResetMessage(null);
    try {
      await sendPasswordResetEmail(email);
      setResetMessage("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-gray-900">Sign in</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                suppressHydrationWarning={true}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* Temporarily disable Forgot password? link when using mock auth */}
                {!USE_MOCK_AUTH && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-xs text-gray-600 hover:text-gray-900"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    suppressHydrationWarning={true}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 pr-10"
                  suppressHydrationWarning={true}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                id="admin-checkbox"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="admin-checkbox" className="ml-2 text-sm text-gray-600 cursor-pointer">
                I am admin
              </Label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {resetMessage && <p className="text-green-500 text-sm">{resetMessage}</p>} {/* Display reset message */}
            <Button type="submit" className="w-full" disabled={loading} suppressHydrationWarning={true}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            {error === "Please check your email to confirm your account before signing in." && (
              <Button
                type="button"
                variant="link"
                className="w-full mt-2"
                onClick={handleResendConfirmation}
                disabled={loading}
                suppressHydrationWarning={true}
              >
                Resend Confirmation Email
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
