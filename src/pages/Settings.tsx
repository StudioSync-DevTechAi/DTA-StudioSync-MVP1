
import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Shield, Bell, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [emailUpdates, setEmailUpdates] = React.useState(true);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            Settings
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                Notifications
              </CardTitle>
              <CardDescription className="text-sm">
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label htmlFor="notifications" className="text-sm sm:text-base">Push Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive notifications for important updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="shrink-0"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label htmlFor="email-updates" className="text-sm sm:text-base">Email Updates</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive email updates about your projects
                  </p>
                </div>
                <Switch
                  id="email-updates"
                  checked={emailUpdates}
                  onCheckedChange={setEmailUpdates}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                Appearance
              </CardTitle>
              <CardDescription className="text-sm">
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label htmlFor="dark-mode" className="text-sm sm:text-base">Dark Mode</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Enable dark theme for better viewing in low light
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                Security
              </CardTitle>
              <CardDescription className="text-sm">
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Account Actions</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Password Reset",
                        description: "Password reset functionality would be implemented here",
                      });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Danger Zone</Label>
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut}
                  className="w-full sm:w-auto"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
