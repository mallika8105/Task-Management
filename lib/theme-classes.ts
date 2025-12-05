/**
 * Centralized Theme Class Management
 * 
 * This file contains all theme-related Tailwind classes to ensure consistency
 * across the application. All components should use these utilities instead of
 * manually handling dark mode conditionals.
 */

export const themeClasses = {
  // Text Colors
  text: {
    // Headings and important text
    primary: "text-gray-900 dark:text-white",
    
    // Regular body text
    body: "text-gray-700 dark:text-gray-300",
    
    // Secondary/muted text
    muted: "text-gray-600 dark:text-gray-400",
    
    // Very light/disabled text
    disabled: "text-gray-500 dark:text-gray-500",
    
    // Links
    link: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
  },

  // Background Colors
  bg: {
    primary: "bg-white dark:bg-gray-950",
    secondary: "bg-gray-50 dark:bg-gray-900",
    accent: "bg-gray-100 dark:bg-gray-800",
    hover: "hover:bg-gray-100 dark:hover:bg-gray-800",
  },

  // Border Colors
  border: {
    default: "border-gray-200 dark:border-gray-800",
    light: "border-gray-300 dark:border-gray-700",
    strong: "border-gray-400 dark:border-gray-600",
  },

  // Input/Form Elements
  input: {
    bg: "bg-white dark:bg-gray-900",
    border: "border-gray-300 dark:border-gray-700",
    text: "text-gray-900 dark:text-white",
    placeholder: "placeholder:text-gray-400 dark:placeholder:text-gray-500",
  },

  // Cards
  card: {
    bg: "bg-white dark:bg-gray-950",
    border: "border-gray-200 dark:border-gray-800",
  },
} as const;

/**
 * Helper function to get theme classes
 * @param category - The category of theme classes (e.g., 'text', 'bg', 'border')
 * @param variant - The variant within the category (e.g., 'primary', 'muted')
 * @returns The corresponding Tailwind classes
 */
export function getThemeClass(category: keyof typeof themeClasses, variant: string): string {
  const categoryObj = themeClasses[category] as Record<string, string>;
  return categoryObj[variant] || '';
}

/**
 * Shorthand helpers for common use cases
 */
export const theme = {
  // Text shortcuts
  heading: themeClasses.text.primary,
  text: themeClasses.text.body,
  muted: themeClasses.text.muted,
  disabled: themeClasses.text.disabled,
  
  // Background shortcuts
  bg: themeClasses.bg.primary,
  bgSecondary: themeClasses.bg.secondary,
  
  // Input shortcut
  input: `${themeClasses.input.bg} ${themeClasses.input.border} ${themeClasses.input.text} ${themeClasses.input.placeholder}`,
} as const;
