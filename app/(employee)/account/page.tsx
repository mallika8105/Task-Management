"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import AvatarUpload from "@/app/components/AvatarUpload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  profile_image: string | null;
}

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const handleAvatarUploadSuccess = async (url: string) => {
    // Refresh user profile to get the updated profile image
    await fetchUserProfile();
  };

  const fetchUserProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, profile_image, phone")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile(data as UserProfile);
        setFullName(data.full_name || "");
        setPhone((data as any).phone || "");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      setLoading(false);
    };
    initializeData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userProfile) {
      setError("User profile not loaded.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          full_name: fullName,
          phone: phone
        })
        .eq("id", userProfile.id);

      if (updateError) throw updateError;
      alert("Profile updated successfully!");
      setUserProfile((prev) =>
        prev ? { ...prev, full_name: fullName } : null
      );
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex justify-center gap-2 text-black">
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="p-3 md:p-8">
      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h1
          className={`text-xl md:text-2xl font-bold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Account Settings
        </h1>
        <p
          className={`text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Manage your profile and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card - Left Side */}
        <Card className={`${darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"} lg:col-span-1`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 text-center">
            <AvatarUpload
              currentImageUrl={userProfile.profile_image}
              userId={userProfile.id}
              onUploadSuccess={handleAvatarUploadSuccess}
              size="lg"
            />
            <h3 className={`text-lg font-semibold mt-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              {userProfile.full_name || "User"}
            </h3>
            <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
              {userProfile.email}
            </p>
            <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              {phone || "+91 81054 12345"}
            </p>
          </CardContent>
        </Card>

        {/* Profile Information Form - Right Side */}
        <Card className={`${darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"} lg:col-span-2`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
              Profile Information
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className={darkMode ? "text-gray-300" : "text-gray-700"}>
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={`mt-1 ${darkMode ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className={darkMode ? "text-gray-300" : "text-gray-700"}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    disabled
                    className={`mt-1 ${darkMode ? "bg-gray-900 border-gray-800 text-gray-500" : "bg-gray-50 text-gray-500"}`}
                  />
                  <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 81054 12345"
                  className={`mt-1 ${darkMode ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                />
              </div>

              {error && (
                <div
                  className={`p-3 rounded-lg border ${
                    darkMode
                      ? "bg-red-900/20 border-red-800 text-red-400"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div
                className={`flex justify-end pt-4 border-t ${
                  darkMode ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <Button 
                  type="submit" 
                  className={`h-10 px-6 ${
                    darkMode 
                      ? "bg-white text-black hover:bg-gray-100" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
