import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useBypassAuth } from "./BypassAuthContext";
import { supabase } from "@/integrations/supabase/client";

// Define profile type
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  storage_used: number;
  storage_limit: number;
  plan_type: string;
  primary_role?: string;
  created_at: string;
  updated_at: string;
}

// Define context type
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  bypassAuth: boolean;
  toggleBypassAuth: (role?: string) => void;
  userRoles: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockProfile, setMockProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const { bypassEnabled, mockUser, mockProfile: bypassMockProfile, toggleBypass, setMockRole } = useBypassAuth();

  // Use bypass auth if enabled
  useEffect(() => {
    if (bypassEnabled) {
      setUser(mockUser);
      setMockProfile(bypassMockProfile);
      setLoading(false);
    }
  }, [bypassEnabled, mockUser, bypassMockProfile]);

  // Listen for auth state changes
  useEffect(() => {
    // Skip if bypass is enabled
    if (bypassEnabled) return;
    
    setLoading(true);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      // Create a simple profile for authenticated users
      if (session?.user) {
        const simpleProfile: Profile = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
          avatar_url: session.user.user_metadata?.avatar_url || undefined,
          storage_used: 0,
          storage_limit: 5368709120,
          plan_type: "pilot",
          primary_role: "photographer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(simpleProfile);
        setUserRoles(['photographer']);
        setUserPermissions([]);
      }
      
      setLoading(false);
    }).catch(error => {
      console.error('AuthContext: Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Create a simple profile for authenticated users
        const simpleProfile: Profile = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
          avatar_url: session.user.user_metadata?.avatar_url || undefined,
          storage_used: 0,
          storage_limit: 5368709120,
          plan_type: "pilot",
          primary_role: "photographer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(simpleProfile);
        setUserRoles(['photographer']);
        setUserPermissions([]);
      } else {
        setProfile(null);
        setUserRoles([]);
        setUserPermissions([]);
      }
      
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, [bypassEnabled]);

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (bypassEnabled) return true; // Bypass mode has all permissions
    return userPermissions.includes(permission);
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    if (bypassEnabled) {
      // In bypass mode, check the mock role
      const mockRole = bypassMockProfile?.primary_role || 'manager';
      return role === mockRole;
    }
    return userRoles.includes(role);
  };

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      // Set loading state to prevent multiple sign-in attempts
      setLoading(true);
      
      // Store current location for redirect after OAuth (only if not already set)
      // Landing page sets this to '/dashboard' explicitly
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth' && currentPath !== '/auth/callback' && !sessionStorage.getItem('auth_redirect')) {
        sessionStorage.setItem('auth_redirect', currentPath);
      }
      
      // Sign in with Google using Supabase
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Note: Success toast will be shown after redirect completes
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
      
      // Reset loading state on error
      setLoading(false);
    }
  };

  // Sign in with email and password
  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Email sign in error:', error);
        return { error };
      }
      
      console.log('Email sign in successful:', data.user?.email);
      return { error: null };
    } catch (error: any) {
      console.error('Email sign in error:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const handleSignUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName || email.split('@')[0],
          }
        }
      });
      
      if (error) {
        console.error('Email sign up error:', error);
        return { error };
      }
      
      console.log('Email sign up successful:', data.user?.email);
      return { error: null };
    } catch (error: any) {
      console.error('Email sign up error:', error);
      return { error };
    }
  };
  // Sign out
  const handleSignOut = async () => {
    try {
      // If using bypass, just clear the bypass
      if (bypassEnabled) {
        toggleBypass();
        toast({
          title: "Signed out",
          description: "You have been signed out of bypass mode"
        });
        return;
      }
      
      // Otherwise use Supabase sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  // Update profile
  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (bypassEnabled) {
      // Update mock profile for bypass mode
      setMockProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated in bypass mode"
      });
      return;
    }
    
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };
  
  // Add function to toggle bypass auth
  const toggleBypassAuth = (role: string = 'manager') => {
    setMockRole(role);
    toggleBypass();
  };

  // Context value
  const value = {
    user: bypassEnabled ? mockUser : user,
    profile: bypassEnabled ? bypassMockProfile || mockProfile : profile,
    loading: bypassEnabled ? false : loading,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    bypassAuth: bypassEnabled,
    toggleBypassAuth,
    userRoles: bypassEnabled ? [bypassMockProfile?.primary_role || 'manager'] : userRoles,
    hasPermission,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}