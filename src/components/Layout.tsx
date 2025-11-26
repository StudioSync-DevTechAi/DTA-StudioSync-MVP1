import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FileText,
  Receipt,
  LineChart,
  Home,
  Menu,
  X,
  Calendar,
  Camera,
  Film,
  FileCheck,
  LogOut,
  User,
  ArrowLeft,
  Shield,
  FolderKanban,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { WorkInProgress } from "./ui/WorkInProgress";
import { useUser } from "@/contexts/UserContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/rbac/useRBAC";
import { PERMISSIONS } from "@/types/rbac";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

// Define navigation items with access control
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home, permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: "/estimates", label: "Estimates", icon: FileText, permission: PERMISSIONS.ESTIMATES_VIEW },
  { path: "/invoices", label: "Invoices", icon: Receipt, permission: PERMISSIONS.INVOICES_VIEW },
  { path: "/finances", label: "Finances", icon: LineChart, permission: PERMISSIONS.FINANCES_VIEW },
  { path: "/workflow", label: "Workflow", icon: Calendar, permission: PERMISSIONS.WORKFLOW_VIEW },
  { path: "/portfolio", label: "Portfolio", icon: Camera, permission: PERMISSIONS.PORTFOLIO_VIEW },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEstimatesExpanded, setIsEstimatesExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();
  const { hasPermission } = useRBAC();
  
  // Auto-expand Estimates if on estimates-related pages
  useEffect(() => {
    if (location.pathname.startsWith("/estimates")) {
      setIsEstimatesExpanded(true);
    }
  }, [location.pathname]);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  // If user not authenticated, don't render the layout
  if (!user) {
    return null;
  }
  
  // Handle logout
  const handleLogout = () => {
    signOut();
    navigate("/auth");
  };
  
  // Determine if we're on a page that should have a back to dashboard button
  const showBackToDashboard = location.pathname !== "/dashboard" && !location.pathname.startsWith("/auth");
  
  // Filter navigation items based on user permissions
  const filteredNavItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation - Always on the left */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r transition-transform duration-300 ease-in-out z-40",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="flex flex-col h-full p-4">
          <div className="space-y-2 py-4">
            <div className="flex items-center space-x-3 px-2">
              <img 
                src="/photosyncwork-logo.svg" 
                alt="StudioSyncWork Logo" 
                className="h-8 w-8 object-contain flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <h1 className="text-xl font-semibold truncate">StudioSyncWork</h1>
                </button>
                <WorkInProgress size="sm" className="mt-1" />
              </div>
            </div>
          </div>
          
          <div className="space-y-1 py-2 flex-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isEstimates = item.path === "/estimates";
              
              // Special handling for Estimates with sub-menu
              if (isEstimates) {
                return (
                  <PermissionGuard key={item.path} permission={item.permission}>
                    <div className="space-y-1">
                      {/* Estimates Main Item */}
                      <button
                        onClick={() => {
                          setIsEstimatesExpanded(!isEstimatesExpanded);
                          navigate("/estimates");
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg transition-colors w-full text-left",
                          location.pathname === "/estimates"
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50 text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isEstimatesExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                      
                      {/* View Projects Sub-item */}
                      {isEstimatesExpanded && (
                        <Link
                          to="/estimates/projects"
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ml-6",
                            location.pathname === "/estimates/projects" || location.pathname.startsWith("/estimates/projects/")
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50 text-muted-foreground"
                          )}
                        >
                          <FolderKanban className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">View Projects</span>
                        </Link>
                      )}
                    </div>
                  </PermissionGuard>
                );
              }
              
              // Regular nav items
              return (
                <PermissionGuard key={item.path} permission={item.permission}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                      location.pathname === item.path
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </PermissionGuard>
              );
            })}
            
            {/* Role Management - Only for managers */}
            <PermissionGuard role="manager">
              <Link
                to="/admin/roles"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  location.pathname === "/admin/roles"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-muted-foreground"
                )}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Role Management</span>
              </Link>
            </PermissionGuard>
          </div>
          
          <div className="mt-auto border-t pt-4">
            <div className="px-2 py-2 mb-2">
              <div className="font-medium truncate">{user.user_metadata?.full_name || user.email}</div>
              <div className="text-xs text-muted-foreground">
                {hasRole('manager') ? 'Manager' : 
                 hasRole('photographer') ? 'Photographer' :
                 hasRole('videographer') ? 'Videographer' :
                 hasRole('editor') ? 'Editor' :
                 hasRole('accounts') ? 'Accounts' :
                 hasRole('crm') ? 'CRM' : 'User'}
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </Button>
          </div>
        </nav>
      </aside>

      {/* Mobile Menu Button - Fixed position at top left */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background border-gray-200 hover:bg-gray-100 hover:text-gray-900"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Top bar for mobile navigation (only visible on mobile) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-30 flex items-center px-4">
        <div className="flex-1 flex items-center">
          {/* Add sufficient margin-left to accommodate the menu button */}
          <div className="ml-20 flex items-center">
            {showBackToDashboard && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:text-gray-900" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src="/photosyncwork-logo.svg" 
                alt="StudioSyncWork Logo" 
                className="h-6 w-6 object-contain flex-shrink-0"
              />
              <h1 className="text-xl font-semibold truncate">StudioSyncWork</h1>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        "lg:ml-64 p-4 lg:p-6", 
        "lg:pt-6 pt-20" // Add top padding on mobile for the header
      )}>
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}