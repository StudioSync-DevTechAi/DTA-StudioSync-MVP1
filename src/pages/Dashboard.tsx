import React, { Suspense, memo, useState } from "react";
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
  Image,
  Video,
  Edit,
  Loader2,
  MessageSquare,
  Plus,
  FolderKanban
} from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkInProgress } from "@/components/ui/WorkInProgress";
import { EnrollPhotographerModal } from "@/components/dashboard/EnrollPhotographerModal";

// Lazy-loaded components
const MediaTagger = React.lazy(() => import("@/components/ai/MediaTagger").then(mod => ({ default: mod.MediaTagger })));

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const { metrics, loading: dashboardLoading, error: dashboardError } = useDashboard();
  const navigate = useNavigate();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

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
      path: "/estimates",
      color: "bg-blue-500",
      showWIP: false
    },
    {
      title: "Projects",
      description: "View and manage all projects",
      icon: FolderKanban,
      path: "/estimates/projects",
      color: "bg-teal-500",
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
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              Welcome back, {profile?.full_name || user?.email}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Manage your photography business with all tools in one place
            </p>
          </div>
          <Button
            onClick={() => setEnrollModalOpen(true)}
            variant="outline"
            className="w-full sm:w-auto shrink-0 border-amber-400 hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all duration-300"
          >
            Enroll VG or PG
          </Button>
        </div>

        {/* Work in Progress Card with Action Buttons */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <WorkInProgress variant="card" size="lg" className="w-fit max-w-md" />
          <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-auto">
            <Button 
              onClick={() => navigate("/estimates/projects/new")} 
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button 
              onClick={() => navigate("/estimates")} 
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {dashboardError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start sm:items-center space-x-2 text-red-600">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm break-words">Error loading dashboard data: {dashboardError}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
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
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Quick Upload
            </CardTitle>
            <CardDescription className="text-sm">
              Upload content and data to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {uploadOptions.map((option) => (
                <Button
                  key={option.title}
                  variant="outline"
                  className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:bg-accent transition-colors"
                  onClick={option.action}
                >
                  <option.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  <div className="text-center">
                    <div className="font-medium text-sm sm:text-base">{option.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Modules */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">All Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {modules.map((module) => (
              <Card 
                key={module.title} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col"
                onClick={() => handleModuleClick(module.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`p-2 rounded-lg ${module.color} shrink-0`}>
                      <module.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg truncate">{module.title}</CardTitle>
                        {module.showWIP && (
                          <WorkInProgress size="sm" />
                        )}
                      </div>
                      <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full text-sm" 
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
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-full shrink-0">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">New estimate created</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Wedding photography for Kumar family</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">2h ago</span>
              </div>
              
              <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full shrink-0">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">Event scheduled</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Pre-wedding shoot on May 25th</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">1d ago</span>
              </div>
              
              <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-full shrink-0">
                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">Invoice payment received</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">₹50,000 from Sharma Wedding</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">3d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Feature Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">AI Media Tagger</CardTitle>
            <CardDescription className="text-sm">
              Automatically tag and categorize your media with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex flex-col sm:flex-row items-center justify-center p-4 sm:p-8 gap-2 sm:gap-0">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                <span className="text-sm sm:text-base ml-0 sm:ml-2 text-center sm:text-left">Loading AI Media Tagger...</span>
              </div>
            }>
              <MediaTagger />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      <EnrollPhotographerModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
      />
    </Layout>
  );
}

export default memo(Dashboard);