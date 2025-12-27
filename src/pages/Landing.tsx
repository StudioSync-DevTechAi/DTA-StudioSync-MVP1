import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  AlertCircle,
  Chrome,
  Zap,
  Briefcase,
  Camera,
  Video,
  Scissors,
  DollarSign,
  Users,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { InfiniteGrid } from "@/components/ui/infinite-grid-integration";

// Role definitions with colors and icons
const roles = [
  {
    id: "manager",
    name: "Manager",
    description: "Full access to all features and team management",
    icon: Briefcase,
    color: "rgb(139, 92, 246)", // purple-500
  },
  {
    id: "photographer",
    name: "Photographer",
    description: "Access to production workflows and portfolio management",
    icon: Camera,
    color: "rgb(59, 130, 246)", // blue-500
  },
  {
    id: "videographer",
    name: "Videographer",
    description: "Access to video production workflows",
    icon: Video,
    color: "rgb(236, 72, 153)", // pink-500
  },
  {
    id: "editor",
    name: "Editor",
    description: "Access to post-production and editing workflows",
    icon: Scissors,
    color: "rgb(34, 197, 94)", // green-500
  },
  {
    id: "accounts",
    name: "Accounts",
    description: "Access to financial management and invoicing",
    icon: DollarSign,
    color: "rgb(251, 191, 36)", // yellow-500
  },
  {
    id: "crm",
    name: "CRM",
    description: "Access to client management and estimates",
    icon: Users,
    color: "rgb(249, 115, 22)", // orange-500
  },
];

// Get role color helper
const getRoleColor = (roleId: string | null): string => {
  if (!roleId) return "rgb(139, 92, 246)"; // default purple
  const role = roles.find((r) => r.id === roleId);
  return role?.color || "rgb(139, 92, 246)";
};

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, toggleBypassAuth } = useAuth();
  const { toast } = useToast();

  // State management
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [gridTheme, setGridTheme] = useState<"dark" | "light">("dark");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Landing page is always accessible at root URL, regardless of authentication status
  // Users will be redirected to dashboard after successful login/signup

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const isEmailOrPhone = (value: string): "email" | "phone" => {
    if (isValidEmail(value)) return "email";
    if (isValidPhone(value)) return "phone";
    return "email"; // default
  };

  // Handle Send/Resend OTP
  const handleSendOTP = () => {
    if (!emailOrPhone) {
      setAuthError("Please enter your email or phone number");
      return;
    }

    const type = isEmailOrPhone(emailOrPhone);
    if (type === "email" && !isValidEmail(emailOrPhone)) {
      setAuthError("Please enter a valid email address");
      return;
    }
    if (type === "phone" && !isValidPhone(emailOrPhone)) {
      setAuthError("Please enter a valid phone number");
      return;
    }

    setOtpSent(true);
    setAuthError(null);
    toast({
      title: "OTP Sent",
      description: `OTP has been sent to your ${type === "email" ? "email" : "phone"}`,
    });
  };

  // Handle OTP input (6 digits only)
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!selectedRole) {
      setAuthError("Please select a role");
      return;
    }

    if (!emailOrPhone) {
      setAuthError("Please enter your email or phone number");
      return;
    }

    const type = isEmailOrPhone(emailOrPhone);
    if (type === "email" && !isValidEmail(emailOrPhone)) {
      setAuthError("Please enter a valid email address");
      return;
    }
    if (type === "phone" && !isValidPhone(emailOrPhone)) {
      setAuthError("Please enter a valid phone number");
      return;
    }

    if (authMethod === "otp") {
      if (!otpSent) {
        handleSendOTP();
        return;
      }
      if (otp.length !== 6) {
        setAuthError("Please enter the 6-digit OTP");
        return;
      }
      // OTP verification would go here - for now, show error
      setAuthError("OTP authentication is not yet implemented");
      return;
    }

    // Password validation
    if (!password) {
      setAuthError("Please enter your password");
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setAuthError("Please enter your full name");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters long");
        return;
      }
    }

    setLoading(true);

    try {
      // For phone numbers, we'd need to convert to email or use phone auth
      // For now, we'll use email auth only
      const email = type === "email" ? emailOrPhone : `${emailOrPhone.replace(/\D/g, "")}@temp.com`;

      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password, fullName);
      } else {
        result = await signInWithEmail(email, password);
      }

      if (result.error) {
        setAuthError(result.error.message || `Failed to ${isSignUp ? "sign up" : "sign in"}`);
      } else {
        toast({
          title: isSignUp ? "Account Created" : "Signed In",
          description: isSignUp ? "Your account has been created successfully" : "Welcome back!",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setAuthError(error.message || `Failed to ${isSignUp ? "sign up" : "sign in"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleAuth = async () => {
    if (!selectedRole) {
      setAuthError("Please select a role first");
      return;
    }
    try {
      setAuthError(null);
      // Store dashboard as redirect location for after OAuth completes
      // This will be used by AuthCallback to redirect after successful OAuth
      sessionStorage.setItem('auth_redirect', '/dashboard');
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google auth error:", error);
      setAuthError(error.message || "Failed to sign in with Google");
    }
  };

  // Handle Quick Login
  const handleQuickLogin = () => {
    if (!selectedRole) {
      setAuthError("Please select a role first");
      return;
    }
    toggleBypassAuth(selectedRole);
    navigate("/dashboard");
  };

  const selectedRoleData = selectedRole ? roles.find((r) => r.id === selectedRole) : null;
  const roleColor = getRoleColor(selectedRole);
  
  // Theme-based color helpers
  const isLightTheme = gridTheme === "light";
  const textColor = isLightTheme ? "text-gray-900" : "text-white";
  const textColorMuted = isLightTheme ? "text-gray-600" : "text-white/90";
  const textColorSub = isLightTheme ? "text-gray-700" : "text-white/80";
  const textColorIcon = isLightTheme ? "text-gray-400" : "text-white/60";
  const borderColor = isLightTheme ? "border-gray-300" : "border-white/30";
  const borderColorHover = isLightTheme ? "border-gray-400" : "border-white/50";
  const bgColorCard = isLightTheme ? "bg-white" : "bg-[rgba(139,92,246,0.1)]";
  const bgColorInput = isLightTheme ? "bg-white" : "bg-[rgba(139,92,246,0.1)]";
  const bgColorSelect = isLightTheme ? "bg-white" : "bg-[rgba(139,92,246,0.15)]";
  const separatorColor = isLightTheme ? "bg-gray-300" : "bg-white/30";

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${textColor}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isLightTheme ? "border-gray-900" : "border-white"} mx-auto mb-4`}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Infinite Grid Background */}
      <div className="fixed inset-0 z-0">
        <InfiniteGrid theme={gridTheme} />
      </div>
      
      {/* Theme Toggle Button */}
      <button
        onClick={() => setGridTheme(gridTheme === "dark" ? "light" : "dark")}
        className={`fixed top-4 right-4 z-[100] p-3 rounded-full ${isLightTheme ? "bg-gray-100 border-gray-300" : "bg-white/10 border-white/20"} backdrop-blur-sm shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center group`}
        aria-label="Toggle Theme"
      >
        {gridTheme === "dark" ? (
          <Sun className={`w-5 h-5 ${textColor} group-hover:rotate-45 transition-transform`} />
        ) : (
          <Moon className={`w-5 h-5 ${textColor} group-hover:-rotate-12 transition-transform`} />
        )}
      </button>
      
      {/* Content with higher z-index */}
      <div className="relative z-[2]">
        {/* Header Text */}
        <header className="text-center space-y-1 pt-6 pb-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${textColor} whitespace-nowrap`}>
          Welcome to StudioSync
        </h1>
        <p className={`text-xs sm:text-sm ${textColorMuted}`}>
          Select your role and sign in to continue
        </p>
      </header>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center p-2 sm:p-2 min-h-[calc(100vh-150px)]">
        <div className="w-full max-w-md space-y-3">
          {/* Role Selection Dropdown */}
          <div className="relative">
            <Label className={`${textColor} text-center block mb-1.5 text-xs`}>Select Your Role</Label>
            <Select value={selectedRole || ""} onValueChange={setSelectedRole}>
              <SelectTrigger
                className={cn(
                  `w-full h-10 ${bgColorSelect} border-2 ${borderColor} ${textColor} text-sm font-medium backdrop-blur-sm`,
                  `hover:${borderColorHover} transition-all duration-300`,
                  isLightTheme ? "focus:ring-2 focus:ring-gray-400" : "focus:ring-2 focus:ring-white/50",
                  selectedRole && "border-[rgba(139,92,246,0.8)] shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                )}
                style={{
                  boxShadow: selectedRole
                    ? `0 0 20px ${roleColor}40, 0 0 40px ${roleColor}20`
                    : undefined,
                }}
              >
                <SelectValue placeholder="Choose a role to continue">
                  {selectedRoleData && (
                    <div className="flex items-center gap-3">
                      <selectedRoleData.icon className="h-5 w-5" />
                      <span>{selectedRoleData.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={`${bgColorSelect} border ${borderColor} backdrop-blur-md shadow-lg`}>
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                      className={`${textColor} ${isLightTheme ? "hover:bg-gray-100 focus:bg-gray-100" : "hover:bg-[rgba(139,92,246,0.3)] focus:bg-[rgba(139,92,246,0.3)]"} cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div className="flex flex-col">
                          <span className="font-medium">{role.name}</span>
                          <span className={`text-xs ${isLightTheme ? "text-gray-600" : "text-white/70"}`}>{role.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Login Card - Only show when role is selected */}
          {selectedRole && (
            <Card
              className={cn(
                `w-full ${bgColorCard} border-2 ${borderColor} backdrop-blur-md shadow-lg`,
                `hover:scale-[1.02] hover:border-blue-400 ${isLightTheme ? "hover:shadow-xl" : "hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"}`,
                "transition-all duration-300"
              )}
              style={{
                boxShadow: `0 0 20px ${roleColor}30, 0 0 40px ${roleColor}15`,
              }}
            >
              <CardHeader className="space-y-2 p-3">
                <CardTitle className={`text-lg font-bold ${textColor} text-center ${!isLightTheme ? "drop-shadow-lg" : ""}`}>
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </CardTitle>
                <CardDescription className={`text-xs ${textColorSub} text-center ${!isLightTheme ? "drop-shadow" : ""}`}>
                  {selectedRoleData?.description}
                </CardDescription>

                {/* Sign In / Sign Up Toggle */}
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setAuthError(null);
                    }}
                    className={cn(
                      `${isLightTheme ? "text-white" : "text-white"} transition-all duration-300`,
                      !isSignUp
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-80"
                    )}
                    style={{
                      backgroundColor: !isSignUp ? roleColor : `${roleColor}40`,
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setAuthError(null);
                    }}
                    className={cn(
                      `${isLightTheme ? "text-white" : "text-white"} transition-all duration-300`,
                      isSignUp
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-80"
                    )}
                    style={{
                      backgroundColor: isSignUp ? roleColor : `${roleColor}40`,
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 p-3">
                {/* Error Alert */}
                {authError && (
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                    <AlertCircle className="h-4 w-4 text-red-300" />
                    <AlertDescription className="text-red-100">{authError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name (Sign Up Only) */}
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className={`${textColor} ${!isLightTheme ? "drop-shadow" : ""} text-sm`}>
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textColorIcon}`} />
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={cn(
                            `pl-10 ${bgColorInput} ${borderColor} ${textColor}`,
                            isLightTheme ? "placeholder:text-gray-400 focus:border-gray-400" : "placeholder:text-white/50 focus:border-white/50"
                          )}
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email or Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="emailOrPhone" className={`${textColor} ${!isLightTheme ? "drop-shadow" : ""} text-sm`}>
                      Email or Phone Number
                    </Label>
                    <div className="relative">
                      {isEmailOrPhone(emailOrPhone) === "email" ? (
                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textColorIcon}`} />
                      ) : (
                        <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textColorIcon}`} />
                      )}
                      <Input
                        id="emailOrPhone"
                        type="text"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className={cn(
                          `pl-10 ${bgColorInput} ${borderColor} ${textColor}`,
                          isLightTheme ? "placeholder:text-gray-400 focus:border-gray-400" : "placeholder:text-white/50 focus:border-white/50"
                        )}
                        placeholder="Enter email or phone number"
                      />
                    </div>
                  </div>

                  {/* Password / OTP Toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setAuthMethod("password");
                        setOtpSent(false);
                        setOtp("");
                        setAuthError(null);
                      }}
                      variant="outline"
                      className={cn(
                        `flex-1 ${textColor} ${borderColor} transition-all duration-300`,
                        authMethod === "password"
                          ? isLightTheme ? "opacity-100 bg-gray-100" : "opacity-100 bg-white/10"
                          : "opacity-60 hover:opacity-80"
                      )}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Password
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setAuthMethod("otp");
                        setPassword("");
                        setAuthError(null);
                      }}
                      variant="outline"
                      className={cn(
                        `flex-1 ${textColor} ${borderColor} transition-all duration-300`,
                        authMethod === "otp"
                          ? isLightTheme ? "opacity-100 bg-gray-100" : "opacity-100 bg-white/10"
                          : "opacity-60 hover:opacity-80"
                      )}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      OTP
                    </Button>
                  </div>

                  {/* Password Fields */}
                  {authMethod === "password" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className={`${textColor} ${!isLightTheme ? "drop-shadow" : ""} text-sm`}>
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textColorIcon}`} />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={cn(
                              `pl-10 pr-10 ${bgColorInput} ${borderColor} ${textColor}`,
                              isLightTheme ? "placeholder:text-gray-400 focus:border-gray-400" : "placeholder:text-white/50 focus:border-white/50"
                            )}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textColorIcon} ${isLightTheme ? "hover:text-gray-600" : "hover:text-white"}`}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password (Sign Up Only) */}
                      {isSignUp && (
                        <div className="space-y-1.5">
                          <Label htmlFor="confirmPassword" className={`${textColor} ${!isLightTheme ? "drop-shadow" : ""} text-sm`}>
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${textColorIcon}`} />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={cn(
                                `pl-10 pr-10 ${bgColorInput} ${borderColor} ${textColor}`,
                                isLightTheme ? "placeholder:text-gray-400 focus:border-gray-400" : "placeholder:text-white/50 focus:border-white/50"
                              )}
                              placeholder="Confirm password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textColorIcon} ${isLightTheme ? "hover:text-gray-600" : "hover:text-white"}`}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* OTP Field */}
                  {authMethod === "otp" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="otp" className={`${textColor} ${!isLightTheme ? "drop-shadow" : ""} text-sm`}>
                        OTP Code
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={handleOtpChange}
                          maxLength={6}
                          className={cn(
                            `flex-1 ${bgColorInput} ${borderColor} ${textColor} text-center text-2xl tracking-widest`,
                            isLightTheme ? "placeholder:text-gray-400 focus:border-gray-400" : "placeholder:text-white/50 focus:border-white/50"
                          )}
                          placeholder="000000"
                        />
                        <Button
                          type="button"
                          onClick={handleSendOTP}
                          variant="outline"
                          className={`${textColor} ${borderColor} ${isLightTheme ? "hover:bg-gray-100" : "hover:bg-white/10"}`}
                          style={{
                            backgroundColor: roleColor + "40",
                          }}
                        >
                          {otpSent ? "Resend OTP" : "Send OTP"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white h-9 text-sm font-medium transition-all duration-300 hover:opacity-90"
                    style={{ backgroundColor: roleColor }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isSignUp ? "Creating Account..." : "Signing In..."}
                      </>
                    ) : (
                      <>{isSignUp ? "Sign Up" : "Sign In"}</>
                    )}
                  </Button>
                </form>

                <Separator className={separatorColor} />

                {/* Google OAuth Button */}
                <Button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white h-9 text-sm font-medium transition-all duration-300"
                >
                  <Chrome className="h-3.5 w-3.5 mr-2" />
                  Continue with Google
                </Button>

                {/* Quick Login Button */}
                <Button
                  type="button"
                  onClick={handleQuickLogin}
                  variant="outline"
                  className={`w-full ${borderColor} ${textColor} ${isLightTheme ? "hover:bg-gray-100" : "hover:bg-white/10"} h-9 text-sm font-medium transition-all duration-300`}
                >
                  <Zap className="h-3.5 w-3.5 mr-2" />
                  Quick Login (Demo)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

