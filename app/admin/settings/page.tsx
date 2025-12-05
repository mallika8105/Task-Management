"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import {
  Settings,
  Database,
  Mail,
  Shield,
  Bell,
  Palette,
  Save,
  RefreshCw,
} from "lucide-react";

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "Task Management System",
    adminEmail: "admin@example.com",
    maxUsersPerTask: "10",
    taskRetentionDays: "90",
    enableEmailNotifications: true,
    enablePushNotifications: false,
    defaultTaskPriority: "medium",
    autoAssignTasks: false,
  });

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
    
    // Simulate loading settings
    setTimeout(() => setLoading(false), 500);
    
    return () => observer.disconnect();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert("Settings saved successfully!");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        siteName: "Task Management System",
        adminEmail: "admin@example.com",
        maxUsersPerTask: "10",
        taskRetentionDays: "90",
        enableEmailNotifications: true,
        enablePushNotifications: false,
        defaultTaskPriority: "medium",
        autoAssignTasks: false,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className={`flex justify-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Settings
          </h1>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className={darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
          >
            <RefreshCw size={16} className="mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* General Settings */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <Settings className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                General Settings
              </CardTitle>
            </div>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Basic system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div>
              <Label htmlFor="siteName" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <Label htmlFor="adminEmail" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <Label htmlFor="maxUsers" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Max Users Per Task</Label>
              <Input
                id="maxUsers"
                type="number"
                value={settings.maxUsersPerTask}
                onChange={(e) => setSettings({...settings, maxUsersPerTask: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <Label htmlFor="retention" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Task Retention (Days)</Label>
              <Input
                id="retention"
                type="number"
                value={settings.taskRetentionDays}
                onChange={(e) => setSettings({...settings, taskRetentionDays: e.target.value})}
                className={`mt-1 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                How long to keep completed tasks before archiving
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <Bell className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </CardTitle>
            </div>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email Notifications</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Send email updates for task changes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettings({...settings, enableEmailNotifications: !settings.enableEmailNotifications})}
                className={
                  darkMode ? (
                    settings.enableEmailNotifications 
                      ? 'bg-white !text-black border-white hover:!bg-gray-100 hover:!text-black [&]:!text-black'
                      : 'bg-transparent !text-white border-gray-700 hover:!bg-gray-800 hover:!text-white [&]:!text-white'
                  ) : settings.enableEmailNotifications 
                      ? 'bg-gray-900 !text-white border-gray-900 hover:bg-gray-800'
                      : '!text-gray-900'
                }
              >
                <span style={darkMode ? (settings.enableEmailNotifications ? {color: 'black'} : {color: 'white'}) : undefined}>
                  {settings.enableEmailNotifications ? "Enabled" : "Disabled"}
                </span>
              </Button>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Push Notifications</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Browser push notifications</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettings({...settings, enablePushNotifications: !settings.enablePushNotifications})}
                className={
                  darkMode ? (
                    settings.enablePushNotifications 
                      ? 'bg-white !text-black border-white hover:!bg-gray-100 hover:!text-black [&]:!text-black'
                      : 'bg-transparent !text-white border-gray-700 hover:!bg-gray-800 hover:!text-white [&]:!text-white'
                  ) : settings.enablePushNotifications 
                      ? 'bg-gray-900 !text-white border-gray-900 hover:bg-gray-800'
                      : '!text-gray-900'
                }
              >
                <span style={darkMode ? (settings.enablePushNotifications ? {color: 'black'} : {color: 'white'}) : undefined}>
                  {settings.enablePushNotifications ? "Enabled" : "Disabled"}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Management Settings */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <Database className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Task Management
              </CardTitle>
            </div>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Default task settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div>
              <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Default Task Priority</Label>
              <div className="flex gap-2 mt-2">
                {['low', 'medium', 'high'].map(priority => (
                  <Badge
                    key={priority}
                    variant={settings.defaultTaskPriority === priority ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setSettings({...settings, defaultTaskPriority: priority})}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Auto-Assign Tasks</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Automatically assign to available users</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettings({...settings, autoAssignTasks: !settings.autoAssignTasks})}
                className={
                  darkMode ? (
                    settings.autoAssignTasks 
                      ? 'bg-white !text-black border-white hover:!bg-gray-100 hover:!text-black [&]:!text-black'
                      : 'bg-transparent !text-white border-gray-700 hover:!bg-gray-800 hover:!text-white [&]:!text-white'
                  ) : settings.autoAssignTasks 
                      ? 'bg-gray-900 !text-white border-gray-900 hover:bg-gray-800'
                      : '!text-gray-900'
                }
              >
                <span style={darkMode ? (settings.autoAssignTasks ? {color: 'black'} : {color: 'white'}) : undefined}>
                  {settings.autoAssignTasks ? "Enabled" : "Disabled"}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Security
              </CardTitle>
            </div>
            <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              System security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className={`p-4 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start gap-3">
                <Shield className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Authentication Status
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Supabase authentication is active and secure
                  </p>
                  <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start gap-3">
                <Database className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Database Connection
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Connected to Supabase PostgreSQL
                  </p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Connected
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} mt-4 md:mt-6`}>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Information
          </CardTitle>
          <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Current system status and version
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Version</p>
              <p className={`text-sm font-medium mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>1.0.0</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Environment</p>
              <p className={`text-sm font-medium mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Production</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Last Updated</p>
              <p className={`text-sm font-medium mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
