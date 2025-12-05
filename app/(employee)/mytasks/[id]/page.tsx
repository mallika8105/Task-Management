"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { notifyNewComment, notifyTaskCompletion, notifyTaskInProgress, notifyTaskUpdate } from "@/lib/supabase/notification-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Save,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "not_picked" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  deadline: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user: { full_name: string } | null;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);

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
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setCurrentUserId(user.id);

        // Fetch task
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", params.id)
          .eq("assigned_to", user.id)
          .single();

        if (taskError) throw taskError;
        if (taskData) {
          setTask(taskData);
          setStatus(taskData.status);
        }

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("*, user:users(full_name)")
          .eq("task_id", params.id)
          .order("created_at", { ascending: true });

        if (commentsError) throw commentsError;
        setComments(commentsData as Comment[]);
      } catch (err) {
        console.error("Error fetching data:", err);
        router.push("/mytasks");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const handleSubmitComment = async () => {
    if (!task || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            task_id: task.id,
            user_id: user.id,
            comment: newComment.trim(),
          },
        ])
        .select("*, user:users(full_name)")
        .single();

      if (error) throw error;

      setComments([...comments, data as Comment]);
      setNewComment("");
      
      // Notify admin about the new comment
      if (task.created_by) {
        await notifyNewComment(
          task.id,
          task.created_by,
          user.id,
          task.title,
          newComment.trim()
        );
      }
      
      alert("Comment added successfully!");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!task) return;

    setUpdating(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", task.id);

      if (error) throw error;

      // Notify admin for all status changes
      if (task.created_by && status !== task.status) {
        if (status === "completed") {
          await notifyTaskCompletion(
            task.id,
            task.created_by,
            user.id,
            task.title
          );
        } else if (status === "in_progress") {
          await notifyTaskInProgress(
            task.id,
            task.created_by,
            user.id,
            task.title
          );
        } else if (status === "not_picked") {
          // Notify for not picked status
          await notifyTaskUpdate(
            task.id,
            task.created_by,
            user.id,
            task.title,
            "status changed to Not Picked"
          );
        }
      }

      alert("Task status updated successfully!");
      setTask({ ...task, status: status as Task["status"] });
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className={`flex justify-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    if (darkMode) {
      switch (priority) {
        case "high":
          return "bg-red-900 text-red-200 border-red-700";
        case "medium":
          return "bg-yellow-900 text-yellow-200 border-yellow-700";
        case "low":
          return "bg-green-900 text-green-200 border-green-700";
        default:
          return "bg-gray-800 text-gray-200 border-gray-600";
      }
    } else {
      switch (priority) {
        case "high":
          return "bg-red-100 text-red-800 border-red-200";
        case "medium":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "low":
          return "bg-green-100 text-green-800 border-green-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }
  };

  const getStatusColor = (status: string) => {
    if (darkMode) {
      switch (status) {
        case "completed":
          return "bg-green-900 text-green-200 border-green-700";
        case "in_progress":
          return "bg-blue-900 text-blue-200 border-blue-700";
        case "not_picked":
          return "bg-gray-800 text-gray-200 border-gray-600";
        default:
          return "bg-gray-800 text-gray-200 border-gray-600";
      }
    } else {
      switch (status) {
        case "completed":
          return "bg-green-100 text-green-800 border-green-200";
        case "in_progress":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "not_picked":
          return "bg-gray-100 text-gray-800 border-gray-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/mytasks")}
          className={`mb-4 ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <ArrowLeft size={16} className={`mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          Back to Tasks
        </Button>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{task.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Description
                </label>
                <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{task.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Priority
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={`${getPriorityColor(task.priority)} capitalize`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={`${getStatusColor(task.status)} capitalize`}
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Calendar size={16} />
                  Deadline
                </label>
                <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(task.deadline).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <FileText size={18} />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isOwnComment = comment.user_id === currentUserId;
                    return (
                      <div
                        key={comment.id}
                        className={`flex ${isOwnComment ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 border ${
                            isOwnComment
                              ? darkMode
                                ? 'bg-blue-700 text-white border-blue-800'
                                : 'bg-blue-600 text-white border-blue-700'
                              : darkMode
                              ? 'bg-gray-800 text-white border-gray-700'
                              : 'bg-gray-50 text-gray-900 border-gray-200'
                          }`}
                        >
                          <div className="mb-2">
                            <p className={`text-sm font-medium ${isOwnComment || darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {isOwnComment ? 'You' : (comment.user?.full_name || "Unknown")}
                            </p>
                            <p className={`text-xs ${isOwnComment ? 'text-blue-50' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(comment.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className={`text-sm whitespace-pre-wrap ${isOwnComment ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              <div className={`border-t pt-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className={`w-full ${darkMode ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
                />
                <Button
                  className={`mt-3 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                  onClick={handleSubmitComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  <Save size={16} className="mr-2" />
                  {submittingComment ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Status</CardTitle>
              <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Change the current status of this task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                  <SelectItem className={`${darkMode ? 'hover:bg-gray-800 focus:bg-gray-800' : 'hover:bg-gray-100 focus:bg-gray-100'}`} value="not_picked">Not Picked</SelectItem>
                  <SelectItem className={`${darkMode ? 'hover:bg-gray-800 focus:bg-gray-800' : 'hover:bg-gray-100 focus:bg-gray-100'}`} value="in_progress">In Progress</SelectItem>
                  <SelectItem className={`${darkMode ? 'hover:bg-gray-800 focus:bg-gray-800' : 'hover:bg-gray-100 focus:bg-gray-100'}`} value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating || status === task.status}
                className={`w-full ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                {updating ? "Updating..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>

          {/* Task Info */}
          <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Clock size={16} />
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Created</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Clock size={16} />
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Last Updated</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(task.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
