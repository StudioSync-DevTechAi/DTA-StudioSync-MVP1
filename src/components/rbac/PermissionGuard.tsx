import { ReactNode } from "react";
// import { useRBAC } from "@/hooks/rbac/useRBAC";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { ShieldX } from "lucide-react";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  module?: string;
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions/roles
}

export function PermissionGuard({
  permission,
  permissions,
  role,
  roles,
  module,
  children,
  fallback,
  requireAll = false
}: PermissionGuardProps) {
  // Bypass all permission checks - always allow access
  // TODO: Re-enable permission checks as needed
  return <>{children}</>;
}