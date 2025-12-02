"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import NotificationPanel from "@/app/components/NotificationPanel";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import {
  LogOut,
  LayoutDashboard,
  ListTodo,
  User,
  Moon,
} from "lucide-react";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      if (currentUser.role === "admin") {
        router.push("/admin/dashboard");
        return;
      }
      setUser(currentUser);
    } catch (err) {
      console.error("Error fetching user:", err);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  // Listen for avatar upload events to refresh user data
  useEffect(() => {
    const handleAvatarUpload = (event: any) => {
      if (event.detail?.userId === user?.id) {
        fetchUser(); // Refresh user data to get updated profile image
      }
    };

    window.addEventListener('avatarUploaded', handleAvatarUpload);
    return () => {
      window.removeEventListener('avatarUploaded', handleAvatarUpload);
    };
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="flex justify-center gap-2 text-black">
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <div className={`flex h-screen ${darkMode ? 'dark bg-black' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 h-8">
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                <ListTodo size={18} className="text-white" />
              </div>
              <span className={`font-semibold text-sm leading-8 ${darkMode ? 'text-white' : ''}`}>
                Task Manager
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <div className="mb-6">
              <div className="px-4 mb-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Main Menu
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem
                  active={isActive("/dashboard")}
                  icon={<LayoutDashboard size={20} />}
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/mytasks")}
                  icon={<ListTodo size={20} />}
                  onClick={() => router.push("/mytasks")}
                >
                  My Tasks
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/account")}
                  icon={<User size={20} />}
                  onClick={() => router.push("/account")}
                >
                  Account
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2">
                {user.profile_image ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                    <Image
                      src={user.profile_image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className={`text-xs truncate ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`w-full justify-start gap-2 ${
                  darkMode 
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' 
                    : ''
                }`}
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className={`border-b px-6 h-16 flex items-center ${
            darkMode 
              ? 'bg-black border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-end w-full">
              <div className="flex items-center gap-3">
                <NotificationPanel userId={user.id} darkMode={darkMode} />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : ''}
                  onClick={toggleDarkMode}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  <Moon size={20} className={darkMode ? "fill-yellow-400 text-yellow-400" : ""} />
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
