
import { Button } from "@/components/ui/button";
import { Mail, Share2, Save } from "lucide-react";
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

  const handleSaveEstimate = async () => {
    if (!isSaving) {
      setIsSaving(true);
      try {
        await onSave();
        toast({
          title: "Estimate Saved",
          description: "Your estimate has been saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save the estimate. Please try again.",
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
        <div className="flex justify-between items-center space-x-4 mb-4">
          <Button 
            onClick={handleSaveEstimate} 
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Estimate"}
          </Button>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleShowEmailForm} 
              variant="outline"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
            >
              <Mail className="h-4 w-4" />
              {isSaving ? "Saving..." : "Send via Email"}
            </Button>
            <Button 
              onClick={handleShowWhatsAppForm} 
              variant="outline"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
            >
              <Share2 className="h-4 w-4" />
              {isSaving ? "Saving..." : "Share via WhatsApp"}
            </Button>
          </div>
        </div>
      )}
      
      <EstimateDetails estimate={estimate} />
    </div>
  );
}
