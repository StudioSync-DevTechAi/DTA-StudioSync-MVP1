import React, { Suspense, memo } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/services/dashboard";
import { 
  Camera, 
  DollarSign, 
  Calendar, 
  FileText, 
  Upload, 
  Users, 
  Receipt,
  BarChart3,
  Settings,
  Image,
  Video,
  Edit,
  Loader2,
  MessageSquare
} from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkInProgress } from "@/components/ui/WorkInProgress";

// Lazy-loaded components
const MediaTagger = React.lazy(() => import("@/components/ai/MediaTagger").then(mod => ({ default: mod.MediaTagger })));

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const { metrics, loading: dashboardLoading, error: dashboardError } = useDashboard();
  const navigate = useNavigate();

  // Show loading if still checking auth
  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Quick action modules
  const modules = [
    {
      title: "Estimates",
      description: "Create and manage project estimates",
      icon: FileText,
      path: "/estimates/projects",
      color: "bg-blue-500",
      showWIP: false
    },
    {
      title: "Scheduling",
      description: "Schedule events and manage calendar",
      icon: Calendar,
      path: "/workflow",
      color: "bg-green-500",
      showWIP: true
    },
    {
      title: "Finances",
      description: "Track income, expenses and reports",
      icon: DollarSign,
      path: "/finances",
      color: "bg-yellow-500",
      showWIP: true
    },
    {
      title: "Invoices",
      description: "Generate and manage invoices",
      icon: Receipt,
      path: "/invoices",
      color: "bg-purple-500",
      showWIP: true
    },
    {
      title: "Portfolio",
      description: "Upload and showcase your work",
      icon: Camera,
      path: "/portfolio",
      color: "bg-pink-500",
      showWIP: false
    },
    {
      title: "Workflow",
      description: "Manage pre/production/post workflows",
      icon: BarChart3,
      path: "/workflow",
      color: "bg-indigo-500",
      showWIP: true
    }
  ];

  // Upload options
  const uploadOptions = [
    {
      title: "Upload Photos",
      description: "Add photos to your portfolio",
      icon: Image,
      action: () => navigate("/portfolio")
    },
    {
      title: "Upload Videos", 
      description: "Add videos to your collection",
      icon: Video,
      action: () => navigate("/portfolio")
    },
    {
      title: "Import Data",
      description: "Import financial data or contacts",
      icon: Upload,
      action: () => navigate("/finances")
    }
  ];

  const handleModuleClick = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <Layout>
      <div className="space-y-8 p-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || user?.email}!</h1>
            <p className="text-muted-foreground mt-2">
              Manage your photography business with all tools in one place
            </p>
          </div>
          <Button onClick={() => navigate("/settings")} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Work in Progress Card */}
        <WorkInProgress variant="card" size="lg" className="mb-6" />

        {/* Stats Overview */}
        {dashboardError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Error loading dashboard data: {dashboardError}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Quote Enquiries"
            value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.pendingEnquiries?.toString() || '0'}
            icon={MessageSquare}
            trend={{ value: 5, label: "vs last week" }}
            onClick={() => navigate("/quote-enquiries")}
          />
          <StatCard
            title="Monthly Revenue"
            value={dashboardLoading ? <Skeleton className="h-6 w-16" /> : `₹${metrics?.monthlyRevenue?.toLocaleString() || '0'}`}
            icon={DollarSign}
            trend={{ value: 12, label: "vs last month" }}
          />
          <StatCard
            title="Upcoming Events"
            value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.upcomingEvents?.toString() || '0'}
            icon={Calendar}
            trend={{ value: 2, label: "vs last week" }}
          />
          <StatCard
            title="Pending Invoices"
            value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.pendingInvoices?.toString() || '0'}
            icon={Receipt}
            trend={{ value: -1, label: "vs last week" }}
          />
          <StatCard
            title="Active Projects"
            value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.activeProjects?.toString() || '0'}
            icon={FileText}
            trend={{ value: 3, label: "vs last month" }}
          />
        </div>

        {/* Quick Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Quick Upload
            </CardTitle>
            <CardDescription>
              Upload content and data to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {uploadOptions.map((option) => (
                <Button
                  key={option.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent"
                  onClick={option.action}
                >
                  <option.icon className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">{option.title}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Modules */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">All Modules</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card 
                key={module.title} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handleModuleClick(module.path)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${module.color}`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        {module.showWIP && (
                          <WorkInProgress size="sm" />
                        )}
                      </div>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModuleClick(module.path);
                    }}
                  >
                    Open {module.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New estimate created</p>
                  <p className="text-sm text-muted-foreground">Wedding photography for Kumar family</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Event scheduled</p>
                  <p className="text-sm text-muted-foreground">Pre-wedding shoot on May 25th</p>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Receipt className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Invoice payment received</p>
                  <p className="text-sm text-muted-foreground">₹50,000 from Sharma Wedding</p>
                </div>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Feature Card */}
        <Card>
          <CardHeader>
            <CardTitle>AI Media Tagger</CardTitle>
            <CardDescription>
              Automatically tag and categorize your media with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading AI Media Tagger...</span>
              </div>
            }>
              <MediaTagger />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default memo(Dashboard);