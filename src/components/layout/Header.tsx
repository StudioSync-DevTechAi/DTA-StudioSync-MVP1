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
      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo with increased left margin on mobile */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 text-2xl font-bold text-white hover:text-gray-200 transition-colors ml-12 lg:ml-0"
          >
            <img 
              src="/photosyncwork-logo.svg" 
              alt="StudioSyncWork Logo" 
              className="h-8 w-8 object-contain"
            />
            <span>StudioSyncWork</span>
          </button>
          
          {/* Work in Progress Indicator */}
          <WorkInProgress size="sm" showText={true} text="Dev-Work In Progress" className="text-xs" />
          
          <div className="flex items-center space-x-2">
            {!isClientPortal && (
              <>
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate("/settings")}
                      className="shrink-0 text-white hover:text-gray-200 hover:bg-white/10"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:text-gray-200 hover:bg-white/10">
                          <User className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-56 bg-white/10 backdrop-blur-sm border-white/20"
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
                      className="text-white hover:text-gray-200 hover:bg-white/10"
                    >
                      Login
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/auth')}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}