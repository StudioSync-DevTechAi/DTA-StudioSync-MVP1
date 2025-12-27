import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserCog, 
  Camera, 
  Video, 
  Edit, 
  DollarSign, 
  Users,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import { useBypassAuth } from "@/contexts/BypassAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const roles = [
  {
    id: "manager",
    name: "Manager",
    description: "Manage projects, team, and overall operations",
    icon: UserCog,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600"
  },
  {
    id: "photographer",
    name: "Photographer",
    description: "Capture and manage photography projects",
    icon: Camera,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600"
  },
  {
    id: "videographer",
    name: "Videographer",
    description: "Handle video production and editing",
    icon: Video,
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600"
  },
  {
    id: "editor",
    name: "Editor",
    description: "Edit and process media content",
    icon: Edit,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600"
  },
  {
    id: "accounts",
    name: "Accounts",
    description: "Manage finances and accounting",
    icon: DollarSign,
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600"
  },
  {
    id: "crm",
    name: "CRM",
    description: "Manage customer relationships",
    icon: Users,
    color: "bg-indigo-500",
    hoverColor: "hover:bg-indigo-600"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { setMockRole, toggleBypass, bypassEnabled } = useBypassAuth();
  const { signInWithEmail, signInWithGoogle, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Note: We don't auto-redirect authenticated users here
  // The landing page should always be accessible for role selection
  // Users will be redirected to dashboard only after they select a role and login

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setAuthError(null);
    setEmail("");
    setPassword("");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setAuthError("Please select a role first");
      return;
    }

    if (!email || !password) {
      setAuthError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      // For now, we'll use bypass auth to set the role and redirect
      // In production, you'd verify the user's actual role from the database
      setMockRole(selectedRole);
      
      // Enable bypass auth if not already enabled
      if (!bypassEnabled) {
        toggleBypass();
      }

      // Attempt email login (optional - for production)
      const result = await signInWithEmail(email, password);
      
      if (result.error) {
        // If login fails, still allow bypass for testing
        console.log("Login failed, using bypass auth for testing");
      }

      toast({
        title: "Login Successful",
        description: `Welcome, ${roles.find(r => r.id === selectedRole)?.name}!`,
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (roleId: string) => {
    setSelectedRole(roleId);
    setLoading(true);
    setAuthError(null);

    try {
      // Set the role before Google auth
      setMockRole(roleId);
      
      // Enable bypass auth if not already enabled
      if (!bypassEnabled) {
        toggleBypass();
      }

      // Attempt Google login
      await signInWithGoogle();
      
      // Note: Google OAuth will redirect, so we don't navigate here
    } catch (error: any) {
      console.error("Google login error:", error);
      setAuthError(error.message || "Google login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleId: string) => {
    // Quick login using bypass auth (for testing/demo)
    setMockRole(roleId);
    
    if (!bypassEnabled) {
      toggleBypass();
    }

    toast({
      title: "Quick Login",
      description: `Logged in as ${roles.find(r => r.id === roleId)?.name}`,
    });

    navigate("/dashboard");
  };

  return (
    <div 
      className="min-h-screen px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6"
      style={{ 
        minHeight: '100vh', 
        color: '#ffffff',
        position: 'relative'
      }}
    >
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
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to StudioSync
          </h1>
          <p className="text-lg md:text-xl text-gray-200">
            Select your role and sign in to continue
          </p>
        </div>

        {/* Role Selection Tabs */}
        <Tabs defaultValue={roles[0].id} className="w-full max-w-6xl mx-auto">
          <TabsList className="animated-border !grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-12 md:mb-16 gap-3 md:gap-4 p-3 bg-transparent border-2 rounded-lg !h-auto !inline-grid" style={{ borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: '2px', borderStyle: 'solid', boxSizing: 'border-box' }}>
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <TabsTrigger 
                  key={role.id} 
                  value={role.id}
                  className="animated-inner-box !flex flex-col items-center justify-center gap-2 p-3 md:p-4 text-white rounded-lg border-2 transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:scale-[1.02] data-[state=active]:bg-white/30 data-[state=active]:border-white/60 data-[state=active]:text-white data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.4),0_0_20px_rgba(59,130,246,0.3)] !h-full w-full box-border"
                  onClick={() => handleRoleSelect(role.id)}
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                  }}
                >
                  <IconComponent className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs md:text-sm font-medium">{role.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Login Sections for Each Role */}
          {roles.map((role) => {
            const IconComponent = role.icon;
            
            return (
              <TabsContent key={role.id} value={role.id} className="mt-0">
                <Card className="max-w-md mx-auto rounded-lg bg-card text-card-foreground shadow-sm relative border-2 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
                  <CardHeader className="text-center pt-6 pb-4">
                    <div className={`${role.color} p-4 rounded-full w-fit mx-auto mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>{role.name} Login</CardTitle>
                    <CardDescription className="text-gray-200">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4" style={{ backgroundColor: 'transparent' }}>
                    {/* Error Message */}
                    {authError && selectedRole === role.id && (
                      <div className="p-3 bg-red-900/50 border border-red-400 rounded-md text-red-200 text-sm">
                        {authError}
                      </div>
                    )}

                    {/* Email/Password Login Form */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setSelectedRole(role.id);
                      handleEmailLogin(e);
                    }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${role.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Email</Label>
                        <Input
                          id={`email-${role.id}`}
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setSelectedRole(role.id);
                          }}
                          disabled={loading}
                          required
                          className="bg-background text-white"
                          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`password-${role.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Password</Label>
                        <div className="relative">
                          <Input
                            id={`password-${role.id}`}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setSelectedRole(role.id);
                            }}
                            disabled={loading}
                            required
                            className="bg-background text-white"
                            style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className={`w-full ${role.color} ${role.hoverColor} text-white`}
                        disabled={loading}
                      >
                        {loading ? (
                          "Signing in..."
                        ) : (
                          <>
                            Continue as {role.name}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/30"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-2 text-white/70" style={{ backgroundColor: 'transparent' }}>
                          Or
                        </span>
                      </div>
                    </div>

                    {/* Google Login */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white"
                      onClick={() => handleGoogleLogin(role.id)}
                      disabled={loading}
                      style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>

                    {/* Quick Login Button (for testing) */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-white hover:text-gray-200"
                      onClick={() => handleQuickLogin(role.id)}
                      disabled={loading}
                    >
                      Quick Login (Demo)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
      </div>
    </div>
  );
}

