
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateIntroHtml } from "./email-utils/introTemplate";
import { generatePortfolioHtml } from "./email-utils/portfolioTemplates";
import { generateServicesHtml } from "./email-utils/servicesTemplate";
import { generateEstimateDetailsHtml } from "./email-utils/estimateTemplate";
import { sendEmailFallback } from "./email-utils/emailSender";
import { PortfolioLink } from "../form/types";

interface EmailFormProps {
  onClose: () => void;
  estimate: {
    id: string;
    clientName: string;
    clientEmail?: string;
    amount: string;
    date: string;
    selectedServices?: string[];
    services?: Array<{
      event: string;
      date: string;
      photographers: string;
      cinematographers: string;
    }>;
    deliverables?: string[];
    packages?: Array<{
      name?: string;
      amount: string;
      services: Array<{
        event: string;
        date: string;
        photographers: string;
        cinematographers: string;
      }>;
      deliverables: string[];
    }>;
    terms?: string[];
    portfolioLinks?: PortfolioLink[];
    selectedTemplate?: string;
  };
}

export function EmailForm({ onClose, estimate }: EmailFormProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (estimate.clientEmail) {
      setEmailInput(estimate.clientEmail);
    }
  }, [estimate.clientEmail]);

  const handleSendEmail = async () => {
    if (!emailInput) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const templateId = estimate.selectedTemplate || 'modern';
      
      const completeHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          ${generateIntroHtml(estimate.clientName, templateId)}
          ${generatePortfolioHtml(estimate.portfolioLinks, templateId)}
          ${generateServicesHtml(estimate.selectedServices, templateId)}
          ${generateEstimateDetailsHtml(estimate)}
        </div>
      `;

      const emailData = {
        to: emailInput,
        clientName: estimate.clientName,
        estimateId: estimate.id,
        amount: estimate.amount,
        selectedServices: estimate.selectedServices,
        services: estimate.services,
        deliverables: estimate.deliverables,
        packages: estimate.packages,
        terms: estimate.terms,
        portfolioLinks: estimate.portfolioLinks,
        selectedTemplate: estimate.selectedTemplate,
        completeHtml: completeHtml
      };
      
      let result;
      try {
        const { data, error } = await supabase.functions.invoke("send-estimate-email", {
          body: emailData
        });
        
        if (error) {
          throw new Error(error.message || "Failed to send a request to the Edge Function");
        }
        
        result = { success: true, data };
      } catch (edgeFunctionError) {
        console.warn("Edge function failed, using fallback:", edgeFunctionError);
        result = await sendEmailFallback(emailData);
      }
      
      console.log("Email sending result:", result);
      
      let toastMessage = `Estimate has been sent to ${emailInput}`;
      if (result.fallback) {
        toastMessage += " (using fallback method)";
      }
      
      toast({
        title: "Estimate Sent!",
        description: toastMessage,
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Error",
        description: `Failed to send email: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
      <CardContent className="pt-6">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="text-white placeholder:text-gray-400"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
            />
          </div>
          <Button
            onClick={handleSendEmail}
            disabled={isLoading}
            className="text-white hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            {isLoading ? "Sending..." : "Send"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 border"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
