"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import AvatarUpload from "@/app/components/AvatarUpload";
import {
  User,
  Shield,
  Key,
  Save,
} from "lucide-react";

export default function AdminAccountPage() {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleAvatarUploadSuccess = async (url: string) => {
    // Refresh user data to get the updated profile image
    await fetchUserData();
  };

  const fetchUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user data from database to get profile_image and phone
        const { supabase } = await import("@/lib/supabase/client");
        const { data: userDataFromDB, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        
        if (dbError) {
          console.error("Error fetching user data from database:", dbError);
          // If there's an error fetching from DB, still set user data from auth
          setFormData({
            fullName: currentUser.user_metadata?.full_name || "",
            email: currentUser.email || "",
            phone: "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          return;
        }
        
        setUserData(userDataFromDB);
        
        setFormData({
          fullName: userDataFromDB?.full_name || currentUser.user_metadata?.full_name || "",
          email: currentUser.email || "",
          phone: userDataFromDB?.phone || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    const initializeData = async () => {
      await fetchUserData();
      setLoading(false);
    };

    initializeData();
    
    return () => observer.disconnect();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase/client");
      
      // Update user profile in database
      const { data, error: updateError } = await supabase
        .from("users")
        .update({ 
          full_name: formData.fullName,
          phone: formData.phone
        })
        .eq("id", user?.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(updateError.message || "Failed to update profile in database");
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: formData.fullName
        }
      });

      if (authError) {
        console.error("Auth update error:", authError);
        throw new Error(authError.message || "Failed to update auth metadata");
      }

      alert("Profile updated successfully!");
      await fetchUserData(); // Refresh user data
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setSaving(true);
    // Simulate password change
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert("Password changed successfully!");
    setFormData({
      ...formData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="flex justify-center gap-2 text-black">
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Admin Account
        </h1>
        <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} lg:col-span-1`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 text-center">
            <AvatarUpload
              currentImageUrl={userData?.profile_image}
              userId={user?.id || ""}
              onUploadSuccess={handleAvatarUploadSuccess}
              size="lg"
            />
            <h3 className={`text-lg font-semibold mt-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.user_metadata?.full_name || "Admin User"}
            </h3>
            <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              {user?.email}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {formData.phone || '+91 81054 12345'}
            </p>
            <Badge className="mt-3 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <Shield size={12} className="mr-1" />
              Administrator
            </Badge>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} lg:col-span-2`}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Profile Information
              </CardTitle>
            </div>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <Label htmlFor="email" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-gray-50 text-gray-500'}`}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            
            {/* Account Details */}
            <div className={`p-4 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'} mt-4`}>
              <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>User ID</span>
                  <span className={`text-xs font-mono ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {user?.id?.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Role</span>
                  <Badge className="text-xs">Admin</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Account Created</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                <Save size={16} className="mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} mt-4 md:mt-6`}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Key className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Change Password
            </CardTitle>
          </div>
          <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div>
              <Label htmlFor="currentPassword" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleChangePassword}
              disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              variant="outline"
              className={darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-900 hover:bg-gray-50'}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
