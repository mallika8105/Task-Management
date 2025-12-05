"use client";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import Link from "next/link";
import {
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
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
  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Task Management",
      description:
        "Organize and prioritize tasks with ease. Set deadlines, assign tasks, and track progress in real-time.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description:
        "Work together seamlessly. Share updates, communicate efficiently, and achieve goals as a team.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights",
      description:
        "Get detailed insights into team performance, task completion rates, and productivity metrics.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security with role-based access control to keep your data safe.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fast & Efficient",
      description:
        "Lightning-fast performance with real-time updates and notifications.",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Easy to Use",
      description:
        "Intuitive interface designed for productivity. Get started in minutes, not hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-top" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Powerful Task Management
          </Badge>

          <h1 className={`mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-7xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Manage Tasks{" "}
            <span className="relative whitespace-nowrap text-primary">
              <span className="relative">Efficiently</span>
            </span>
          </h1>

          <p className={`mx-auto mt-6 max-w-2xl text-lg tracking-tight ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
            Streamline your workflow, boost productivity, and achieve more with
            our comprehensive task management solution.
          </p>

          <div className="mt-10 flex justify-center">
            <Link href="/auth/login">
              <Button
                size="lg"
                className={`group ${darkMode ? 'bg-primary text-white hover:bg-primary/90' : 'bg-black text-white hover:bg-black/90'}`}
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
            <div>
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Tasks Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">
              Everything you need
            </h2>
            <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              All-in-one task management platform
            </p>
            <p className={`mt-6 text-lg leading-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Powerful features to help you and your team stay organized and
              productive.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="transition-all hover:shadow-lg hover:scale-105"
                >
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative isolate overflow-hidden bg-secondary">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to boost your productivity?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Join thousands of teams already using our platform to manage their
              tasks more effectively.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-black/90 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-foreground text-foreground hover:bg-foreground hover:text-background"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
