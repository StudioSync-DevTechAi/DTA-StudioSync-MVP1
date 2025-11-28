
import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [fullName, setFullName] = React.useState(profile?.full_name || "");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatStorageUsed = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      await updateProfile({ full_name: fullName });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 sm:mb-4">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user.email || ''} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {profile?.full_name 
                    ? getInitials(profile.full_name)
                    : user.email?.charAt(0).toUpperCase() || 'U'
                  }
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl sm:text-2xl">Profile Settings</CardTitle>
            <CardDescription className="text-sm">
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-gray-100 text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm sm:text-base">Full Name</Label>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button onClick={handleSave} size="sm" className="w-full sm:w-auto">Save</Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setFullName(profile?.full_name || "");
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={profile?.full_name || "Not set"}
                      disabled
                      className="bg-gray-100 flex-1 text-sm sm:text-base"
                    />
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Plan Type</Label>
                <Input
                  value={profile?.plan_type || "Pilot"}
                  disabled
                  className="bg-gray-100 capitalize text-sm sm:text-base"
                />
              </div>

              {profile && (
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Storage Usage</Label>
                  <div className="p-3 bg-gray-100 rounded-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mb-2">
                      <span className="text-xs sm:text-sm font-medium">
                        {formatStorageUsed(profile.storage_used)} / {formatStorageUsed(profile.storage_limit)}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {((profile.storage_used / profile.storage_limit) * 100).toFixed(1)}% used
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((profile.storage_used / profile.storage_limit) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Member Since</Label>
                <Input
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                  disabled
                  className="bg-gray-100 text-sm sm:text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
