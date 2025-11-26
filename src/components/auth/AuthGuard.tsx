// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // Bypass authentication checks - always allow access
  // TODO: Re-enable authentication checks as needed
  return <>{children}</>;
}