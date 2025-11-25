import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Role, Permission, UserWithRoles, PERMISSIONS } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";

export function useRBAC() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<Role | null>(null);

  // Load user roles and permissions
  useEffect(() => {
    // TODO: Re-enable RBAC API calls when security is needed.
    // For now, bypass all API calls and return default values
    setLoading(false);
    return;
    
    // Original code (commented out):
    // if (user && !authLoading) {
    //   loadUserRolesAndPermissions();
    // } else if (!authLoading) {
    //   // Clear data if no user
    //   setUserRoles([]);
    //   setUserPermissions([]);
    //   setPrimaryRole(null);
    //   setLoading(false);
    // }
  }, [user, authLoading]);

  const loadUserRolesAndPermissions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles', { user_id: user.id });

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        // If no roles found, assign default role based on profile
        await assignDefaultRole();
        return;
      }

      // Get user permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .rpc('get_user_permissions', { user_id: user.id });

      if (permissionsError) {
        console.error('Error fetching user permissions:', permissionsError);
        return;
      }

      // Convert to proper types
      const roles: Role[] = (rolesData || []).map(role => ({
        id: '', // We don't need the ID for display purposes
        name: role.role_name,
        display_name: role.role_display_name,
        description: role.role_description,
        is_active: true,
        created_at: '',
        updated_at: ''
      }));

      const permissions: Permission[] = (permissionsData || []).map(perm => ({
        id: '', // We don't need the ID for display purposes
        name: perm.permission_name,
        display_name: perm.permission_display_name,
        description: '',
        resource: perm.resource,
        action: perm.action,
        created_at: ''
      }));

      setUserRoles(roles);
      setUserPermissions(permissions);

      // Set primary role (first role or manager if available)
      const managerRole = roles.find(r => r.name === 'manager');
      setPrimaryRole(managerRole || roles[0] || null);

    } catch (error) {
      console.error('Error loading RBAC data:', error);
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignDefaultRole = async () => {
    if (!user) return;

    try {
      // Get user's profile to determine default role
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_role')
        .eq('id', user.id)
        .single();

      const defaultRoleName = profile?.primary_role || 'photographer';

      // Get the role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', defaultRoleName)
        .single();

      if (roleData) {
        // Assign the role to the user
        await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role_id: roleData.id,
            assigned_by: user.id // Self-assigned for default role
          });

        // Reload roles and permissions
        await loadUserRolesAndPermissions();
      }
    } catch (error) {
      console.error('Error assigning default role:', error);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permissionName: string): boolean => {
    // TODO: Re-enable permission checks when security is needed.
    // For now, always return true to bypass all permission checks
    return true;
    // Original code:
    // return userPermissions.some(permission => permission.name === permissionName);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(permissionName => hasPermission(permissionName));
  };

  // Check if user has a specific role
  const hasRole = (roleName: string): boolean => {
    // TODO: Re-enable role checks when security is needed.
    // For now, always return true to bypass all role checks
    return true;
    // Original code:
    // return userRoles.some(role => role.name === roleName);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  // Get user's role names as array
  const getRoleNames = (): string[] => {
    return userRoles.map(role => role.name);
  };

  // Check if user can access a specific module/page
  const canAccessModule = (module: string): boolean => {
    switch (module) {
      case 'estimates':
        return hasAnyPermission([PERMISSIONS.ESTIMATES_VIEW, PERMISSIONS.ESTIMATES_CREATE]);
      case 'invoices':
        return hasAnyPermission([PERMISSIONS.INVOICES_VIEW, PERMISSIONS.INVOICES_CREATE]);
      case 'finances':
        return hasPermission(PERMISSIONS.FINANCES_VIEW);
      case 'workflow':
        return hasPermission(PERMISSIONS.WORKFLOW_VIEW);
      case 'team':
        return hasPermission(PERMISSIONS.TEAM_VIEW);
      case 'portfolio':
        return hasAnyPermission([PERMISSIONS.PORTFOLIO_VIEW, PERMISSIONS.PORTFOLIO_CREATE]);
      case 'settings':
        return hasPermission(PERMISSIONS.SETTINGS_VIEW);
      default:
        return hasPermission(PERMISSIONS.DASHBOARD_VIEW);
    }
  };

  // Assign role to user (manager only)
  const assignRole = async (userId: string, roleName: string): Promise<boolean> => {
    if (!hasRole('manager')) {
      toast({
        title: "Access Denied",
        description: "Only managers can assign roles",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Get role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (!roleData) {
        toast({
          title: "Error",
          description: "Role not found",
          variant: "destructive"
        });
        return false;
      }

      // Assign role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id,
          assigned_by: user?.id
        });

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Failed to assign role",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Role Assigned",
        description: `Role ${roleName} assigned successfully`
      });
      return true;
    } catch (error) {
      console.error('Error in assignRole:', error);
      return false;
    }
  };

  return {
    // State
    userRoles,
    userPermissions,
    primaryRole,
    loading: loading || authLoading,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    canAccessModule,
    getRoleNames,
    
    // Actions
    assignRole,
    loadUserRolesAndPermissions
  };
}