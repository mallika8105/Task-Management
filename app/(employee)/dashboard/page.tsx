"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Filter,
  Search,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    notPicked: 0,
  });
  const [priorityStats, setPriorityStats] = useState({
    high: 0,
    medium: 0,
    low: 0,
  });
  const [completionTrend, setCompletionTrend] = useState<{ date: string; count: number }[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const router = useRouter();

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
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);

        // Fetch tasks from database
        const { supabase } = await import("@/lib/supabase/client");
        const { data: tasksData, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", currentUser.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTasks(tasksData || []);

        // Calculate stats
        const total = tasksData?.length || 0;
        const inProgress = tasksData?.filter((t: any) => t.status === "in_progress").length || 0;
        const completed = tasksData?.filter((t: any) => t.status === "completed").length || 0;
        const notPicked = tasksData?.filter((t: any) => t.status === "not_picked").length || 0;

        setTaskStats({ total, inProgress, completed, notPicked });

        // Calculate priority stats
        const high = tasksData?.filter((t: any) => t.priority === "high").length || 0;
        const medium = tasksData?.filter((t: any) => t.priority === "medium").length || 0;
        const low = tasksData?.filter((t: any) => t.priority === "low").length || 0;

        setPriorityStats({ high, medium, low });

        // Calculate task completion trend for last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          date.setHours(0, 0, 0, 0);
          return date.toISOString().split('T')[0];
        });

        const trendData = last30Days.map(dateStr => {
          // Create date range in local timezone for accurate comparison
          const dayStart = new Date(dateStr);
          dayStart.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(dateStr);
          dayEnd.setHours(23, 59, 59, 999);

          const count = tasksData?.filter((t: any) => {
            if (t.status !== 'completed') return false;
            
            // Use updated_at if it exists and is different from created_at
            // Otherwise use created_at for tasks that were created as completed
            const completionTimestamp = t.updated_at && t.updated_at !== t.created_at 
              ? t.updated_at 
              : t.created_at;
            
            const completionDate = new Date(completionTimestamp);
            
            return completionDate >= dayStart && completionDate <= dayEnd;
          }).length || 0;

          return { date: dateStr, count };
        });

        setCompletionTrend(trendData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`flex justify-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: "Total Tasks",
      value: taskStats.total.toString(),
      icon: <ListTodo size={20} />,
      color: "bg-blue-500",
    },
    {
      label: "In Progress",
      value: taskStats.inProgress.toString(),
      icon: <Clock size={20} />,
      color: "bg-yellow-500",
    },
    {
      label: "Completed",
      value: taskStats.completed.toString(),
      icon: <CheckCircle2 size={20} />,
      color: "bg-green-500",
    },
    {
      label: "Not Picked",
      value: taskStats.notPicked.toString(),
      icon: <AlertCircle size={20} />,
      color: "bg-gray-500",
    },
  ];

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = 
      activeFilter === "all" ||
      (activeFilter === "not_started" && task.status === "not_picked") ||
      (activeFilter === "in_progress" && task.status === "in_progress") ||
      (activeFilter === "completed" && task.status === "completed");
    
    return matchesFilter;
  });

  const recentTasks = filteredTasks.slice(0, 5);

  const getPriorityColor = (priority: string) => {
    if (darkMode) {
      switch (priority) {
        case "high":
          return "bg-red-900 text-red-200 border-red-800";
        case "medium":
          return "bg-yellow-900 text-yellow-200 border-yellow-800";
        case "low":
          return "bg-green-900 text-green-200 border-green-800";
        default:
          return "bg-gray-800 text-gray-300 border-gray-700";
      }
    }
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
  };

  const getStatusColor = (status: string) => {
    if (darkMode) {
      switch (status) {
        case "completed":
          return "bg-green-900 text-green-200 border-green-800";
        case "in_progress":
          return "bg-blue-900 text-blue-200 border-blue-800";
        case "not_picked":
          return "bg-gray-800 text-gray-300 border-gray-700";
        default:
          return "bg-gray-800 text-gray-300 border-gray-700";
      }
    }
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
  };

  const formatStatus = (status: string) => {
    return status
      .replace("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Welcome back, {user?.user_metadata?.full_name || "Employee"}!
          </p>
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
            Export
          </Button>
        </div>
      </div>

      {/* Task Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat, idx) => (
          <Card key={idx} className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${stat.color} ${stat.color.replace('bg-', 'bg-opacity-10 bg-')}`}
                >
                  <div className={stat.color.replace('bg-', 'text-')}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Task Completion Chart */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} lg:col-span-2`}>
          <CardHeader>
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Task Completion Trend
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
              Your task completion rate over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Graph */}
              <div className={`h-64 relative rounded-xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <svg className="w-full h-full" viewBox="0 0 700 220">
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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

                  {/* Dynamic line chart based on actual data */}
                  {(() => {
                    if (completionTrend.length === 0) return null;
                    
                    const maxCount = Math.max(...completionTrend.map(d => d.count), 1);
                    const totalTasks = completionTrend.reduce((sum, d) => sum + d.count, 0);
                    
                    // If no tasks completed, show a flat line at bottom
                    if (totalTasks === 0) {
                      const points = completionTrend.map((d, i) => {
                        const x = 50 + (i / (completionTrend.length - 1)) * 650;
                        const y = 180;
                        return `${x},${y}`;
                      }).join(' ');
                      
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke={darkMode ? "#4b5563" : "#d1d5db"}
                            strokeWidth="2"
                            strokeDasharray="8,4"
                            points={points}
                          />
                          {completionTrend.map((d, i) => {
                            const x = 50 + (i / (completionTrend.length - 1)) * 650;
                            return (
                              <circle key={i} cx={x} cy={180} r="4" fill={darkMode ? "#4b5563" : "#d1d5db"} opacity="0.5" />
                            );
                          })}
                        </>
                      );
                    }
                    
                    const points = completionTrend.map((d, i) => {
                      const x = 50 + (i / (completionTrend.length - 1)) * 650;
                      const y = 180 - (d.count / maxCount) * 140 - 20;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <>
                        {/* Area fill with gradient */}
                        <polygon
                          fill="url(#areaGradient)"
                          points={`50,180 ${points} 700,180`}
                        />
                        
                        {/* Main line with gradient and glow effect */}
                        <polyline
                          fill="none"
                          stroke="url(#lineGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                          filter="url(#glow)"
                        />
                        
                        {/* Data points with hover effect */}
                        {completionTrend.map((d, i) => {
                          const x = 50 + (i / (completionTrend.length - 1)) * 650;
                          const y = 180 - (d.count / maxCount) * 140 - 20;
                          
                          if (d.count === 0) return null;
                          
                          return (
                            <g key={i}>
                              {/* Outer glow circle */}
                              <circle cx={x} cy={y} r="8" fill="#10b981" opacity="0.2" />
                              {/* Main point */}
                              <circle cx={x} cy={y} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                              {/* Center highlight */}
                              <circle cx={x} cy={y} r="2" fill="white" />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Day labels - show every 5th day to avoid overcrowding */}
              <div className="flex justify-between px-2">
                {completionTrend.map((d, i) => {
                  if (i % 5 !== 0 && i !== completionTrend.length - 1) return null;
                  const date = new Date(d.date);
                  const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className={`pt-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Last 30 days total:
                  </span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {completionTrend.reduce((sum, d) => sum + d.count, 0)} tasks completed
                  </span>
                </div>
                {completionTrend.reduce((sum, d) => sum + d.count, 0) === 0 && (
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    No tasks completed in the last 30 days. Start completing tasks to see your progress!
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Priority Distribution
            </CardTitle>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
              Tasks by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>High</span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {priorityStats.high} tasks
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${taskStats.total > 0 ? (priorityStats.high / taskStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Medium</span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {priorityStats.medium} tasks
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${taskStats.total > 0 ? (priorityStats.medium / taskStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low</span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {priorityStats.low} tasks
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${taskStats.total > 0 ? (priorityStats.low / taskStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <div>
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeFilter === "all" ? "Recent Tasks" : 
                 activeFilter === "not_started" ? "Not Started Tasks" :
                 activeFilter === "in_progress" ? "In Progress Tasks" : "Completed Tasks"}
              </CardTitle>
              <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : ''}`}>
                Your {activeFilter === "all" ? "most recent" : activeFilter.replace("_", " ")} task assignments
              </CardDescription>
            </div>
            
            {/* Filter buttons on the right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === "all"
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={16} className="inline mr-1" />
                All
              </button>
              <button
                onClick={() => setActiveFilter("not_started")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === "not_started"
                    ? darkMode
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Started
              </button>
              <button
                onClick={() => setActiveFilter("in_progress")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === "in_progress"
                    ? darkMode
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setActiveFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === "completed"
                    ? darkMode
                      ? 'bg-green-600 text-white'
                      : 'bg-green-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No tasks found
                </p>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    darkMode 
                      ? 'border-gray-800 hover:bg-gray-900' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => router.push(`/mytasks`)}
                >
                  <div className="flex-1">
                    <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        className={`text-xs px-2 py-0.5 border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge
                        className={`text-xs px-2 py-0.5 border ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {formatStatus(task.status)}
                      </Badge>
                      <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar size={12} />
                        {task.deadline}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className={darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : ''}>
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => router.push("/mytasks")}
              className={darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
            >
              View All Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
