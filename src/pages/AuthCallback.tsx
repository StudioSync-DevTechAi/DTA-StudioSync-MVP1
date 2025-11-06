import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash fragments (Supabase OAuth returns tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for errors in URL
        if (error) {
          console.error('OAuth callback error:', error, errorDescription);
          toast({
            title: "Authentication failed",
            description: errorDescription || error,
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        // If we have an access token, Supabase should have already set the session
        // Let's verify the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error(sessionError?.message || 'Failed to get session');
        }

        // Success! User is authenticated
        toast({
          title: "Successfully signed in",
          description: `Welcome back, ${session.user.email || 'User'}!`,
        });

        // Redirect to dashboard or the page they were trying to access
        const from = sessionStorage.getItem('auth_redirect') || '/dashboard';
        sessionStorage.removeItem('auth_redirect');
        navigate(from, { replace: true });
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast({
          title: "Authentication error",
          description: error.message || "Failed to complete authentication",
          variant: "destructive"
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

