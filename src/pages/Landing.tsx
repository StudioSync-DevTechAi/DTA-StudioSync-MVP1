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
  EyeOff,
  Phone,
  Mail,
  KeyRound,
  MessageSquare
} from "lucide-react";
import { useBypassAuth } from "@/contexts/BypassAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Note: We don't auto-redirect authenticated users here
  // The landing page should always be accessible for role selection
  // Users will be redirected to dashboard only after they select a role and login

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setAuthError(null);
    setEmailOrPhone("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
    setAuthMethod("password");
  };

  // Check if input is email or phone
  const isEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isPhone = (value: string): boolean => {
    return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(value.replace(/\s/g, ""));
  };

  const handleSendOTP = async () => {
    if (!selectedRole) {
      setAuthError("Please select a role first");
      return;
    }

    if (!emailOrPhone) {
      setAuthError("Please enter your email or phone number");
      return;
    }

    if (!isEmail(emailOrPhone) && !isPhone(emailOrPhone)) {
      setAuthError("Please enter a valid email or phone number");
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      // TODO: Implement OTP sending logic
      // For now, simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: `OTP has been sent to your ${isEmail(emailOrPhone) ? 'email' : 'phone number'}`,
      });
    } catch (error: any) {
      console.error("OTP send error:", error);
      setAuthError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setAuthError("Please select a role first");
      return;
    }

    if (!emailOrPhone) {
      setAuthError("Please enter your email or phone number");
      return;
    }

    if (authMethod === "password") {
      if (!password) {
        setAuthError("Please enter your password");
        return;
      }
    } else {
      if (!otp) {
        setAuthError("Please enter the OTP");
        return;
      }
      if (!otpSent) {
        setAuthError("Please request OTP first");
        return;
      }
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

      if (authMethod === "password") {
        // Attempt email/phone login or signup with password
        if (isEmail(emailOrPhone)) {
          if (isSignUp) {
            // Sign up with email
            if (password !== confirmPassword) {
              setAuthError("Passwords do not match");
              setLoading(false);
              return;
            }
            if (password.length < 6) {
              setAuthError("Password must be at least 6 characters long");
              setLoading(false);
              return;
            }
            const result = await signUpWithEmail(emailOrPhone, password, fullName);
            if (result.error) {
              console.log("Sign up failed, using bypass auth for testing");
            }
          } else {
            // Sign in with email
            const result = await signInWithEmail(emailOrPhone, password);
            if (result.error) {
              console.log("Login failed, using bypass auth for testing");
            }
          }
        } else {
          // TODO: Implement phone number login/signup
          console.log("Phone login/signup not yet implemented, using bypass auth");
        }
      } else {
        // TODO: Implement OTP verification and signup
        // For now, simulate OTP verification
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("OTP verification not yet implemented, using bypass auth");
      }

      toast({
        title: isSignUp ? "Account Created" : "Login Successful",
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

        {/* Role Selection Dropdown */}
        <div className="w-full max-w-md mx-auto mb-12">
          <Label htmlFor="role-select" className="text-white mb-3 block text-center" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
            Select Your Role
          </Label>
          <Select value={selectedRole} onValueChange={(value) => handleRoleSelect(value)}>
            <SelectTrigger 
              id="role-select"
              className="animated-border w-full border-2 text-white hover:border-blue-400/60 transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                borderColor: 'rgba(255, 255, 255, 0.3)', 
                borderWidth: '2px', 
                borderStyle: 'solid',
                height: '3.5rem'
              }}
            >
              <SelectValue placeholder="Choose a role to continue" className="text-white">
                {selectedRole ? roles.find(r => r.id === selectedRole)?.name : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1a0f3d] border-2 border-white/30" style={{ backgroundColor: '#1a0f3d' }}>
              {roles.map((role) => {
                const IconComponent = role.icon;
                return (
                  <SelectItem 
                    key={role.id} 
                    value={role.id}
                    className="text-white hover:bg-purple-600/30 focus:bg-purple-600/30 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      <span>{role.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Login Section for Selected Role */}
        {selectedRole && (() => {
          const role = roles.find(r => r.id === selectedRole);
          if (!role) return null;
          const IconComponent = role.icon;
          
          return (
            <Card className="max-w-md mx-auto rounded-lg bg-card text-card-foreground shadow-sm relative border-2 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400/60 hover:scale-[1.02]" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}>
              <CardHeader className="text-center pt-6 pb-4">
                <div className={`${role.color} p-4 rounded-full w-fit mx-auto mb-4`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                  {isSignUp ? `Create ${role.name} Account` : `${role.name} Login`}
                </CardTitle>
                <CardDescription className="text-gray-200">{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                {/* Error Message */}
                {authError && (
                  <div className="p-3 bg-red-900/50 border border-red-400 rounded-md text-red-200 text-sm">
                    {authError}
                  </div>
                )}

                {/* Email/Phone and Password/OTP Login/Signup Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Sign In / Sign Up Toggle */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant="default"
                      className={`flex-1 ${role.color} text-white ${!isSignUp ? "opacity-100" : "opacity-60"}`}
                      onClick={() => {
                        setIsSignUp(false);
                        setAuthError(null);
                        setConfirmPassword("");
                        setFullName("");
                      }}
                      disabled={loading}
                    >
                      Sign In
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      className={`flex-1 ${role.color} text-white ${isSignUp ? "opacity-100" : "opacity-60"}`}
                      onClick={() => {
                        setIsSignUp(true);
                        setAuthError(null);
                      }}
                      disabled={loading}
                    >
                      Sign Up
                    </Button>
                  </div>

                  {/* Full Name Field (for Sign Up) */}
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor={`fullName-${role.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                        Full Name
                      </Label>
                      <Input
                        id={`fullName-${role.id}`}
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        required={isSignUp}
                        className="text-white"
                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`email-phone-${role.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                      Email or Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                        {emailOrPhone && (isEmail(emailOrPhone) ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />)}
                      </div>
                      <Input
                        id={`email-phone-${role.id}`}
                        type="text"
                        placeholder="Enter your email or phone number"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        disabled={loading}
                        required
                        className="text-white pl-10"
                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                      />
                    </div>
                  </div>

                  {/* Authentication Method Selection */}
                  <div className="space-y-2">
                    <Label className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>
                      Authentication Method
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        className={`flex-1 ${role.color} text-white ${authMethod === "password" ? "opacity-100" : "opacity-60"}`}
                        onClick={() => {
                          setAuthMethod("password");
                          setOtp("");
                          setOtpSent(false);
                        }}
                        disabled={loading}
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Password
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        className={`flex-1 ${role.color} text-white ${authMethod === "otp" ? "opacity-100" : "opacity-60"}`}
                        onClick={() => {
                          setAuthMethod("otp");
                          setPassword("");
                          setOtpSent(false);
                        }}
                        disabled={loading}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        OTP
                      </Button>
                    </div>
                  </div>

                  {/* Password Field */}
                  {authMethod === "password" && (
                    <div className="space-y-2">
                      <Label htmlFor={`password-${role.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>Password</Label>
                      <div className="relative">
                        <Input
                          id={`password-${role.id}`}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          required
                          className="bg-background text-white"
                          style={{ backgroundColor: 'transparent', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white"
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
                  )}

                  {/* OTP Field */}
                  {authMethod === "otp" && (
                    <div className="space-y-2">
                      <Label htmlFor={`otp-${role.id}`} className="text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' }}>OTP</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`otp-${role.id}`}
                          type="text"
                          placeholder={otpSent ? "Enter 6-digit OTP" : "Request OTP first"}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          disabled={loading || !otpSent}
                          required
                          maxLength={6}
                          className="text-white flex-1"
                          style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: '#ffffff', color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-purple-600/20"
                          onClick={handleSendOTP}
                          disabled={loading || otpSent || !emailOrPhone}
                        >
                          {otpSent ? "Resend" : "Send OTP"}
                        </Button>
                      </div>
                      {otpSent && (
                        <p className="text-xs text-gray-300">
                          OTP sent to {isEmail(emailOrPhone) ? 'your email' : 'your phone'}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={`w-full ${role.color} ${role.hoverColor} text-white`}
                    disabled={loading}
                  >
                    {loading ? (
                      isSignUp ? "Creating account..." : "Signing in..."
                    ) : (
                      <>
                        {isSignUp ? "Create Account" : `Continue as ${role.name}`}
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
                  variant="default"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => handleGoogleLogin(role.id)}
                  disabled={loading}
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
          );
        })()}
      </div>
      </div>
    </div>
  );
}

