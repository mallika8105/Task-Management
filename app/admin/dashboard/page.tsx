"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Download,
  Calendar,
  Users,
  ListTodo,
  CheckCircle2,
  UserPlus,
  Search,
  Filter,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTasks: 0,
    completedToday: 0,
    pendingInvites: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState({
    completed: 0,
    inProgress: 0,
    notPicked: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activityData, setActivityData] = useState<{ date: string; tasks: number; users: number }[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

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

  // Read search query from URL only on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search") || "";
    setSearchQuery(urlSearch);
  }, []);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");

        // Fetch all users
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (usersError) throw usersError;

        // Fetch all tasks with assigned user info
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            assigned_user:users!assigned_to(full_name, email),
            creator:users!created_by(full_name)
          `)
          .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;

        // Store all tasks for filtering
        setAllTasks(tasks || []);

        // Calculate activity data for the last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });

        const activityByDay = last30Days.map(date => {
          const dayStart = new Date(date);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const tasksCompleted = tasks?.filter((t: any) => {
            if (t.status === 'completed' && t.updated_at) {
              const updatedDate = new Date(t.updated_at);
              return updatedDate >= dayStart && updatedDate <= dayEnd;
            }
            return false;
          }).length || 0;

          const activeUsers = users?.filter((u: any) => {
            if (u.last_sign_in_at) {
              const lastSignIn = new Date(u.last_sign_in_at);
              return lastSignIn >= dayStart && lastSignIn <= dayEnd;
            }
            return false;
          }).length || 0;

          return { date, tasks: tasksCompleted, users: activeUsers };
        });

        setActivityData(activityByDay);

        // Calculate stats
        const totalUsers = users?.length || 0;
        const activeTasks = tasks?.filter((t: any) => t.status !== "completed").length || 0;
        
        // Completed today (last 24 hours)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = tasks?.filter((t: any) => {
          if (t.status === "completed" && t.updated_at) {
            const updatedDate = new Date(t.updated_at);
            return updatedDate >= today;
          }
          return false;
        }).length || 0;

        // Pending invites (users with invited status)
        const pendingInvites = users?.filter((u: any) => u.status === "invited").length || 0;

        setStats({
          totalUsers,
          activeTasks,
          completedToday,
          pendingInvites,
        });

        // Set recent users (last 5)
        setRecentUsers(users?.slice(0, 5) || []);

        // Calculate task distribution
        const completed = tasks?.filter((t: any) => t.status === "completed").length || 0;
        const inProgress = tasks?.filter((t: any) => t.status === "in_progress").length || 0;
        const notPicked = tasks?.filter((t: any) => t.status === "not_picked").length || 0;

        setTasksByStatus({ completed, inProgress, notPicked });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  // Admin stats
  const adminStats = [
    { label: "Total Users", value: stats.totalUsers.toString(), icon: <Users size={20} />, color: "bg-blue-500", change: "+12%" },
    { label: "Active Tasks", value: stats.activeTasks.toString(), icon: <ListTodo size={20} />, color: "bg-purple-500", change: "+8%" },
    { label: "Completed Today", value: stats.completedToday.toString(), icon: <CheckCircle2 size={20} />, color: "bg-green-500", change: "+15%" },
    { label: "Pending Invites", value: stats.pendingInvites.toString(), icon: <UserPlus size={20} />, color: "bg-yellow-500", change: "-2" },
  ];

  // Task overview by status
  const tasksStatusArray = [
    { status: "Completed", count: tasksByStatus.completed, color: "bg-green-500" },
    { status: "In Progress", count: tasksByStatus.inProgress, color: "bg-blue-500" },
    { status: "Not Picked", count: tasksByStatus.notPicked, color: "bg-gray-400" },
  ];

  const totalTasks = tasksByStatus.completed + tasksByStatus.inProgress + tasksByStatus.notPicked;

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Welcome back, Admin!</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-xs md:text-sm cursor-pointer transition-all w-full ${
                showDatePicker
                  ? darkMode 
                    ? 'bg-gray-800 border-gray-700 shadow-lg' 
                    : 'bg-gray-50 border-gray-300 shadow-lg'
                  : darkMode 
                    ? 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Calendar size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </button>
            
            {showDatePicker && (
              <div className={`absolute right-0 mt-2 p-4 border rounded-lg shadow-lg z-50 w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        setSelectedDate(new Date(e.target.value));
                        setShowDatePicker(false);
                      }}
                      className={`w-full px-3 py-2 border rounded-md text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDate(new Date());
                      setShowDatePicker(false);
                    }}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      darkMode 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Reset to Today
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button className={`text-sm w-full sm:w-auto ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        {adminStats.map((stat, idx) => (
          <Card key={idx} className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-blue-100'} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{stat.label}</p>
                  <p className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.change}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>vs last month</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stat.color} ${stat.color.replace('bg-', 'bg-opacity-10 bg-')}`}>
                  <div className={stat.color.replace('bg-', 'text-')}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* System Activity */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} lg:col-span-2`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              System Activity
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Task completion and user activity over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              {/* Graph */}
              <div className={`h-56 md:h-64 relative rounded-xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <svg className="w-full h-full" viewBox="0 0 700 220">
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="taskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                    <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                    <linearGradient id="taskAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="userAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                    <filter id="glowEffect">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Grid lines with subtle styling */}
                  <line x1="50" y1="20" x2="50" y2="180" stroke={darkMode ? "#1f2937" : "#f3f4f6"} strokeWidth="2" />
                  <line x1="50" y1="180" x2="700" y2="180" stroke={darkMode ? "#1f2937" : "#f3f4f6"} strokeWidth="2" />
                  {[60, 100, 140].map((y, i) => (
                    <line key={i} x1="50" y1={y} x2="700" y2={y} stroke={darkMode ? "#1f2937" : "#f3f4f6"} strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
                  ))}
                  
                  {/* Dynamic activity lines */}
                  {(() => {
                    if (activityData.length === 0) return null;
                    
                    const maxTasks = Math.max(...activityData.map(d => d.tasks), 1);
                    const maxUsers = Math.max(...activityData.map(d => d.users), 1);
                    const totalTasks = activityData.reduce((sum, d) => sum + d.tasks, 0);
                    
                    const taskPoints = activityData.map((d, i) => {
                      const x = 50 + (i / (activityData.length - 1)) * 650;
                      const y = 180 - (d.tasks / maxTasks) * 140 - 20;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    const userPoints = activityData.map((d, i) => {
                      const x = 50 + (i / (activityData.length - 1)) * 650;
                      const y = 180 - (d.users / maxUsers) * 120 - 20;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <>
                        {/* Task area fill */}
                        {totalTasks > 0 && (
                          <polygon
                            fill="url(#taskAreaGradient)"
                            points={`50,180 ${taskPoints} 700,180`}
                          />
                        )}
                        
                        {/* User area fill */}
                        <polygon
                          fill="url(#userAreaGradient)"
                          points={`50,180 ${userPoints} 700,180`}
                        />
                        
                        {/* Tasks line with gradient and glow */}
                        <polyline
                          fill="none"
                          stroke="url(#taskGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={taskPoints}
                          filter="url(#glowEffect)"
                        />
                        
                        {/* Users line with gradient and glow */}
                        <polyline
                          fill="none"
                          stroke="url(#userGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={userPoints}
                          filter="url(#glowEffect)"
                        />
                        
                        {/* Data points with enhanced styling */}
                        {activityData.map((d, i) => {
                          const x = 50 + (i / (activityData.length - 1)) * 650;
                          const yTask = 180 - (d.tasks / maxTasks) * 140 - 20;
                          const yUser = 180 - (d.users / maxUsers) * 120 - 20;
                          
                          // Only show points where there's activity
                          return (
                            <g key={i}>
                              {d.tasks > 0 && (
                                <g>
                                  <circle cx={x} cy={yTask} r="7" fill="#8b5cf6" opacity="0.2" />
                                  <circle cx={x} cy={yTask} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                                  <circle cx={x} cy={yTask} r="1.5" fill="white" />
                                </g>
                              )}
                              {d.users > 0 && (
                                <g>
                                  <circle cx={x} cy={yUser} r="7" fill="#3b82f6" opacity="0.2" />
                                  <circle cx={x} cy={yUser} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                  <circle cx={x} cy={yUser} r="1.5" fill="white" />
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Legend and summary */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Tasks Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Active Users</span>
                  </div>
                </div>
                
                {activityData.length > 0 && (
                  <div className={`pt-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Last 30 days total:
                      </span>
                      <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {activityData.reduce((sum, d) => sum + d.tasks, 0)} tasks completed
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Task Status
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Current task distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {tasksStatusArray.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.status}</span>
                    <span className={`text-xs md:text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.count} tasks</span>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full h-2`}>
                    <div 
                      className={`${item.color} h-2 rounded-full`} 
                      style={{ width: `${totalTasks > 0 ? (item.count / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks with Search */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} mb-4 md:mb-6`}>
        <CardHeader className="p-4 md:p-6">
          <div className="mb-4">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Task Management
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Search and manage all tasks in the system
            </CardDescription>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <Input
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${darkMode ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'}`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
                style={darkMode && filterStatus !== "all" ? { color: 'white', borderColor: 'rgb(55, 65, 81)' } : undefined}
                className={`gap-1 ${darkMode && filterStatus !== "all" ? 'hover:bg-gray-800' : ''}`}
              >
                <Filter className="h-3 w-3" />
                All
              </Button>
              <Button
                variant={filterStatus === "not_picked" ? "default" : "outline"}
                onClick={() => setFilterStatus("not_picked")}
                size="sm"
                style={darkMode && filterStatus !== "not_picked" ? { color: 'white', borderColor: 'rgb(55, 65, 81)' } : undefined}
                className={darkMode && filterStatus !== "not_picked" ? 'hover:bg-gray-800' : ''}
              >
                Not Started
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                onClick={() => setFilterStatus("in_progress")}
                size="sm"
                style={darkMode && filterStatus !== "in_progress" ? { color: 'white', borderColor: 'rgb(55, 65, 81)' } : undefined}
                className={darkMode && filterStatus !== "in_progress" ? 'hover:bg-gray-800' : ''}
              >
                In Progress
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
                size="sm"
                style={darkMode && filterStatus !== "completed" ? { color: 'white', borderColor: 'rgb(55, 65, 81)' } : undefined}
                className={darkMode && filterStatus !== "completed" ? 'hover:bg-gray-800' : ''}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            {(() => {
              // Filter tasks based on search and status
              let filteredTasks = allTasks;
              
              // Apply search filter
              if (searchQuery.trim()) {
                filteredTasks = filteredTasks.filter((task) => {
                  const searchLower = searchQuery.toLowerCase();
                  return (
                    task.title?.toLowerCase().includes(searchLower) ||
                    task.description?.toLowerCase().includes(searchLower) ||
                    task.assigned_user?.full_name?.toLowerCase().includes(searchLower) ||
                    task.assigned_user?.email?.toLowerCase().includes(searchLower)
                  );
                });
              }
              
              // Apply status filter
              if (filterStatus !== "all") {
                filteredTasks = filteredTasks.filter((task) => task.status === filterStatus);
              }
              
              // Sort by created date (newest first)
              const sortedTasks = filteredTasks
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              
              // Calculate pagination
              const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);
              const startIndex = (currentPage - 1) * tasksPerPage;
              const endIndex = startIndex + tasksPerPage;
              const displayTasks = sortedTasks.slice(startIndex, endIndex);

              if (displayTasks.length === 0) {
                return (
                  <div className="text-center py-12">
                    <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      No tasks found
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchQuery ? `No tasks match "${searchQuery}"` : "No tasks available"}
                    </p>
                  </div>
                );
              }

              return displayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 md:p-4 rounded-lg border transition-colors cursor-pointer ${
                    darkMode 
                      ? 'border-gray-800 hover:bg-gray-900' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => router.push(`/admin/tasks/${task.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className={`font-medium text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          task.priority === "high" 
                            ? "destructive" 
                            : task.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <Badge 
                        className={`text-xs ${
                          darkMode
                            ? task.status === "completed"
                              ? "bg-green-900 text-green-200"
                              : task.status === "in_progress"
                              ? "bg-blue-900 text-blue-200"
                              : "bg-gray-800 text-gray-300"
                            : task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status === "not_picked" ? "Not Started" : 
                         task.status === "in_progress" ? "In Progress" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className={`text-xs line-clamp-2 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                  
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-700'}`}>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <span className="flex items-center gap-1 truncate">
                        <Users size={12} />
                        {task.assigned_user?.full_name || task.assigned_user?.email || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    {task.status === "in_progress" && (
                      <span className={`flex items-center gap-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <Clock size={12} />
                        Active
                      </span>
                    )}
                    {task.status === "completed" && (
                      <span className={`flex items-center gap-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        <CheckCircle2 size={12} />
                        Done
                      </span>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
          
          {/* Pagination Controls */}
          {(() => {
            let filteredTasks = allTasks;
            
            if (searchQuery.trim()) {
              filteredTasks = filteredTasks.filter((task) => {
                const searchLower = searchQuery.toLowerCase();
                return (
                  task.title?.toLowerCase().includes(searchLower) ||
                  task.description?.toLowerCase().includes(searchLower) ||
                  task.assigned_user?.full_name?.toLowerCase().includes(searchLower) ||
                  task.assigned_user?.email?.toLowerCase().includes(searchLower)
                );
              });
            }
            
            if (filterStatus !== "all") {
              filteredTasks = filteredTasks.filter((task) => task.status === filterStatus);
            }
            
            const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
            
            if (totalPages <= 1) return null;
            
            return (
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {((currentPage - 1) * tasksPerPage) + 1} to {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`text-xs ${darkMode ? 'text-white border-gray-700 hover:bg-gray-800 disabled:opacity-50' : 'text-gray-900 border-gray-300 hover:bg-gray-50 disabled:opacity-50'}`}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        const isFirstPage = page === 1;
                        const isLastPage = page === totalPages;
                        const isCurrentPage = page === currentPage;
                        const isNearCurrent = page >= currentPage - 1 && page <= currentPage + 1;
                        
                        // Always show: first page, last page, current page, and pages around current
                        if (isFirstPage || isLastPage || isCurrentPage || isNearCurrent) {
                          // Add ellipsis before this page if there's a gap
                          const shouldShowEllipsisBefore = 
                            !isFirstPage && 
                            page > 2 && 
                            page === currentPage - 1 && 
                            currentPage > 3;
                          
                          // Add ellipsis after current range before last page
                          const shouldShowEllipsisAfter = 
                            !isLastPage && 
                            page < totalPages - 1 && 
                            page === currentPage + 1 && 
                            currentPage < totalPages - 2;
                          
                          return (
                            <React.Fragment key={page}>
                              {shouldShowEllipsisBefore && (
                                <span className={`text-xs px-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                              )}
                              <Button
                                variant={isCurrentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`text-xs w-8 h-8 p-0 ${
                                  darkMode && !isCurrentPage 
                                    ? 'text-white border-gray-700 hover:bg-gray-800' 
                                    : ''
                                }`}
                              >
                                {page}
                              </Button>
                              {shouldShowEllipsisAfter && (
                                <span className={`text-xs px-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                              )}
                            </React.Fragment>
                          );
                        }
                        return null;
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`text-xs ${darkMode ? 'text-white border-gray-700 hover:bg-gray-800 disabled:opacity-50' : 'text-gray-900 border-gray-300 hover:bg-gray-50 disabled:opacity-50'}`}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* View All Tasks Button */}
          <div className="mt-4 pt-4">
            <Button 
              variant="outline" 
              className={`w-full text-sm ${darkMode ? 'text-white border-gray-700 hover:bg-gray-800' : 'text-gray-900 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => router.push("/admin/tasks")}
            >
              View All Tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6">
          <div>
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Users
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Recently added and active users in the system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")} className={`w-full sm:w-auto text-xs ${darkMode ? 'text-white border-gray-700 hover:bg-gray-800' : 'text-gray-900 border-gray-300 hover:bg-gray-50'}`}>
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            {recentUsers.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No users found
              </div>
            ) : (
              recentUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg border ${darkMode ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                      {userItem.full_name?.charAt(0) || userItem.email?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userItem.full_name || "No Name"}</h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-700'} truncate`}>{userItem.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-2 py-0.5 border ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-800'}`}>
                      {userItem.role || "employee"}
                    </Badge>
                    <Badge 
                      className={`text-xs px-2 py-0.5 border ${
                        userItem.status === 'active' 
                          ? darkMode ? 'border-green-800 bg-green-900 text-green-200' : 'border-green-200 bg-green-100 text-green-800'
                          : darkMode ? 'border-yellow-800 bg-yellow-900 text-yellow-200' : 'border-yellow-200 bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {userItem.status || "active"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 md:mt-4 text-center">
            <Button 
              variant="outline" 
              className={`w-full text-sm ${darkMode ? 'text-white border-gray-700 hover:bg-gray-800' : ''}`}
              onClick={() => router.push("/admin/users")}
            >
              Manage All Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
