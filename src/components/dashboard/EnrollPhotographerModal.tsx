import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnrollPhotographerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnrollPhotographerModal({ open, onOpenChange }: EnrollPhotographerModalProps) {
  const [isPhotographer, setIsPhotographer] = useState(true); // true = PG, false = VG
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [payPerDay, setPayPerDay] = useState("");
  const [bio, setBio] = useState("");
  const [dpFile, setDpFile] = useState<File | null>(null);
  const [dpPreview, setDpPreview] = useState<string | null>(null);
  const [dpUrl, setDpUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setDpFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setDpFile(null);
    setDpPreview(null);
    setDpUrl(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!dpFile) return null;

    try {
      setIsUploading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        throw new Error('Not authenticated. Please log in to upload images.');
      }

      // Generate storage path
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = dpFile.name.split('.').pop() || 'jpg';
      const sanitizedFileName = dpFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user.id}/${timestamp}-${randomString}-${sanitizedFileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(storagePath, dpFile, {
          contentType: dpFile.type,
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error('Storage bucket "images" not found. Please create it in Supabase Dashboard > Storage.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(storagePath);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!phoneNumber.trim()) {
      toast({
        title: "Validation error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: `${isPhotographer ? 'Photographer' : 'Videographer'} name is required`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Upload image first if file is selected
      let finalDpUrl = dpUrl;
      if (dpFile && !dpUrl) {
        finalDpUrl = await uploadImage();
        if (!finalDpUrl) {
          return; // Error already shown in uploadImage
        }
      }

      // Prepare about_section_json
      const aboutSectionJson = bio.trim() ? { bio: bio.trim() } : {};

      // Use RPC function to bypass RLS
      const payPerDayValue = payPerDay ? parseFloat(payPerDay) : 0;

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'enroll_photographer_or_videographer',
        {
          p_phone_number: phoneNumber.trim(),
          p_name: name.trim(),
          p_pay_per_day: payPerDayValue,
          p_about_section_json: aboutSectionJson,
          p_dp_url: finalDpUrl,
          p_is_photographer: isPhotographer,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      if (!rpcResult || !rpcResult.success) {
        const errorMsg = rpcResult?.error || 'Unknown error';
        const errorCode = rpcResult?.error_code || 'UNKNOWN';
        throw new Error(`${errorMsg} (${errorCode})`);
      }

      toast({
        title: "Success",
        description: rpcResult.message || `${isPhotographer ? 'Photographer' : 'Videographer'} enrolled successfully!`,
      });

      // Reset form
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPhoneNumber("");
    setName("");
    setPayPerDay("");
    setBio("");
    setDpFile(null);
    setDpPreview(null);
    setDpUrl(null);
  };

  const handleClose = () => {
    if (!isSaving && !isUploading) {
      handleReset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-fit min-w-[400px] max-w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              Enroll {isPhotographer ? "Photographer" : "Videographer"}
            </DialogTitle>
            <div className="flex items-center gap-2 -translate-x-4 translate-y-[20%]">
              <Label htmlFor="toggle-type" className="text-sm font-normal">
                PG
              </Label>
              <Switch
                id="toggle-type"
                checked={!isPhotographer}
                onCheckedChange={(checked) => {
                  setIsPhotographer(!checked);
                  handleReset();
                }}
              />
              <Label htmlFor="toggle-type" className="text-sm font-normal">
                VG
              </Label>
            </div>
          </div>
          <DialogDescription className="mt-2">
            Fill in the details to enroll a new {isPhotographer ? "photographer" : "videographer"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              {isPhotographer ? "Photographer" : "Videographer"} Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isSaving || isUploading}
              className="w-1/2"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {isPhotographer ? "Photographer" : "Videographer"} Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={`Enter ${isPhotographer ? "photographer" : "videographer"} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSaving || isUploading}
              className="w-1/2"
            />
          </div>

          {/* Pay Per Day */}
          <div className="space-y-2">
            <Label htmlFor="payperday">
              Pay Per Day ({isPhotographer ? "₹" : "₹"})
            </Label>
            <Input
              id="payperday"
              type="number"
              min="0"
              step={isPhotographer ? "1" : "0.01"}
              placeholder="Enter pay per day"
              value={payPerDay}
              onChange={(e) => setPayPerDay(e.target.value)}
              disabled={isSaving || isUploading}
              className="w-1/2"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Enter bio or description"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              disabled={isSaving || isUploading}
              className="resize min-w-[300px] max-w-full"
            />
          </div>

          {/* Display Picture Upload */}
          <div className="space-y-2">
            <Label htmlFor="dp">Display Picture</Label>
            {dpPreview ? (
              <div className="relative">
                <img
                  src={dpPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 -mt-2 -mr-2"
                  onClick={handleRemoveImage}
                  disabled={isSaving || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  id="dp"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isSaving || isUploading}
                  className="hidden"
                />
                <Label
                  htmlFor="dp"
                  className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                </Label>
              </div>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading image...</span>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                `Enroll ${isPhotographer ? "Photographer" : "Videographer"}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

