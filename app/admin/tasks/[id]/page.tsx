"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { 
  notifyNewComment, 
  notifyTaskAssignment,
  notifyTaskUpdate 
} from "@/lib/supabase/notification-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
  Trash2,
  Save,
  FileText,
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

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [newComment, setNewComment] = useState("");

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
        if (!user || user.role !== "admin") {
          router.push("/auth/login");
          return;
        }
        setCurrentUserId(user.id);

        // Fetch task
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", params.id)
          .single();

        if (taskError) throw taskError;

        if (taskData) {
          setTask(taskData);
          setTitle(taskData.title);
          setDescription(taskData.description);
          setStatus(taskData.status);
          setPriority(taskData.priority);
          setDeadline(taskData.deadline || "");
          setAssignedTo(taskData.assigned_to || "");

          // Fetch assigned user (including status for inactive users)
          if (taskData.assigned_to) {
            // Try to fetch with status, fallback if column doesn't exist
            let userData: any = null;
            const { data: userDataWithStatus, error: userError } = await supabase
              .from("users")
              .select("id, full_name, email, status")
              .eq("id", taskData.assigned_to)
              .single();

            if (userError) {
              // Status column might not exist yet, try without it
              const { data: userDataBasic } = await supabase
                .from("users")
                .select("id, full_name, email")
                .eq("id", taskData.assigned_to)
                .single();
              userData = userDataBasic;
            } else {
              userData = userDataWithStatus;
            }

            if (userData) {
              setAssignedUser(userData);
            }
          }
        }

        // Fetch all users for reassignment (including inactive ones for display)
        let usersData: any[] = [];
        const { data: usersDataWithStatus, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email, status");

        if (usersError) {
          // Status column might not exist yet, try without it
          const { data: usersDataBasic } = await supabase
            .from("users")
            .select("id, full_name, email");
          usersData = usersDataBasic || [];
        } else {
          usersData = usersDataWithStatus || [];
        }

        setUsers(usersData);

        // Fetch comments
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, user:users(full_name)")
          .eq("task_id", params.id)
          .order("created_at", { ascending: true });

        if (commentsData) {
          setComments(commentsData as Comment[]);
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        router.push("/admin/tasks");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const handleUpdate = async () => {
    if (!task) return;

    setUpdating(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const previousAssignedTo = task.assigned_to;
      const isNewAssignment = assignedTo && assignedTo !== previousAssignedTo;

      const { error } = await supabase
        .from("tasks")
        .update({
          title,
          description,
          status,
          priority,
          deadline: deadline || null,
          assigned_to: assignedTo || null,
        })
        .eq("id", task.id);

      if (error) throw error;

      // Send notifications
      if (isNewAssignment) {
        // Task was assigned to a new user
        await notifyTaskAssignment(
          task.id,
          assignedTo,
          user.id,
          title
        );
      } else if (assignedTo && assignedTo === previousAssignedTo) {
        // Task was updated (not a new assignment)
        const changes = [];
        if (status !== task.status) changes.push(`status to ${status.replace("_", " ")}`);
        if (priority !== task.priority) changes.push(`priority to ${priority}`);
        if (deadline !== task.deadline) changes.push("deadline");
        
        if (changes.length > 0) {
          await notifyTaskUpdate(
            task.id,
            assignedTo,
            user.id,
            title,
            changes.join(", ")
          );
        }
      }

      alert("Task updated successfully!");
      setTask({
        ...task,
        title,
        description,
        status: status as Task["status"],
        priority: priority as Task["priority"],
        deadline,
        assigned_to: assignedTo,
      });
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

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
      
      // Notify assigned employee about the new comment
      if (task.assigned_to) {
        await notifyNewComment(
          task.id,
          task.assigned_to,
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

  const handleDelete = async () => {
    if (!task) return;

    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      alert("Task deleted successfully!");
      router.push("/admin/tasks");
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task");
      setDeleting(false);
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
          onClick={() => router.push("/admin/tasks")}
          className={`mb-4 ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Tasks
        </Button>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Details</h1>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={16} className="mr-2" />
            {deleting ? "Deleting..." : "Delete Task"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Task Form */}
          <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_picked">Not Picked</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignedTo" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className={`${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(user => !user.status || user.status === 'active').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleUpdate} disabled={updating} className={`w-full ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                <Save size={16} className="mr-2" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
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
              <div className="space-y-4 max-h-96 overflow-y-auto px-1 py-2">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                      darkMode 
                        ? 'bg-gray-800' 
                        : 'bg-gray-100'
                    }`}>
                      <FileText size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No comments yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isOwnComment = comment.user_id === currentUserId;
                    return (
                      <div
                        key={comment.id}
                        className={`flex ${isOwnComment ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div
                          className={`relative rounded-2xl p-4 shadow-lg max-w-[85%] ${
                            isOwnComment
                              ? darkMode
                                ? 'bg-blue-700 text-white rounded-tr-sm border border-blue-800'
                                : 'bg-blue-600 text-white rounded-tr-sm border border-blue-700'
                              : darkMode
                              ? 'bg-gray-800 text-white border border-gray-700 rounded-tl-sm'
                              : 'bg-gray-50 text-gray-900 border border-gray-200 rounded-tl-sm'
                          }`}
                        >
                          <div className="mb-2">
                            <p className={`text-sm font-semibold ${isOwnComment || darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {isOwnComment ? 'You' : (comment.user?.full_name || "Unknown User")}
                            </p>
                            <p className={`text-xs mt-0.5 ${isOwnComment ? 'text-blue-50' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(comment.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                          
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            isOwnComment 
                              ? 'text-white' 
                              : darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
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
          {/* Current Details */}
          <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Current Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Priority</label>
                <div className="mt-1">
                  <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
                    {task.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</label>
                <div className="mt-1">
                  <Badge className={`${getStatusColor(task.status)} capitalize`}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {assignedUser && (
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assigned To</label>
                  <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {assignedUser.full_name}
                    {assignedUser.status === 'inactive' && <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}> (inactive)</span>}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{assignedUser.email}</p>
                </div>
              )}
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
              {task.deadline && (
                <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Calendar size={16} />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Deadline</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
