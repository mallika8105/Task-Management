"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState("");
  const [invitationRole, setInvitationRole] = useState<"admin" | "employee">("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate invitation token on mount
  useEffect(() => {
    const validateInvitation = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setError("Invalid invitation link. Please check your email for the correct link.");
        setLoading(false);
        return;
      }

      try {
        // Clear any existing session first
        await supabase.auth.signOut();

        // Fetch the invitation using the token
        const { data: invitation, error: invitationError } = await supabase
          .from("invitations")
          .select("email, role, invited_by, status")
          .eq("invitation_token", token)
          .eq("status", "pending")
          .single();

        if (invitationError || !invitation) {
          setError("This invitation link is invalid or has already been used.");
          setLoading(false);
          return;
        }

        // Get inviter's name
        const { data: inviter } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", invitation.invited_by)
          .single();

        setEmail(invitation.email);
        setInvitationRole(invitation.role);
        setInviterName(inviter?.full_name || "Zeloite Admin");
        setValidToken(true);
        setLoading(false);
      } catch (err) {
        console.error("Error validating invitation:", err);
        setError("An error occurred while validating your invitation.");
        setLoading(false);
      }
    };

    validateInvitation();
  }, [searchParams]);

  // Calculate password strength
  const checkPasswordStrength = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    setPasswordStrength({
      score,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    });
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      checkPasswordStrength(password);
    } else {
      setPasswordStrength({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Enforce strong password - all requirements must be met
    if (passwordStrength.score < 5) {
      setError("Please meet all password requirements for maximum security.");
      setLoading(false);
      return;
    }

    try {
      const token = searchParams.get("token");

      // Use the API route for invited users (auto-confirms email)
      const response = await fetch("/api/auth/signup-invited", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role: invitationRole,
          invitationToken: token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      const responseData = await response.json();

      if (responseData.user) {
        // Redirect to login page with success message
        router.push(`/auth/login?email=${encodeURIComponent(email)}&signup=success`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-lg border border-gray-200 bg-white">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if invalid token
  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md shadow-lg border border-red-200 bg-white">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-semibold text-red-600">
              Invalid Invitation
            </CardTitle>
            <CardDescription className="text-gray-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200 bg-white text-gray-900">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
            Join Zeloite Workspace
          </CardTitle>
          <CardDescription className="text-gray-700">
            <strong>{inviterName}</strong> has invited you to join their workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-gray-800">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-800">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-200 text-gray-700 border-gray-300 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">This email is pre-filled from your invitation</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-800">
                Create Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.score === 5 ? 'text-green-600' :
                      passwordStrength.score >= 4 ? 'text-blue-600' :
                      passwordStrength.score >= 3 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.score === 5 ? 'Very Strong' :
                       passwordStrength.score === 4 ? 'Strong' :
                       passwordStrength.score === 3 ? 'Medium' :
                       passwordStrength.score === 2 ? 'Weak' :
                       'Very Weak'}
                    </span>
                  </div>
                  
                  {/* Strength Bar */}
                  <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className={`flex-1 rounded-full transition-all ${
                          bar <= passwordStrength.score
                            ? passwordStrength.score === 5 ? 'bg-green-500' :
                              passwordStrength.score === 4 ? 'bg-blue-500' :
                              passwordStrength.score === 3 ? 'bg-yellow-500' :
                              'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements as inline text */}
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className={passwordStrength.hasMinLength ? 'text-green-600 font-medium' : 'text-gray-500'}>8+ chars</span>
                    {' • '}
                    <span className={passwordStrength.hasUpperCase ? 'text-green-600 font-medium' : 'text-gray-500'}>uppercase</span>
                    {' • '}
                    <span className={passwordStrength.hasLowerCase ? 'text-green-600 font-medium' : 'text-gray-500'}>lowercase</span>
                    {' • '}
                    <span className={passwordStrength.hasNumber ? 'text-green-600 font-medium' : 'text-gray-500'}>number</span>
                    {' • '}
                    <span className={passwordStrength.hasSpecialChar ? 'text-green-600 font-medium' : 'text-gray-500'}>special char</span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="text-gray-800">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <p className={`text-xs mt-1 ${
                  password === confirmPassword ? 'text-green-600 font-medium' : 'text-red-600'
                }`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button 
              type="submit" 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account & Sign In"}
            </Button>

            <p className="text-center text-xs text-gray-600 mt-3">
              Your role: <strong className="text-primary">{invitationRole}</strong>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
