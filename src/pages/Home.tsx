import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { HeroSectionDome } from "@/components/home/HeroSectionDome";
import { AboutSection } from "@/components/home/AboutSection";
import { WhyChooseUsSection } from "@/components/home/WhyChooseUsSection";
import { GetStartedSection } from "@/components/home/GetStartedSection";
import { Button } from "@/components/ui/button";
import { Camera, Briefcase, Users, ShieldCheck, Globe, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PillNav from "@/components/ui/pill-nav";
import { WorkInProgress } from "@/components/ui/WorkInProgress";

export default function Home() {
  const { user, loading, toggleBypassAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBypassOptions, setShowBypassOptions] = useState(false);
  const [bypassRole, setBypassRole] = useState("manager");

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting to dashboard:', user.email);
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while auth state is being determined
  if (loading) {
    return <LoadingSpinner text="Loading..." />;
  }

  // If user is authenticated, show redirecting message
  if (user) {
    return <LoadingSpinner text="Redirecting to dashboard..." />;
  }
  
  // Toggle bypass options with a secret key combination (triple-click on the logo)
  const handleLogoClick = () => {
    setShowBypassOptions(!showBypassOptions);
  };
  
  const handleBypassAuth = () => {
    toggleBypassAuth(bypassRole);
    navigate('/dashboard');
  };

  const handlePhotographersPortal = () => {
    toggleBypassAuth('manager'); // Using manager role for bypass
    navigate('/dashboard');
  };

  // Show the home page for non-authenticated users
  return (
    <div className="min-h-screen">
      {/* Quick access navigation for non-authenticated users */}
      <div className="bg-cream border-b border-gray-200 relative overflow-hidden shadow-sm">
        {/* Subtle geometric background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-rose-50/50 blur-2xl" />
        <div className="relative z-10">
          <div className="container mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
            {/* Mobile Layout - Stacked vertically on very small screens */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 xs:gap-3 sm:gap-4 relative">
              {/* Top Row - Logo and Action Buttons (Mobile) */}
              <div className="flex items-center justify-between gap-2 xs:gap-3 w-full md:w-auto">
                {/* Logo - Always visible, centered on mobile */}
                <div className="flex-1 md:flex-none flex justify-center md:justify-start">
                  <button 
                    onClick={handleLogoClick}
                    className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-velvet-dark hover:text-velvet-muted transition-colors"
                  >
                    <img 
                      src="/photosyncwork-logo.svg" 
                      alt="StudioSyncWork Logo" 
                      className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 object-contain flex-shrink-0"
                    />
                    <span className="inline whitespace-nowrap">StudioSyncWork</span>
                  </button>
                </div>
                
                {/* Right side buttons - Mobile */}
                <div className="flex items-center gap-3 xs:gap-3.5 sm:gap-3 flex-shrink-0 md:hidden min-w-[200px] xs:min-w-[220px]">
                  {/* Work in Progress - Icon only on mobile */}
                  <div className="flex-shrink-0">
                    <WorkInProgress size="sm" showText={false} className="text-xs" />
                  </div>
                  
                  {/* Login and Get Started buttons - Compact on mobile */}
                  <div className="flex items-center gap-2.5 xs:gap-3 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/auth')}
                      className="text-velvet-dark hover:text-velvet-muted hover:bg-gray-100 font-semibold text-[10px] xs:text-xs h-7 xs:h-8 px-3 xs:px-3.5"
                    >
                      <span className="hidden xs:inline">Log In</span>
                      <span className="xs:hidden">Log In</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/auth')}
                      className="bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white border-0 text-[10px] xs:text-xs h-7 xs:h-8 px-3 xs:px-3.5 shadow-md hover:shadow-lg"
                    >
                      <span className="hidden xs:inline">Start</span>
                      <span className="xs:hidden">Go</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Mid-section - Three Portal Buttons */}
              {/* Desktop: Horizontal layout, Mobile: Show only Photographers Portal button */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 md:flex-1 w-full md:w-auto">
                {/* Client Portal - Hidden on mobile, shown on desktop */}
                <Button 
                  onClick={() => navigate('/client-portal')}
                  variant="outline" 
                  disabled
                  className="hidden md:flex group h-9 lg:h-10 px-3 lg:px-4 py-2 border-2 text-xs lg:text-sm transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-md hover:bg-white hover:shadow-lg"
                  style={{ 
                    borderColor: 'hsl(var(--dusty-blue))', 
                    color: 'hsl(var(--dusty-blue-dark))'
                  }}
                >
                  <div className="flex items-center justify-center w-full relative">
                    <Globe className="h-3 w-3 lg:h-4 lg:w-4 absolute left-0 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <span className="font-medium font-playfair whitespace-nowrap group-hover:ml-5 lg:group-hover:ml-6">Client Portal</span>
                  </div>
                </Button>

                {/* Photographers Portal - Always visible, auto width */}
                <Button 
                  onClick={handlePhotographersPortal}
                  variant="outline" 
                  className="group w-auto max-w-[50%] sm:max-w-none h-9 sm:h-9 lg:h-10 px-3 sm:px-3 lg:px-4 py-2 border-2 text-xs sm:text-xs lg:text-sm transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-md hover:bg-white hover:shadow-lg"
                  style={{ 
                    borderColor: 'hsl(var(--dusty-blue))', 
                    color: 'hsl(var(--dusty-blue-dark))'
                  }}
                >
                  <div className="flex items-center justify-center w-full relative">
                    <Users className="h-3 w-3 sm:h-3 lg:h-4 lg:w-4 absolute left-0 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <span className="font-medium font-playfair whitespace-nowrap group-hover:ml-5 lg:group-hover:ml-6 text-center">Photographers Portal</span>
                  </div>
                </Button>

                {/* Hire a Teammate - Hidden on mobile, shown on desktop */}
                <Button 
                  onClick={() => navigate('/hire')}
                  variant="outline" 
                  disabled
                  className="hidden md:flex group h-9 lg:h-10 px-3 lg:px-4 py-2 border-2 text-xs lg:text-sm transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-md hover:bg-white hover:shadow-lg"
                  style={{ 
                    borderColor: 'hsl(var(--dusty-blue))', 
                    color: 'hsl(var(--dusty-blue-dark))'
                  }}
                >
                  <div className="flex items-center justify-center w-full relative">
                    <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 absolute left-0 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <span className="font-medium font-playfair whitespace-nowrap group-hover:ml-5 lg:group-hover:ml-6">Hire a Teammate</span>
                  </div>
                </Button>
              </div>
              
              {/* Right side - Work in Progress + Login/Get Started buttons (Desktop) */}
              <div className="hidden md:flex items-center justify-end gap-2 lg:gap-3 flex-shrink-0">
                {/* Work in Progress Indicator */}
                <div className="flex-shrink-0">
                  <WorkInProgress size="sm" showText={true} text="Dev-Work In Progress" className="text-xs" />
                </div>
                
                {/* Login and Get Started buttons */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/auth')}
                    className="text-velvet-dark hover:text-velvet-muted hover:bg-gray-100 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white border-0 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 shadow-md hover:shadow-lg"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="cursor-pointer"
        onClick={handleLogoClick}
      >
        <HeroSectionDome />
      </div>
      <AboutSection />
      <WhyChooseUsSection />
      <GetStartedSection />
    </div>
  );
}