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
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
        <LoadingSpinner text="Loading dashboard..." />
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
      path: "/projects",
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
      <style>{`
        @keyframes borderGlow {
          0%, 100% {
            box-shadow: 0 0 3px rgba(157, 234, 249, 0.25),
                        0 0 6px rgba(255, 255, 255, 0.15),
                        0 0 9px rgba(0, 191, 231, 0.1);
          }
          50% {
            box-shadow: 0 0 5px rgba(0, 191, 231, 0.4),
                        0 0 10px rgba(0, 191, 231, 0.3),
                        0 0 15px rgba(0, 191, 231, 0.2);
          }
        }
        @keyframes innerBoxGlow {
          0%, 100% {
            box-shadow: 0 0 2px rgba(0, 191, 231, 0.2),
                        0 0 4px rgba(0, 191, 231, 0.12),
                        0 0 6px rgba(0, 191, 231, 0.08);
          }
          50% {
            box-shadow: 0 0 4px rgba(0, 191, 231, 0.35),
                        0 0 8px rgba(0, 191, 231, 0.25),
                        0 0 12px rgba(255, 255, 255, 0.15);
          }
        }
        .animated-border:hover {
          animation: borderGlow 2s ease-in-out infinite;
        }
        .animated-inner-box:hover {
          animation: innerBoxGlow 2s ease-in-out infinite;
        }
      `}</style>
      <div 
        className="space-y-12 sm:space-y-16 lg:space-y-20 px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6 max-w-7xl mx-auto" 
        style={{ 
          minHeight: '100vh', 
          color: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Exact hero background from theme-videograph */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/theme-videograph/videograph-master/videograph-master/img/hero/hero-4.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            zIndex: 0
          }}
        />
        {/* Subtle dark overlay for better text readability */}
        <div 
          style={{
            position: 'absolute',
            top: -80,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30, 10, 60, 0.35)',
            zIndex: 1
          }}
        />
        <div style={{ position: 'relative', zIndex: 3, paddingTop: 0, marginTop: 0 }}>
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" style={{ color: '#ffffff' }}>
              Welcome back, {profile?.full_name || user?.email}!
            </h1>
            <p className="text-sm sm:text-base mt-1 sm:mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Manage your photography business with all tools in one place
            </p>
          </div>
          <Button
            onClick={() => setEnrollModalOpen(true)}
            variant="outline"
            className="animated-border w-full sm:w-auto shrink-0 transition-all duration-300"
            style={{ 
              backgroundColor: 'transparent',
              color: '#ffffff',
              borderColor: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
          >
            Enroll VG or PG
          </Button>
        </div>

        {/* Work in Progress Card with Action Buttons */}
        <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <WorkInProgress variant="card" size="lg" className="w-fit max-w-md" />
          <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-auto">
            <Button 
              onClick={() => {
                // Clear all project-related sessionStorage data before starting new project
                try {
                  sessionStorage.removeItem("newProjectFormData");
                  sessionStorage.removeItem("newProjectCurrentPage");
                  sessionStorage.removeItem("newProjectEventPackages");
                  sessionStorage.removeItem("newProjectSelectedFormat");
                  sessionStorage.removeItem("newProjectEstimateUuid");
                  sessionStorage.removeItem("newProjectPhotographyOwnerPhno");
                  sessionStorage.removeItem("newProjectName");
                  sessionStorage.removeItem("newProjectType");
                  sessionStorage.removeItem("newProjectLastModified");
                  sessionStorage.removeItem("newProjectClientName");
                  sessionStorage.removeItem("newProjectClientEmail");
                  sessionStorage.removeItem("newProjectClientPhone");
                  console.log("Cleared all project data from sessionStorage");
                } catch (error) {
                  console.error("Error clearing project sessionStorage:", error);
                }
                navigate("/projects/new");
              }} 
              className="animated-border w-full sm:w-auto"
              variant="outline"
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                borderColor: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button 
              onClick={() => navigate("/estimates")} 
              className="animated-border w-full sm:w-auto"
              variant="outline"
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                borderColor: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {dashboardError && (
          <Card style={{ backgroundColor: 'transparent', borderColor: '#ff4444' }}>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start sm:items-center space-x-2" style={{ color: '#ff6666' }}>
                <FileText className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm break-words">Error loading dashboard data: {dashboardError}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          <div 
            className="animated-border"
            style={{ backgroundColor: 'transparent', borderRadius: '8px', border: '1.5px solid #ffffff', color: '#ffffff', transition: 'background-color 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 191, 231, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <StatCard
              title="Quote Enquiries"
              value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.pendingEnquiries?.toString() || '0'}
              icon={MessageSquare}
              trend={{ value: 5, label: "vs last week" }}
              onClick={() => navigate("/quote-enquiries")}
              className="bg-transparent border-0 [&_p]:!text-white/90 [&_h3]:!text-[#ffffff]"
            />
          </div>
          <div 
            className="animated-border"
            style={{ backgroundColor: 'transparent', borderRadius: '8px', border: '1.5px solid #ffffff', color: '#ffffff', transition: 'background-color 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <StatCard
              title="Monthly Revenue"
              value={dashboardLoading ? <Skeleton className="h-6 w-16" /> : `₹${metrics?.monthlyRevenue?.toLocaleString() || '0'}`}
              icon={DollarSign}
              trend={{ value: 12, label: "vs last month" }}
              className="bg-transparent border-0 [&_p]:!text-white/90 [&_h3]:!text-[#ffffff]"
            />
          </div>
          <div 
            className="animated-border"
            style={{ backgroundColor: 'transparent', borderRadius: '8px', border: '1.5px solid #ffffff', color: '#ffffff', transition: 'background-color 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <StatCard
              title="Upcoming Events"
              value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.upcomingEvents?.toString() || '0'}
              icon={Calendar}
              trend={{ value: 2, label: "vs last week" }}
              className="bg-transparent border-0 [&_p]:!text-white/90 [&_h3]:!text-[#ffffff]"
            />
          </div>
          <div 
            className="animated-border"
            style={{ backgroundColor: 'transparent', borderRadius: '8px', border: '1.5px solid #ffffff', color: '#ffffff', transition: 'background-color 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <StatCard
              title="Pending Invoices"
              value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.pendingInvoices?.toString() || '0'}
              icon={Receipt}
              trend={{ value: -1, label: "vs last week" }}
              className="bg-transparent border-0 [&_p]:!text-white/90 [&_h3]:!text-[#ffffff]"
            />
          </div>
          <div 
            className="animated-border"
            style={{ backgroundColor: 'transparent', borderRadius: '8px', border: '1.5px solid #ffffff', color: '#ffffff', transition: 'background-color 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <StatCard
              title="Active Projects"
              value={dashboardLoading ? <Skeleton className="h-6 w-8" /> : metrics?.activeProjects?.toString() || '0'}
              icon={FileText}
              trend={{ value: 3, label: "vs last month" }}
              className="bg-transparent border-0 [&_p]:!text-white/90 [&_h3]:!text-[#ffffff]"
            />
          </div>
        </div>

        {/* Quick Upload Section */}
        <Card 
          className="animated-border mt-6 sm:mt-8"
          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', transition: 'background-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <CardHeader style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
            <CardTitle className="flex items-center text-lg sm:text-xl" style={{ color: '#ffffff' }}>
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Quick Upload
            </CardTitle>
            <CardDescription className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Upload content and data to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent style={{ paddingTop: '1rem', paddingBottom: '1.5rem' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {uploadOptions.map((option) => (
                <Button
                  key={option.title}
                  variant="outline"
                  className="animated-inner-box h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 transition-colors"
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: '#ffffff',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
                    e.currentTarget.style.borderColor = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#ffffff';
                  }}
                  onClick={option.action}
                >
                  <option.icon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#ffffff' }} />
                  <div className="text-center">
                    <div className="font-medium text-sm sm:text-base" style={{ color: '#ffffff' }}>{option.title}</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Modules */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center" style={{ color: '#ffffff' }}>All Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {modules.map((module) => (
              <Card 
                key={module.title} 
                className="animated-border cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col"
                style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', transition: 'background-color 0.3s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => handleModuleClick(module.path)}
              >
                <CardHeader className="pb-3" style={{ paddingTop: '1.5rem' }}>
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`p-2 rounded-lg ${module.color} shrink-0`}>
                      <module.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg truncate" style={{ color: '#ffffff' }}>{module.title}</CardTitle>
                        {module.showWIP && (
                          <WorkInProgress size="sm" />
                        )}
                      </div>
                      <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0" style={{ paddingBottom: '1.5rem' }}>
                  <Button 
                    className="animated-inner-box w-full text-sm" 
                    variant="outline"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      borderColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
                      e.currentTarget.style.borderColor = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#ffffff';
                    }}
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
        <Card 
          className="animated-border mt-6 sm:mt-8"
          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', transition: 'background-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <CardHeader style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
            <CardTitle className="text-lg sm:text-xl" style={{ color: '#ffffff' }}>Recent Activity</CardTitle>
            <CardDescription className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent style={{ paddingTop: '1rem', paddingBottom: '1.5rem' }}>
            <div className="space-y-3 sm:space-y-4">
              <div 
                className="animated-inner-box flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg transition-colors" 
                style={{ borderColor: '#ffffff', borderWidth: '1.5px', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="p-1.5 sm:p-2 rounded-full shrink-0" style={{ backgroundColor: '#0a0119' }}>
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#ffffff' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#ffffff' }}>New estimate created</p>
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Wedding photography for Kumar family</p>
                </div>
                <span className="text-xs shrink-0 ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>2h ago</span>
              </div>
              
              <div 
                className="animated-inner-box flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg transition-colors" 
                style={{ borderColor: '#ffffff', borderWidth: '1.5px', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="p-1.5 sm:p-2 rounded-full shrink-0" style={{ backgroundColor: '#0a0119' }}>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#ffffff' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#ffffff' }}>Event scheduled</p>
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Pre-wedding shoot on May 25th</p>
                </div>
                <span className="text-xs shrink-0 ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>1d ago</span>
              </div>
              
              <div 
                className="animated-inner-box flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg transition-colors" 
                style={{ borderColor: '#ffffff', borderWidth: '1.5px', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="p-1.5 sm:p-2 rounded-full shrink-0" style={{ backgroundColor: '#0a0119' }}>
                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#ffffff' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#ffffff' }}>Invoice payment received</p>
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>₹50,000 from Sharma Wedding</p>
                </div>
                <span className="text-xs shrink-0 ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>3d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Feature Card */}
        <Card 
          className="animated-border mt-6 sm:mt-8"
          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: '1.5px', transition: 'background-color 0.3s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl" style={{ color: '#ffffff' }}>AI Media Tagger</CardTitle>
            <CardDescription className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
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
      </div>
      <EnrollPhotographerModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
      />
    </Layout>
  );
}

export default memo(Dashboard);