import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/hooks/rbac/useRBAC";
import { UserCircle, LogOut, Menu, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { WorkInProgress } from "@/components/ui/WorkInProgress";

export function Header() {
  const { user, signOut } = useAuth();
  const { hasRole } = useRBAC();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the client portal
  const isClientPortal = location.pathname === '/client-portal';
  
  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleLogoClick = () => {
    if (isClientPortal) {
      // For client portal, go to home page
      navigate('/');
    } else if (user) {
      // For authenticated users, go to dashboard
      navigate('/dashboard');
    } else {
      // For non-authenticated users, go to home
      navigate('/');
    }
  };

  return (
    <header 
      className="border-b shadow-sm fixed top-0 left-0 right-0 z-50"
      style={{
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
    >
      <div className="container mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 relative z-10">
        <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 relative">
          {/* Left side - Logo on desktop, empty on mobile/tablet */}
          <div className="flex items-center justify-start flex-shrink-0">
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 text-lg xs:text-xl sm:text-2xl font-bold text-white hover:text-gray-200 transition-colors hidden md:flex"
            >
              <img 
                src="/photosyncwork-logo.svg" 
                alt="StudioSyncWork Logo" 
                className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 object-contain flex-shrink-0"
              />
              <span className="hidden xs:inline whitespace-nowrap">StudioSyncWork</span>
            </button>
          </div>
          
          {/* Center - Logo on mobile/tablet */}
          <div className="flex-1 flex justify-center items-center absolute left-0 right-0 md:hidden pointer-events-none">
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 text-lg xs:text-xl sm:text-2xl font-bold text-white hover:text-gray-200 transition-colors pointer-events-auto"
            >
              <img 
                src="/photosyncwork-logo.svg" 
                alt="StudioSyncWork Logo" 
                className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 object-contain flex-shrink-0"
              />
              <span className="hidden xs:inline whitespace-nowrap">StudioSyncWork</span>
            </button>
          </div>
          
          {/* Right side - Work in Progress + User menu */}
          <div className="flex items-center justify-end gap-2 xs:gap-3 sm:gap-4 flex-shrink-0 ml-auto">
            {/* Work in Progress Indicator */}
            <div className="hidden sm:block flex-shrink-0">
              <WorkInProgress size="sm" showText={true} text="Dev-Work In Progress" className="text-xs" />
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 flex-shrink-0">
            {!isClientPortal && (
              <>
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate("/settings")}
                      className="shrink-0 text-white hover:text-gray-200 hover:bg-white/10 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10"
                    >
                      <Settings className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:text-gray-200 hover:bg-white/10 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10">
                          <User className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-48 xs:w-52 sm:w-56 bg-white/10 backdrop-blur-sm border-white/20"
                      >
                        <DropdownMenuLabel className="px-2 py-2">
                          <div className="font-medium truncate text-sm text-white">
                            {user.user_metadata?.full_name || user.email}
                          </div>
                          <div className="text-xs text-white/70 mt-0.5">
                            {hasRole('manager') ? 'Manager' : 
                             hasRole('photographer') ? 'Photographer' :
                             hasRole('videographer') ? 'Videographer' :
                             hasRole('editor') ? 'Editor' :
                             hasRole('accounts') ? 'Accounts' :
                             hasRole('crm') ? 'CRM' : 'User'}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/20" />
                        <DropdownMenuItem 
                          onClick={() => navigate('/dashboard')}
                          className="text-white focus:text-white focus:bg-white/10"
                        >
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/profile')}
                          className="text-white focus:text-white focus:bg-white/10"
                        >
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/settings')}
                          className="text-white focus:text-white focus:bg-white/10"
                        >
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/20" />
                        <DropdownMenuItem 
                          onClick={handleLogout} 
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/20"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/auth')}
                      className="text-white hover:text-gray-200 hover:bg-white/10 text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                    >
                      <span className="hidden xs:inline">Login</span>
                      <span className="xs:hidden">Log</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/auth')}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                    >
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Start</span>
                    </Button>
                  </>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}