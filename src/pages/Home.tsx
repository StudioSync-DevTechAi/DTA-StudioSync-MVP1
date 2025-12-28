import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { HeroSectionDome } from "@/components/home/HeroSectionDome";
import { AboutSection } from "@/components/home/AboutSection";
import { WhyChooseUsSection } from "@/components/home/WhyChooseUsSection";
import { GetStartedSection } from "@/components/home/GetStartedSection";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Camera, Briefcase, Users, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PillNav from "@/components/ui/pill-nav";

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

  // Show the home page for non-authenticated users
  return (
    <div className="min-h-screen">
      {/* Quick access navigation for non-authenticated users */}
      <div className="bg-[#030303] border-b border-white/10 relative overflow-hidden">
        {/* Subtle geometric background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03] blur-2xl" />
        <div className="relative z-10">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <PillNav
                items={[
                  { 
                    label: 'Portfolio', 
                    href: '/portfolio',
                    icon: <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                  },
                  { 
                    label: 'Browse Talent', 
                    href: '/hire',
                    icon: <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  },
                  { 
                    label: 'For Photographers', 
                    href: '/photographers',
                    icon: <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  }
                ]}
                activeHref={location.pathname}
                className="flex-1"
                ease="power2.easeOut"
                baseColor="rgba(255, 255, 255, 0.1)"
                pillColor="rgba(255, 255, 255, 0.1)"
                hoveredPillTextColor="#ffffff"
                pillTextColor="rgba(255, 255, 255, 0.8)"
                initialLoadAnimation={true}
              />
            
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                {/* Bypass Auth Section (Hidden by default) */}
                {showBypassOptions && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-md backdrop-blur-sm">
                    <ShieldCheck className="h-4 w-4 text-yellow-400 hidden sm:block" />
                    <Select value={bypassRole} onValueChange={setBypassRole}>
                      <SelectTrigger className="h-8 w-full sm:w-40 text-xs bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#030303] border-white/10">
                        <SelectItem value="manager" className="text-white hover:bg-white/10">Manager</SelectItem>
                        <SelectItem value="accounts" className="text-white hover:bg-white/10">Accounts</SelectItem>
                        <SelectItem value="crm" className="text-white hover:bg-white/10">CRM</SelectItem>
                        <SelectItem value="photographer" className="text-white hover:bg-white/10">Photographer</SelectItem>
                        <SelectItem value="videographer" className="text-white hover:bg-white/10">Videographer</SelectItem>
                        <SelectItem value="editor" className="text-white hover:bg-white/10">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleBypassAuth} 
                      variant="outline" 
                      size="sm"
                      className="h-8 bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 w-full sm:w-auto"
                    >
                      Bypass
                    </Button>
                  </div>
                )}
                
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-indigo-500/80 to-rose-500/80 hover:from-indigo-500 hover:to-rose-500 text-white w-full sm:w-auto text-xs sm:text-sm border-0 shadow-lg shadow-indigo-500/20"
                >
                  Sign In
                </Button>
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
      <Footer />
    </div>
  );
}