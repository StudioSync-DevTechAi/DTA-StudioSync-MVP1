import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { WhyChooseUsSection } from "@/components/home/WhyChooseUsSection";
import { GetStartedSection } from "@/components/home/GetStartedSection";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Camera, Briefcase, Users, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Home() {
  const { user, loading, toggleBypassAuth } = useAuth();
  const navigate = useNavigate();
  const [showBypassOptions, setShowBypassOptions] = useState(false);
  const [bypassRole, setBypassRole] = useState("manager");

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting to dashboard:', user.email);
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

  // Show the home page for non-authenticated users
  return (
    <div className="min-h-screen bg-warmWhite">
      {/* Quick access navigation for non-authenticated users */}
      <div className="bg-dustyBlue-whisper border-b">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/portfolio')}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Portfolio</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/hire')}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Browse Talent</span>
                <span className="sm:hidden">Talent</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/photographers')}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">For Photographers</span>
                <span className="md:hidden">Photographers</span>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
              {/* Bypass Auth Section (Hidden by default) */}
              {showBypassOptions && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-yellow-50 border border-yellow-300 rounded-md">
                  <ShieldCheck className="h-4 w-4 text-yellow-600 hidden sm:block" />
                  <Select value={bypassRole} onValueChange={setBypassRole}>
                    <SelectTrigger className="h-8 w-full sm:w-40 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="accounts">Accounts</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="photographer">Photographer</SelectItem>
                      <SelectItem value="videographer">Videographer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleBypassAuth} 
                    variant="outline" 
                    size="sm"
                    className="h-8 bg-yellow-100 border-yellow-300 text-yellow-800 w-full sm:w-auto"
                  >
                    Bypass
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-dustyBlue hover:bg-dustyBlue-dark text-white w-full sm:w-auto text-xs sm:text-sm"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="cursor-pointer"
        onClick={handleLogoClick}
      >
        <HeroSection />
      </div>
      <AboutSection />
      <WhyChooseUsSection />
      <GetStartedSection />
      <Footer />
    </div>
  );
}