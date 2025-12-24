
import { Button } from "@/components/ui/button";
import { Mail, Share2 } from "lucide-react";
import { EstimateDetails } from "../preview/EstimateDetails";
import { EmailForm } from "../preview/EmailForm";
import { WhatsAppForm } from "../preview/WhatsAppForm";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface PreviewStepProps {
  estimate: any;
  onSave: () => Promise<void>;
}

export function PreviewStep({ estimate, onSave }: PreviewStepProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleShowEmailForm = async () => {
    if (!isSaving) {
      setIsSaving(true);
      try {
        await onSave();
        setShowEmailForm(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save the estimate before sending. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleShowWhatsAppForm = async () => {
    if (!isSaving) {
      setIsSaving(true);
      try {
        await onSave();
        setShowWhatsAppForm(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save the estimate before sharing. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {showEmailForm && (
        <EmailForm 
          onClose={() => setShowEmailForm(false)} 
          estimate={estimate} 
        />
      )}
      
      {showWhatsAppForm && (
        <WhatsAppForm 
          onClose={() => setShowWhatsAppForm(false)} 
          estimate={estimate}
        />
      )}
      
      {!showEmailForm && !showWhatsAppForm && (
        <div className="flex justify-center space-x-4 mb-4">
          <Button 
            onClick={handleShowEmailForm} 
            variant="outline"
            disabled={isSaving}
            className="text-white"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Send via Email"}
          </Button>
          <Button 
            onClick={handleShowWhatsAppForm} 
            variant="outline"
            disabled={isSaving}
            className="text-white"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Share via WhatsApp"}
          </Button>
        </div>
      )}
      
      <EstimateDetails estimate={estimate} />
    </div>
  );
}
