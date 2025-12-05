"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // Import useSearchParams and usePathname
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { sendTaskAssignmentNotification } from '@/lib/brevo/emailService';
import { useDebounce } from '@/app/hooks/use-debounce';
import { notifyTaskAssignment, notifyTaskUpdate } from '@/lib/supabase/notification-helpers';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
  status?: "active" | "inactive";
}

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
  users: { full_name: string; email: string; status?: "active" | "inactive" } | null; // Added email for search and status
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const initialSearch = useSearchParams().get("search") || "";
  const [search, setSearch] = useState(initialSearch); // State for search input, initialized from URL
  const debouncedSearch = useDebounce(search, 500); // Debounced search term

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<
    "not_picked" | "in_progress" | "completed"
  >("not_picked");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const pathname = usePathname(); // Get current pathname

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
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      currentSearchParams.set('search', debouncedSearch);
    } else {
      currentSearchParams.delete('search');
    }
    // Only replace if the search parameter actually changed to avoid unnecessary re-renders
    if (currentSearchParams.toString() !== searchParams.toString()) {
        router.replace(`${pathname}?${currentSearchParams.toString()}`);
    }
  }, [debouncedSearch, pathname, router, searchParams]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true at the start of fetch
      setError(null); // Clear any previous errors

      try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
          router.push("/auth/login");
          return;
        }
        setCurrentUser(user);

        // Fetch all users (including inactive ones for display purposes)
        // Try to fetch with status column, fallback if column doesn't exist yet
        let usersData: any[] = [];
        const { data: usersDataWithStatus, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email, status");

        if (usersError) {
          // Status column might not exist yet, try without it
          console.warn("Fetching users without status column:", usersError);
          const { data: usersDataBasic, error: basicError } = await supabase
            .from("users")
            .select("id, full_name, email");
          
          if (basicError) {
            console.error("Users error:", basicError);
            throw basicError;
          }
          usersData = usersDataBasic || [];
        } else {
          usersData = usersDataWithStatus || [];
        }
        setUsers(usersData as User[]);

        // Get search query from URL
        const currentSearchQuery = searchParams.get("search") || "";
        // No setSearch(currentSearchQuery) here; input is controlled by local `search` state

        // Fetch all tasks without search filter in Supabase, we'll filter client-side
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (tasksError) {
          console.error("Tasks error:", tasksError);
          throw tasksError;
        }

        // Manually join user data with tasks and apply client-side search
        const tasksWithUsers = (tasksData || []).map((task) => {
          const assignedUser = task.assigned_to
            ? usersData?.find((u) => u.id === task.assigned_to)
            : null;
          return { ...task, users: assignedUser };
        }).filter(task => {
          if (!currentSearchQuery) return true; // If no search query, show all tasks

          const lowerCaseSearchQuery = currentSearchQuery.toLowerCase();

          // Check if title or description matches
          if (
            task.title.toLowerCase().includes(lowerCaseSearchQuery) ||
            task.description.toLowerCase().includes(lowerCaseSearchQuery)
          ) {
            return true;
          }

          // Check if assigned user's name or email matches
          if (task.users) {
            if (
              task.users.full_name?.toLowerCase().includes(lowerCaseSearchQuery) ||
              task.users.email?.toLowerCase().includes(lowerCaseSearchQuery)
            ) {
              return true;
            }
          }

          return false; // No match found
        }); 

        setTasks(tasksWithUsers as Task[]); 
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, searchParams, debouncedSearch]); 

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!currentUser) {
      setError("You must be logged in to create tasks.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTaskTitle,
            description: newTaskDescription,
            status: newTaskStatus,
            priority: newTaskPriority,
            deadline: newTaskDeadline || null,
            assigned_to: newTaskAssignedTo || null,
            created_by: currentUser.id,
          },
        ])
        .select();

      if (error) throw error;

      const createdTask = data[0];

      // Add user data to the new task
      const newTaskWithUser = {
        ...createdTask,
        users: newTaskAssignedTo
          ? users.find((u) => u.id === newTaskAssignedTo)
          : null,
      };

      setTasks((prevTasks) => [newTaskWithUser as Task, ...prevTasks]);
      setIsDialogOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskStatus("not_picked");
      setNewTaskPriority("medium");
      setNewTaskDeadline("");
      
      // Send task assignment notification if assigned to an employee
      if (newTaskAssignedTo && newTaskWithUser.users) {
        const assignedUser = newTaskWithUser.users;
        const taskLink = `${process.env.NEXT_PUBLIC_BASE_URL}/mytasks/${createdTask.id}`;
        
        // Create in-app notification
        await notifyTaskAssignment(
          createdTask.id,
          newTaskAssignedTo,
          currentUser.id,
          createdTask.title
        );
        
        // Send email notification
        await sendTaskAssignmentNotification(
          assignedUser.id,
          createdTask.title,
          taskLink,
          currentUser.full_name || "Admin"
        );
      }
      setNewTaskAssignedTo("");
    } catch (err: any) {
      setError(err.message || "Failed to create task.");
      console.error("Error creating task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: "not_picked" | "in_progress" | "completed") => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const oldStatus = task?.status;

      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Update task in state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // Send notification if task is assigned and status changed
      if (task && task.assigned_to && oldStatus !== newStatus && currentUser) {
        await notifyTaskUpdate(
          taskId,
          task.assigned_to,
          currentUser.id,
          task.title,
          `status to ${newStatus.replace("_", " ")}`
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const getStatusStyle = (status: string) => {
    if (darkMode) {
      switch (status) {
        case "completed":
          return "bg-green-900 text-green-50";
        case "in_progress":
          return "bg-blue-900 text-blue-50";
        case "not_picked":
          return "bg-gray-700 text-gray-50";
        default:
          return "bg-gray-700 text-gray-50";
      }
    }
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "not_picked":
        return "bg-gray-100 text-black";
      default:
        return "bg-gray-100 text-black";
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          status: editingTask.status,
          priority: editingTask.priority,
          deadline: editingTask.deadline || null,
          assigned_to: editingTask.assigned_to || null,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      // Find the original task to compare assigned_to
      const originalTask = tasks.find(task => task.id === editingTask.id);
      const oldAssignedTo = originalTask?.assigned_to;

      // Update the task in state
      const updatedTaskWithUser = {
        ...editingTask,
        users: editingTask.assigned_to
          ? users.find((u) => u.id === editingTask.assigned_to)
          : null,
      };

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === editingTask.id ? (updatedTaskWithUser as Task) : task
        )
      );

      // Send notifications if assigned_to changed or task was updated
      if (editingTask.assigned_to && editingTask.assigned_to !== oldAssignedTo && updatedTaskWithUser.users) {
        // New assignment
        const assignedUser = updatedTaskWithUser.users;
        const taskLink = `${process.env.NEXT_PUBLIC_BASE_URL}/mytasks/${editingTask.id}`;
        
        // Create in-app notification
        await notifyTaskAssignment(
          editingTask.id,
          editingTask.assigned_to,
          currentUser.id,
          editingTask.title
        );
        
        // Send email notification
        await sendTaskAssignmentNotification(
          assignedUser.id,
          editingTask.title,
          taskLink,
          currentUser.full_name || "Admin"
        );
      } else if (editingTask.assigned_to && editingTask.assigned_to === oldAssignedTo) {
        // Task was updated (not a new assignment)
        const changes = [];
        if (editingTask.status !== originalTask?.status) changes.push(`status to ${editingTask.status.replace("_", " ")}`);
        if (editingTask.priority !== originalTask?.priority) changes.push(`priority to ${editingTask.priority}`);
        if (editingTask.deadline !== originalTask?.deadline) changes.push("deadline");
        if (editingTask.title !== originalTask?.title) changes.push("title");
        if (editingTask.description !== originalTask?.description) changes.push("description");
        
        if (changes.length > 0) {
          await notifyTaskUpdate(
            editingTask.id,
            editingTask.assigned_to,
            currentUser.id,
            editingTask.title,
            changes.join(", ")
          );
        }
      }

      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (err: any) {
      setError(err.message || "Failed to update task.");
      console.error("Error updating task:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`flex justify-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null; // Should redirect to login in useEffect
  }

  return (
    <div className="p-3 md:p-6">
      <Card className={`shadow-sm overflow-hidden ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-blue-100'}`}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <div>
              <CardTitle className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Task Management
              </CardTitle>
              <p className={`text-xs md:text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Create and manage tasks for your team
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm w-full sm:w-auto shadow-lg">
                  Create New Task
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new task.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTaskStatus}
                    onValueChange={(
                      value: "not_picked" | "in_progress" | "completed"
                    ) => setNewTaskStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_picked">Not Picked</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTaskPriority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setNewTaskPriority(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select
                    value={newTaskAssignedTo}
                    onValueChange={setNewTaskAssignedTo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(user => !user.status || user.status === 'active').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Task"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Make changes to the task details.
                </DialogDescription>
              </DialogHeader>
              {editingTask && (
                <form onSubmit={handleUpdateTask} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingTask.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingTask.status}
                      onValueChange={(
                        value: "not_picked" | "in_progress" | "completed"
                      ) => setEditingTask({ ...editingTask, status: value })}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setEditingTask({ ...editingTask, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-deadline">Deadline</Label>
                    <Input
                      id="edit-deadline"
                      type="date"
                      value={editingTask.deadline || ""}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          deadline: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-assignedTo">Assign To</Label>
                    <Select
                      value={editingTask.assigned_to || ""}
                      onValueChange={(value) =>
                        setEditingTask({ ...editingTask, assigned_to: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(user => !user.status || user.status === 'active').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Task"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className={`p-4 md:p-6 ${darkMode ? 'bg-black' : 'bg-white'}`}>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg
                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search tasks by title, description, or assigned user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 h-10 ${darkMode ? 'bg-black border-gray-700 text-white placeholder:text-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={`border-b-2 ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Title</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Status</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Priority</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Deadline</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} className={`border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <TableCell 
                      className={`font-medium cursor-pointer text-sm hover:underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                      onClick={() => router.push(`/admin/tasks/${task.id}`)}
                    >
                      <div className="truncate max-w-[200px] md:max-w-none">{task.title}</div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={task.status}
                        onValueChange={(value: "not_picked" | "in_progress" | "completed") => 
                          handleStatusChange(task.id, value)
                        }
                      >
                        <SelectTrigger 
                          className={`w-[120px] md:w-[140px] text-xs md:text-sm border-0 font-medium shadow-sm ${getStatusStyle(task.status)}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_picked">Not Picked</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer text-sm"
                      onClick={() => router.push(`/admin/tasks/${task.id}`)}
                    >
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === "high" 
                          ? darkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800"
                          : task.priority === "medium"
                          ? darkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                          : darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-800"
                      }`}>
                        {task.priority}
                      </span>
                    </TableCell>
                    <TableCell 
                      className={`cursor-pointer text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
                      onClick={() => router.push(`/admin/tasks/${task.id}`)}
                    >
                      {task.deadline}
                    </TableCell>
                    <TableCell 
                      className={`cursor-pointer text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
                      onClick={() => router.push(`/admin/tasks/${task.id}`)}
                    >
                      <div className="truncate max-w-[150px] md:max-w-none">
                        {task.users?.full_name 
                          ? `${task.users.full_name}${task.users.status === 'inactive' ? ' (inactive)' : ''}`
                          : "Unassigned"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {tasks.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <svg
                className={`h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className={`text-sm md:text-base font-semibold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                No tasks found
              </h3>
              <p className={`text-xs md:text-sm mb-4 ${darkMode ? 'text-slate-300' : 'text-black'}`}>
                {searchParams.get("search") ? `No tasks match "${searchParams.get("search")}"` : "Create your first task to get started"}
              </p>
              {!searchParams.get("search") && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow-lg"
                >
                  Create New Task
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
