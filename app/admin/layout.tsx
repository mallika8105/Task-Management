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
  LayoutDashboard,
  Users,
  ListTodo,
  Settings,
  Search,
  Moon,
  LogOut,
  Shield,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Effect to update searchQuery when URL changes (e.g., direct navigation or back/forward)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("search") || "");
  }, [pathname]);

  // Load dark mode preference
  useEffect(() => {
    console.log("🎨 [DARK MODE INIT] Starting initialization...");
    console.log("🎨 [DARK MODE INIT] HTML classes BEFORE:", document.documentElement.className);
    console.log("🎨 [DARK MODE INIT] LocalStorage value:", localStorage.getItem("darkMode"));
    
    // Always start by removing dark class to ensure clean state
    document.documentElement.classList.remove("dark");
    console.log("🎨 [DARK MODE INIT] Removed 'dark' class");
    
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    console.log("🎨 [DARK MODE INIT] Parsed dark mode:", savedDarkMode);
    setDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
      console.log("🎨 [DARK MODE INIT] Added 'dark' class (dark mode enabled)");
    } else {
      console.log("🎨 [DARK MODE INIT] Light mode enabled (no class added)");
    }
    
    console.log("🎨 [DARK MODE INIT] HTML classes AFTER:", document.documentElement.className);
  }, []);

  const toggleDarkMode = () => {
    console.log("🎨 [DARK MODE TOGGLE] Current state:", darkMode);
    const newDarkMode = !darkMode;
    console.log("🎨 [DARK MODE TOGGLE] New state:", newDarkMode);
    
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    console.log("🎨 [DARK MODE TOGGLE] Saved to localStorage:", String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      console.log("🎨 [DARK MODE TOGGLE] Added 'dark' class to HTML");
    } else {
      document.documentElement.classList.remove("dark");
      console.log("🎨 [DARK MODE TOGGLE] Removed 'dark' class from HTML");
    }
    
    console.log("🎨 [DARK MODE TOGGLE] HTML classes after toggle:", document.documentElement.className);
  };

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      if (currentUser.role !== "admin") {
        router.push("/dashboard");
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

  if (!user || user.role !== "admin") {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <div className={`flex h-screen ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <Sidebar className={darkMode ? 'bg-black' : 'bg-white'} darkMode={darkMode}>
          <SidebarHeader darkMode={darkMode}>
            <div className="flex items-center gap-2 h-8">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${darkMode ? 'bg-white' : 'bg-gray-900'}`}>
                <Shield size={18} className={darkMode ? 'text-black' : 'text-white'} />
              </div>
              <span className={`font-semibold text-sm leading-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Admin Panel
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <div className="mb-6">
              <div className="px-4 mb-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Main Menu
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem
                  active={isActive("/admin/dashboard")}
                  icon={<LayoutDashboard size={20} />}
                  onClick={() => router.push("/admin/dashboard")}
                  darkMode={darkMode}
                >
                  Dashboard
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/admin/users")}
                  icon={<Users size={20} />}
                  onClick={() => router.push("/admin/users")}
                  darkMode={darkMode}
                >
                  Users
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/admin/tasks")}
                  icon={<ListTodo size={20} />}
                  onClick={() => router.push("/admin/tasks")}
                  darkMode={darkMode}
                >
                  All Tasks
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <div>
              <div className="px-4 mb-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Settings
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem
                  active={isActive("/admin/settings")}
                  icon={<Settings size={20} />}
                  onClick={() => router.push("/admin/settings")}
                  darkMode={darkMode}
                >
                  System Settings
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter darkMode={darkMode}>
            <div className="space-y-2">
              <div 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                onClick={() => router.push("/admin/account")}
                title="View Account"
              >
                {user.profile_image ? (
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <Image
                      src={user.profile_image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-gradient-to-br text-white ${darkMode ? 'from-purple-500 to-pink-500' : 'from-blue-400 to-cyan-400'}`}>
                    {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.user_metadata?.full_name || "Admin"}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`w-full justify-start gap-2 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
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
          <header className={`border-b px-6 h-16 flex items-center ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-end w-full">
              <div className="flex items-center gap-3">
                <NotificationPanel userId={user.id} darkMode={darkMode} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  onClick={toggleDarkMode}
                  title={
                    darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                >
                  <Moon
                    size={20}
                    className="text-gray-700 dark:fill-yellow-400 dark:text-yellow-400"
                  />
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
