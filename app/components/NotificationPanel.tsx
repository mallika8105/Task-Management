"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/supabase/notification-helpers";

interface NotificationPanelProps {
  userId: string;
  darkMode?: boolean;
}

export default function NotificationPanel({
  userId,
  darkMode = false,
}: NotificationPanelProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await getNotifications(userId);
    if (data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    const { count } = await getUnreadNotificationCount(userId);
    setUnreadCount(count);
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Polling as fallback (fetch every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (showNotifications) {
        fetchNotifications();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userId, showNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    fetchNotifications();
    fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    fetchNotifications();
    fetchUnreadCount();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to related task if exists
    if (notification.related_task_id) {
      setShowNotifications(false);
      router.push(`/mytasks/${notification.related_task_id}`);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task_assigned":
        return "📋";
      case "task_completed":
        return "✅";
      case "comment_added":
        return "💬";
      case "task_updated":
        return "🔄";
      case "message_sent":
        return "📨";
      case "pr_raised":
        return "🔔";
      default:
        return "🔔";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${
          darkMode
            ? "text-gray-300 hover:text-white hover:bg-gray-800"
            : ""
        }`}
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) {
            fetchNotifications();
          }
        }}
      >
        <Bell size={20} className={darkMode ? "text-gray-300" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {showNotifications && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />

          {/* Notification Panel */}
          <div
            className={`fixed top-16 right-4 w-96 max-h-[600px] border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col ${
              darkMode
                ? "bg-black border-gray-800"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className={`sticky top-0 border-b p-4 ${
                darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={`text-lg font-semibold ${
                    darkMode ? "text-white" : ""
                  }`}
                >
                  Notifications
                </h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className={`text-xs ${
                        darkMode
                          ? "text-gray-300 hover:text-white hover:bg-gray-800"
                          : ""
                      }`}
                    >
                      <CheckCheck size={14} className="mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                    className={
                      darkMode
                        ? "text-gray-300 hover:text-white hover:bg-gray-800"
                        : ""
                    }
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "All caught up!"}
              </p>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div
                  className={`flex items-center justify-center py-12 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center py-12 px-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <Bell size={48} className="mb-2 opacity-30" />
                  <p className="text-center">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        !notification.is_read
                          ? darkMode
                            ? "bg-gray-900/50"
                            : "bg-blue-50"
                          : ""
                      } ${
                        darkMode
                          ? "hover:bg-gray-900"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3
                              className={`font-medium text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p
                            className={`text-sm line-clamp-2 mb-2 ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className={`text-xs h-6 ${
                                  darkMode
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : ""
                                }`}
                              >
                                <Check size={12} className="mr-1" />
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
