
import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [fullName, setFullName] = React.useState(profile?.full_name || "");
  
  // Photography owner fields state
  const [photographyOwnerName, setPhotographyOwnerName] = React.useState("");
  const [photographyOwnerPhno, setPhotographyOwnerPhno] = React.useState("");
  const [photographyOwnerEmail, setPhotographyOwnerEmail] = React.useState("");
  
  // Company fields state
  const [companyName, setCompanyName] = React.useState("");
  const [companyEmail, setCompanyEmail] = React.useState("");
  const [companyPhno, setCompanyPhno] = React.useState("");
  const [companyAddress, setCompanyAddress] = React.useState("");
  const [isEditingCompany, setIsEditingCompany] = React.useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = React.useState(true);
  const [isSavingCompany, setIsSavingCompany] = React.useState(false);

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

  // Fetch photography owner and company data from photography_owner_table
  React.useEffect(() => {
    const fetchOwnerData = async () => {
      if (!user?.email) {
        setIsLoadingCompany(false);
        return;
      }

      try {
        setIsLoadingCompany(true);
        const { data, error } = await supabase
          .from("photography_owner_table")
          .select("photography_owner_name, photography_owner_phno, photography_owner_email, company_name, company_email, company_phno, company_address")
          .eq("photography_owner_email", user.email)
          .maybeSingle();

        if (error) {
          console.error("Error fetching owner data:", error);
          // Don't show error to user, just log it
        } else if (data) {
          // Set photography owner fields
          setPhotographyOwnerName(data.photography_owner_name || "");
          setPhotographyOwnerPhno(data.photography_owner_phno || "");
          setPhotographyOwnerEmail(data.photography_owner_email || "");
          
          // Set company fields
          setCompanyName(data.company_name || "");
          setCompanyEmail(data.company_email || "");
          setCompanyPhno(data.company_phno || "");
          setCompanyAddress(data.company_address || "");
        }
      } catch (error) {
        console.error("Error in fetchOwnerData:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchOwnerData();
  }, [user?.email]);

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

  const handleSaveCompany = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to update company details",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSavingCompany(true);
      
      const requestBody = {
        p_photography_owner_email: user.email,
        p_company_name: companyName || null,
        p_company_email: companyEmail || null,
        p_company_phno: companyPhno || null,
        p_company_address: companyAddress || null
      };

      console.log("Calling RPC to update company details with data:", requestBody);

      // Call RPC function (this will make a POST request to /rest/v1/rpc/update_company_details)
      const { data, error } = await supabase.rpc('update_company_details', requestBody);

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }

      console.log("RPC response:", data);

      if (data && data.success) {
        // Update local state with the response data
        const responseData = data.data;
        if (responseData) {
          setCompanyName(responseData.company_name || "");
          setCompanyEmail(responseData.company_email || "");
          setCompanyPhno(responseData.company_phno || "");
          setCompanyAddress(responseData.company_address || "");
        }

        toast({
          title: "Success",
          description: data.message || "Company details updated successfully"
        });
        setIsEditingCompany(false);
      } else {
        throw new Error(data?.error || "Failed to update company details");
      }
    } catch (error: any) {
      console.error("Error updating company details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update company details",
        variant: "destructive"
      });
    } finally {
      setIsSavingCompany(false);
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
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
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
            <CardTitle className="text-xl sm:text-2xl text-white">Profile Settings</CardTitle>
            <CardDescription className="text-sm text-white/70">
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-white/20 text-white border-white/30 text-sm sm:text-base"
                />
                <p className="text-xs text-white/70">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm sm:text-base text-white">Full Name</Label>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex-1 text-sm sm:text-base bg-white/20 text-white border-white/30 placeholder:text-white/50"
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
                      className="bg-white/20 text-white border-white/30 flex-1 text-sm sm:text-base"
                    />
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base text-white">Plan Type</Label>
                <Input
                  value={profile?.plan_type || "Pilot"}
                  disabled
                  className="bg-white/20 text-white border-white/30 capitalize text-sm sm:text-base"
                />
              </div>

              {profile && (
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base text-white">Storage Usage</Label>
                  <div className="p-3 bg-white/10 rounded-md border border-white/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mb-2">
                      <span className="text-xs sm:text-sm font-medium text-white">
                        {formatStorageUsed(profile.storage_used)} / {formatStorageUsed(profile.storage_limit)}
                      </span>
                      <span className="text-xs sm:text-sm text-white/70">
                        {((profile.storage_used / profile.storage_limit) * 100).toFixed(1)}% used
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white/60 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((profile.storage_used / profile.storage_limit) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm sm:text-base text-white">Member Since</Label>
                <Input
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                  disabled
                  className="bg-white/20 text-white border-white/30 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Photography Owner Details Section */}
            <div className="border-t pt-4 sm:pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base sm:text-lg font-semibold text-white">Photography Owner Details</Label>
              </div>

              {isLoadingCompany ? (
                <div className="text-center py-4 text-white/70">Loading owner details...</div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photographyOwnerName" className="text-sm sm:text-base text-white">Owner Name</Label>
                    <Input
                      id="photographyOwnerName"
                      type="text"
                      value={photographyOwnerName}
                      disabled
                      className="text-sm sm:text-base bg-white/20 text-white border-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photographyOwnerPhno" className="text-sm sm:text-base text-white">Owner Phone Number</Label>
                    <Input
                      id="photographyOwnerPhno"
                      type="tel"
                      value={photographyOwnerPhno}
                      disabled
                      className="text-sm sm:text-base bg-white/20 text-white border-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photographyOwnerEmail" className="text-sm sm:text-base text-white">Owner Email</Label>
                    <Input
                      id="photographyOwnerEmail"
                      type="email"
                      value={photographyOwnerEmail}
                      disabled
                      className="text-sm sm:text-base bg-white/20 text-white border-white/30"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Company Details Section */}
            <div className="border-t pt-4 sm:pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base sm:text-lg font-semibold text-white">Company Details</Label>
                {!isEditingCompany && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingCompany(true)}
                    className="flex items-center gap-1.5 text-white border-white/60 hover:bg-white/30 hover:border-white font-medium"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                      borderWidth: '1.5px'
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
              </div>

              {isLoadingCompany ? (
                <div className="text-center py-4 text-white/70">Loading company details...</div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm sm:text-base text-white">Company Name</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                        disabled={!isEditingCompany}
                        className="flex-1 text-sm sm:text-base bg-white/20 text-white border-white/30 placeholder:text-white/50 disabled:opacity-70"
                      />
                      {isEditingCompany && (
                        <Pencil className="h-4 w-4 text-white/70 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail" className="text-sm sm:text-base text-white">Company Email</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="company@example.com"
                        disabled={!isEditingCompany}
                        className="flex-1 text-sm sm:text-base bg-white/20 text-white border-white/30 placeholder:text-white/50 disabled:opacity-70"
                      />
                      {isEditingCompany && (
                        <Pencil className="h-4 w-4 text-white/70 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhno" className="text-sm sm:text-base text-white">Company Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="companyPhno"
                        type="tel"
                        value={companyPhno}
                        onChange={(e) => setCompanyPhno(e.target.value)}
                        placeholder="+91 98765 43210"
                        disabled={!isEditingCompany}
                        className="flex-1 text-sm sm:text-base bg-white/20 text-white border-white/30 placeholder:text-white/50 disabled:opacity-70"
                      />
                      {isEditingCompany && (
                        <Pencil className="h-4 w-4 text-white/70 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress" className="text-sm sm:text-base text-white">Company Address</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="companyAddress"
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                        disabled={!isEditingCompany}
                        className="flex-1 text-sm sm:text-base bg-white/20 text-white border-white/30 placeholder:text-white/50 disabled:opacity-70"
                      />
                      {isEditingCompany && (
                        <Pencil className="h-4 w-4 text-white/70 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {isEditingCompany && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={handleSaveCompany}
                        disabled={isSavingCompany}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {isSavingCompany ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setIsEditingCompany(false);
                          // Reset to original values by fetching again
                          if (!user?.email) return;
                          try {
                            const { data } = await supabase
                              .from("photography_owner_table")
                              .select("company_name, company_email, company_phno, company_address")
                              .eq("photography_owner_email", user.email)
                              .maybeSingle();
                            
                            if (data) {
                              setCompanyName(data.company_name || "");
                              setCompanyEmail(data.company_email || "");
                              setCompanyPhno(data.company_phno || "");
                              setCompanyAddress(data.company_address || "");
                            }
                          } catch (error) {
                            console.error("Error resetting company data:", error);
                          }
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
