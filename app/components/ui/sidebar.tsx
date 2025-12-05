"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarContextProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  children,
  className,
  darkMode,
}: {
  children: React.ReactNode;
  className?: string;
  darkMode?: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r transition-all duration-300",
        darkMode ? "border-gray-800" : "border-gray-200",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({
  children,
  className,
  darkMode,
}: {
  children: React.ReactNode;
  className?: string;
  darkMode?: boolean;
}) {
  return (
    <div className={cn(
      "px-4 py-4 border-b h-16 flex items-center",
      darkMode ? "border-gray-800" : "border-gray-200",
      className
    )}>
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-4", className)}>
      {children}
    </div>
  );
}

export function SidebarFooter({
  children,
  className,
  darkMode,
}: {
  children: React.ReactNode;
  className?: string;
  darkMode?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 border-t",
      darkMode ? "border-gray-800" : "border-gray-200",
      className
    )}>
      {children}
    </div>
  );
}

export function SidebarMenu({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <nav className={cn("space-y-1 px-2", className)}>{children}</nav>;
}

export function SidebarMenuItem({
  children,
  active = false,
  icon,
  onClick,
  className,
  darkMode,
}: {
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  darkMode?: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? darkMode
            ? "bg-gray-800 text-white"
            : "bg-gray-900 text-white"
          : darkMode
          ? "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        collapsed && "justify-center",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!collapsed && <span>{children}</span>}
    </button>
  );
}
