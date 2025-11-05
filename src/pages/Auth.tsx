import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Eye, EyeOff, ShieldCheck, AlertCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const { user, loading, signInWithGoogle, toggleBypassAuth, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [showBypassOptions, setShowBypassOptions] = useState(false);
  const [bypassRole, setBypassRole] = useState("manager");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailPasswordLoading, setEmailPasswordLoading] = useState(false);

  // Check for auth callback errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      console.error('OAuth callback error:', { error, errorDescription });
      setAuthError(errorDescription || error);
    }
  }, []);

  // Redirect authenticated users immediately
  useEffect(() => {
    if (!loading && user) {
      console.log('Auth: User authenticated, redirecting to dashboard');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show redirecting message
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleGoogleAuth = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google auth error:', error);
      setAuthError(error.message || "Failed to sign in with Google");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEmailAuth = async () => {
    if (!email || !password) {
      setAuthError("Please fill in all required fields");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      return;
    }

    setEmailPasswordLoading(true);
    setAuthError(null);

    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password, fullName);
      } else {
        result = await signInWithEmail(email, password);
      }

      if (result.error) {
        setAuthError(result.error.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
      } else {
        toast({
          title: isSignUp ? "Account Created" : "Signed In",
          description: isSignUp ? "Your account has been created successfully" : "Welcome back!",
        });
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      setAuthError(error.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    } finally {
      setEmailPasswordLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !emailPasswordLoading) {
      e.preventDefault();
      handleEmailAuth();
    }
  };

  const handleBypassAuth = () => {
    toggleBypassAuth(bypassRole);
    navigate('/dashboard');
  };

  // Toggle bypass options with a secret key combination (triple-click on the logo)
  const handleLogoClick = () => {
    setShowBypassOptions(!showBypassOptions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div 
            className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit cursor-pointer"
            onClick={handleLogoClick}
          >
            <img 
              src="/photosyncwork-logo.svg" 
              alt="StudioSyncWork Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to StudioSyncWork
          </CardTitle>
          <CardDescription>
            Sign in to manage your photography business
          </CardDescription>
          
          {/* Public User Access Button */}
          <div className="mt-4">
            <Button 
              onClick={() => navigate("/photographers")} 
              variant="outline"
              className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Users className="h-4 w-4 mr-2" />
              Non-PG End Public User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auth Error Alert */}
          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {authError}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Bypass Auth Section (Hidden by default) */}
          {showBypassOptions && (
            <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Development Bypass</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Select a role to bypass authentication for development purposes:
              </p>
              <div className="flex gap-2">
                <Select value={bypassRole} onValueChange={setBypassRole}>
                  <SelectTrigger className="w-full">
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
                <Button onClick={handleBypassAuth} variant="outline" className="bg-yellow-100 border-yellow-300 text-yellow-800">
                  Bypass
                </Button>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 focus:ring-gray-500"
            size="lg"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={emailPasswordLoading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={emailPasswordLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={emailPasswordLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={emailPasswordLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={emailPasswordLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={emailPasswordLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              onClick={handleEmailAuth}
              className="w-full"
              size="lg"
              disabled={emailPasswordLoading}
            >
              {emailPasswordLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setFullName("");
                }}
                disabled={emailPasswordLoading}
                className="text-sm"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1 mt-4 p-3 bg-muted rounded-md">
            <p>✓ 5GB free storage included</p>
            <p>✓ Portfolio creation tools</p>
            <p>✓ CRM and project management</p>
            <p>✓ Team collaboration features</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}