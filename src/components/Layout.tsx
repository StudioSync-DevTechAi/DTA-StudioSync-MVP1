import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
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
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/rbac/useRBAC";
import { PERMISSIONS } from "@/types/rbac";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define navigation items with access control
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home, permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: "/estimates", label: "Estimates", icon: FileText, permission: PERMISSIONS.ESTIMATES_VIEW },
  { path: "/estimates/projects", label: "Projects", icon: FolderKanban, permission: PERMISSIONS.ESTIMATES_VIEW },
  { path: "/invoices", label: "Invoices", icon: Receipt, permission: PERMISSIONS.INVOICES_VIEW },
  { path: "/finances", label: "Finances", icon: LineChart, permission: PERMISSIONS.FINANCES_VIEW },
  { path: "/workflow", label: "Workflow", icon: Calendar, permission: PERMISSIONS.WORKFLOW_VIEW },
  { path: "/portfolio", label: "Portfolio", icon: Camera, permission: PERMISSIONS.PORTFOLIO_VIEW },
];

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 500;
const SIDEBAR_DEFAULT_WIDTH = 256; // w-64 = 256px
const SIDEBAR_COLLAPSED_WIDTH = 64; // Icon-only width

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : SIDEBAR_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Default collapsed
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const mainContentRef = useRef<HTMLElement>(null);
  const [focusedNavIndex, setFocusedNavIndex] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();
  const { hasPermission } = useRBAC();
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathname = useRef(location.pathname);
  
  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle navigation loading state
  useEffect(() => {
    // If pathname changed, navigation completed
    if (previousPathname.current !== location.pathname) {
      setIsNavigating(false);
      previousPathname.current = location.pathname;
    }
  }, [location.pathname]);
  
  // Handle window resize to update desktop state
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const clampedWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, newWidth));
    setSidebarWidth(clampedWidth);
  }, [isResizing]);
  
  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);
  
  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
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
  
  // Get all navigation items including Role Management
  const allNavItems = [
    ...filteredNavItems.map(item => ({ ...item, path: item.path })),
    ...(hasRole('manager') ? [{ path: '/admin/roles', label: 'Role Management', icon: Shield }] : [])
  ];

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if sidebar is visible (not hidden on mobile)
      const isSidebarVisible = isDesktop || isMobileMenuOpen;
      if (!isSidebarVisible) return;

      const totalItems = allNavItems.length;
      if (totalItems === 0) return;

      // Find which nav item is currently focused
      const activeNavItem = navRefs.current.findIndex(ref => ref === document.activeElement);
      const isNavFocused = activeNavItem !== -1;
      const isInSidebar = sidebarRef.current?.contains(document.activeElement);
      const isInMainContent = mainContentRef.current?.contains(document.activeElement);

      // Handle Up/Down arrows - work when nav is focused or when in sidebar context
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // Don't handle if user is typing in an input/textarea
        const isInInput = document.activeElement?.tagName === 'INPUT' || 
                         document.activeElement?.tagName === 'TEXTAREA' ||
                         document.activeElement?.getAttribute('contenteditable') === 'true';
        
        if (isInInput) return;

        // Allow navigation if:
        // 1. A nav item is focused, OR
        // 2. We're in sidebar context (but not in main content), OR  
        // 3. Nothing is focused in main content (to allow starting navigation from anywhere)
        const shouldHandle = isNavFocused || 
                            (isInSidebar && !isInMainContent) || 
                            (!isInMainContent);
        
        if (shouldHandle) {
          e.preventDefault();
          e.stopPropagation();
          
          // Determine current index
          let currentIndex: number;
          if (activeNavItem !== -1) {
            currentIndex = activeNavItem;
          } else if (focusedNavIndex !== null && focusedNavIndex >= 0 && focusedNavIndex < totalItems) {
            currentIndex = focusedNavIndex;
          } else {
            // Start from first item if nothing is focused
            currentIndex = -1;
          }

          if (e.key === 'ArrowDown') {
            const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % totalItems;
            setFocusedNavIndex(nextIndex);
            requestAnimationFrame(() => {
              const nextRef = navRefs.current[nextIndex];
              if (nextRef) {
                nextRef.focus({ preventScroll: true });
              }
            });
          } else if (e.key === 'ArrowUp') {
            const prevIndex = currentIndex === -1 
              ? totalItems - 1 
              : (currentIndex - 1 + totalItems) % totalItems;
            setFocusedNavIndex(prevIndex);
            requestAnimationFrame(() => {
              const prevRef = navRefs.current[prevIndex];
              if (prevRef) {
                prevRef.focus({ preventScroll: true });
              }
            });
          }
        }
        return;
      }

      // Handle Left/Right arrows - only when nav is focused
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isNavFocused) {
        e.preventDefault();
        e.stopPropagation();
        // Move focus to main content area
        const firstFocusable = mainContentRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
          setFocusedNavIndex(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [focusedNavIndex, allNavItems.length, hasRole, isDesktop, isMobileMenuOpen]);

  // Reset focused index when route changes
  useEffect(() => {
    setFocusedNavIndex(null);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex" style={{ 
      background: `
        radial-gradient(ellipse at bottom left, rgba(255, 100, 50, 0.08) 0%, rgba(255, 150, 0, 0.04) 20%, transparent 50%),
        linear-gradient(to bottom,
          #2a1f4d 0%,
          #3d2a5f 25%,
          #4a3569 50%,
          #3d2a5f 75%,
          #2a1f4d 100%
        )
      `
    }}>
      {/* Sidebar Navigation - Always on the left */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 bg-card border-r z-40",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          !isResizing && "transition-all duration-300 ease-in-out"
        )}
        style={{ 
          top: 0,
          height: '100vh',
          width: isDesktop && !isMobileMenuOpen 
            ? (isSidebarHovered ? `${sidebarWidth}px` : `${SIDEBAR_COLLAPSED_WIDTH}px`)
            : `${sidebarWidth}px`,
          transition: isResizing ? 'none' : 'width 0.2s ease-in-out, transform 0.3s ease-in-out',
          background: `
            radial-gradient(ellipse at bottom left, rgba(255, 100, 50, 0.15) 0%, rgba(255, 150, 0, 0.08) 20%, transparent 50%),
            linear-gradient(to bottom,
              #1a0f3d 0%,
              #2d1b4e 25%,
              #3d2a5f 50%,
              #2d1b4e 75%,
              #1a0a2e 100%
            )
          `
        }}
        onMouseEnter={() => {
          if (isDesktop && !isMobileMenuOpen) {
            setIsSidebarHovered(true);
            setIsSidebarCollapsed(false);
          }
        }}
        onMouseLeave={() => {
          if (isDesktop && !isMobileMenuOpen) {
            setIsSidebarHovered(false);
            setIsSidebarCollapsed(true);
          }
        }}
      >
        <nav 
          className={cn(
            "flex flex-col h-full relative z-10 transition-all duration-200",
            isSidebarCollapsed && isDesktop && !isMobileMenuOpen ? "p-2" : "p-4",
            "pt-20" // Add top padding to account for header
          )}
          onFocus={() => {
            // When sidebar nav receives focus, start with first item if nothing is focused
            if (focusedNavIndex === null && navRefs.current.length > 0) {
              const firstAvailable = navRefs.current.findIndex(ref => ref !== null);
              if (firstAvailable !== -1) {
                setFocusedNavIndex(firstAvailable);
              }
            }
          }}
        >
          <div className={cn(
            "space-y-1 py-2 flex-1 overflow-y-auto"
          )}>
            {filteredNavItems.map((item, index) => {
              const Icon = item.icon;
              
              // Regular nav items
              return (
                <PermissionGuard key={item.path} permission={item.permission}>
                  <Link
                    ref={(el) => {
                      navRefs.current[index] = el;
                    }}
                    to={item.path}
                    onClick={() => {
                      if (location.pathname !== item.path) {
                        setIsNavigating(true);
                      }
                    }}
                    onFocus={() => setFocusedNavIndex(index)}
                    onBlur={() => {
                      // Only clear if focus is moving outside sidebar
                      setTimeout(() => {
                        if (!sidebarRef.current?.contains(document.activeElement)) {
                          setFocusedNavIndex(null);
                        }
                      }, 0);
                    }}
                    className={cn(
                      "flex items-center rounded-lg transition-colors outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent",
                      isSidebarCollapsed && isDesktop && !isMobileMenuOpen 
                        ? "justify-center px-2 py-2" 
                        : "gap-3 px-3 py-2 text-sm",
                      location.pathname === item.path || (item.path === "/estimates/projects" && location.pathname.startsWith("/estimates/projects"))
                        ? "bg-white/20 text-white font-medium"
                        : "hover:bg-white/10 text-white/90 hover:text-white"
                    )}
                    title={isSidebarCollapsed && isDesktop && !isMobileMenuOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-current" />
                    <span className={cn(
                      "truncate transition-all duration-200",
                      isSidebarCollapsed && isDesktop && !isMobileMenuOpen 
                        ? "opacity-0 w-0 overflow-hidden" 
                        : "opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                </PermissionGuard>
              );
            })}
            
            {/* Role Management - Only for managers */}
            {hasRole('manager') && (
              <Link
                ref={(el) => {
                  const roleIndex = filteredNavItems.length;
                  navRefs.current[roleIndex] = el;
                }}
                to="/admin/roles"
                onClick={() => {
                  if (location.pathname !== "/admin/roles") {
                    setIsNavigating(true);
                  }
                }}
                onFocus={() => setFocusedNavIndex(filteredNavItems.length)}
                onBlur={() => {
                  setTimeout(() => {
                    if (!sidebarRef.current?.contains(document.activeElement)) {
                      setFocusedNavIndex(null);
                    }
                  }, 0);
                }}
                className={cn(
                  "flex items-center rounded-lg transition-colors outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent",
                  isSidebarCollapsed && isDesktop && !isMobileMenuOpen 
                    ? "justify-center px-2 py-2" 
                    : "gap-3 px-3 py-2 text-sm",
                  location.pathname === "/admin/roles"
                    ? "bg-white/20 text-white font-medium"
                    : "hover:bg-white/10 text-white/90 hover:text-white"
                )}
                title={isSidebarCollapsed && isDesktop && !isMobileMenuOpen ? "Role Management" : undefined}
              >
                <Shield className="h-5 w-5 flex-shrink-0 text-current" />
                <span className={cn(
                  "truncate transition-all duration-200",
                  isSidebarCollapsed && isDesktop && !isMobileMenuOpen 
                    ? "opacity-0 w-0 overflow-hidden" 
                    : "opacity-100"
                )}>
                  Role Management
                </span>
              </Link>
            )}
          </div>
        </nav>
        
        {/* Resize Handle - Only show when expanded */}
        {(!isSidebarCollapsed || isMobileMenuOpen) && (
          <div
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors z-50",
              "lg:block hidden",
              "hover:w-1.5 hover:bg-primary/30",
              isResizing && "bg-primary w-1.5"
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            style={{
              touchAction: 'none'
            }}
            title="Drag to resize sidebar"
          >
            <div className="absolute inset-y-0 -right-1 w-3" />
          </div>
        )}
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
      <main 
        ref={mainContentRef}
        tabIndex={-1}
        className={cn(
          "flex-1 min-h-screen relative",
          "px-4 lg:px-6 pb-4 lg:pb-6"
        )}
        style={{ 
          marginLeft: isDesktop && !isMobileMenuOpen
            ? (isSidebarHovered ? `${sidebarWidth}px` : `${SIDEBAR_COLLAPSED_WIDTH}px`)
            : isDesktop ? `${sidebarWidth}px` : '0',
          transition: isResizing ? 'none' : 'margin-left 0.2s ease-in-out',
          background: `
            radial-gradient(ellipse at bottom left, rgba(255, 100, 50, 0.08) 0%, rgba(255, 150, 0, 0.04) 20%, transparent 50%),
            linear-gradient(to bottom,
              #2a1f4d 0%,
              #3d2a5f 25%,
              #4a3569 50%,
              #3d2a5f 75%,
              #2a1f4d 100%
            )
          `
        }}
      >
        {/* Navigation Loading Overlay */}
        {isNavigating && (
          <div 
            className="fixed z-50 flex items-center justify-center"
            style={{
              top: 0,
              left: isDesktop && !isMobileMenuOpen
                ? (isSidebarHovered ? `${sidebarWidth}px` : `${SIDEBAR_COLLAPSED_WIDTH}px`)
                : isDesktop ? `${sidebarWidth}px` : '0',
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(26, 15, 61, 0.98)',
              backdropFilter: 'blur(10px)',
              transition: isResizing ? 'none' : 'left 0.2s ease-in-out',
            }}
          >
            <LoadingSpinner text="Loading..." fullScreen={false} />
          </div>
        )}
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}