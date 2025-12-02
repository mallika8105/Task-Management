"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        if (user.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        // Redirect to admin dashboard
        router.push("/admin/dashboard");
      } catch (err) {
        console.error("Error checking auth:", err);
        router.push("/auth/login");
      }
    };
    checkAuth();
  }, [router]);

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
