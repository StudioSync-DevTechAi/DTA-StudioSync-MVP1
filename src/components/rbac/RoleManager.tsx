import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRBAC } from "@/hooks/rbac/useRBAC";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Plus } from "lucide-react";

interface TeamMemberWithRoles {
  id: string;
  name: string;
  email: string;
  roles: Role[];
}

export function RoleManager() {
  const { hasRole, assignRole } = useRBAC();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithRoles[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Only managers can access this component
  if (!hasRole('manager')) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-white/70" />
          <p className="text-white/80">Only managers can access role management.</p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all users with their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      // Load available roles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        return;
      }

      setAvailableRoles(roles || []);

      // Load user roles for each user
      const membersWithRoles: TeamMemberWithRoles[] = [];
      
      for (const profile of profiles || []) {
        const { data: userRolesData } = await supabase
          .rpc('get_user_roles', { user_id: profile.id });

        const userRoles: Role[] = (userRolesData || []).map(roleData => ({
          id: '',
          name: roleData.role_name,
          display_name: roleData.role_display_name,
          description: roleData.role_description,
          is_active: true,
          created_at: '',
          updated_at: ''
        }));

        membersWithRoles.push({
          id: profile.id,
          name: profile.full_name || profile.email,
          email: profile.email,
          roles: userRoles
        });
      }

      setTeamMembers(membersWithRoles);
    } catch (error) {
      console.error('Error loading role management data:', error);
      toast({
        title: "Error",
        description: "Failed to load role management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Selection Required",
        description: "Please select both a user and a role",
        variant: "destructive"
      });
      return;
    }

    const success = await assignRole(selectedUser, selectedRole);
    if (success) {
      setSelectedUser("");
      setSelectedRole("");
      await loadData(); // Reload data to show updated roles
    }
  };

  const removeRole = async (userId: string, roleName: string) => {
    try {
      // Get role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (!roleData) return;

      // Remove role assignment
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleData.id);

      if (error) {
        console.error('Error removing role:', error);
        toast({
          title: "Error",
          description: "Failed to remove role",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Role Removed",
        description: `Role ${roleName} removed successfully`
      });

      await loadData(); // Reload data
    } catch (error) {
      console.error('Error in removeRole:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto"></div>
          <p className="mt-2 text-white/80">Loading role management...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5" />
            Team Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Assign Role Section */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label className="text-white">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label className="text-white">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAssignRole}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </div>

            {/* Team Members List */}
            <div className="space-y-3">
              <h4 className="font-medium text-white">Current Team Roles</h4>
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5">
                  <div>
                    <h5 className="font-medium text-white">{member.name}</h5>
                    <p className="text-sm text-white/70">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.roles.length > 0 ? (
                      member.roles.map(role => (
                        <Badge 
                          key={role.name} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                          onClick={() => removeRole(member.id, role.name)}
                          title="Click to remove role"
                        >
                          {role.display_name} ×
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No roles assigned</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}