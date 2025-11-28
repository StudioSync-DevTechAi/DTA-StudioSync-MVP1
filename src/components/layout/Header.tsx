import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle, LogOut, Menu, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkInProgress } from "@/components/ui/WorkInProgress";

export function Header() {
  const { user, signOut } = useAuth();
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
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo with increased left margin on mobile */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 text-2xl font-bold text-dustyBlue-dark hover:text-dustyBlue transition-colors ml-12 lg:ml-0"
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
                      className="shrink-0"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <User className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/settings')}>
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
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
                    >
                      Login
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/auth')}
                      className="bg-dustyBlue hover:bg-dustyBlue-dark text-white"
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