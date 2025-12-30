
import { Button } from "@/components/ui/button";
import { Mail, Share2, Save, Download } from "lucide-react";
import { EstimateDetails } from "../preview/EstimateDetails";
import { EmailForm } from "../preview/EmailForm";
import { WhatsAppForm } from "../preview/WhatsAppForm";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PreviewStepProps {
  estimate: any;
  onSave: () => Promise<void>;
}

export function PreviewStep({ estimate, onSave }: PreviewStepProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const estimateRef = useRef<HTMLDivElement>(null);

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
    // Prevent saving if estimate already has a UUID
    if (estimate?.project_estimate_uuid) {
      toast({
        title: "Already Saved",
        description: "This estimate has already been saved.",
        variant: "default",
      });
      return;
    }
    
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

  const handleDownloadPDF = async () => {
    if (!estimateRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      // Capture the estimate details as canvas
      const canvas = await html2canvas(estimateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1a0f3d',
        windowWidth: estimateRef.current.scrollWidth,
        windowHeight: estimateRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      // Convert pixels to mm: 1px = 0.264583mm at 96dpi
      // Since we used scale: 2, the canvas pixels are 2x, so we divide by 2 to get actual size
      const pxToMm = 0.264583;
      const pdfWidth = (canvas.width / 2) * pxToMm;
      const pdfHeight = (canvas.height / 2) * pxToMm;
      
      // Determine orientation
      const isPortrait = pdfHeight > pdfWidth;
      
      // Create PDF with custom dimensions to fit entire content on one page
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight] // Custom dimensions
      });

      // Add image to fill the entire page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      // Generate filename
      const clientName = (estimate?.clientName || 'Estimate').replace(/[^a-zA-Z0-9]/g, '_');
      const date = new Date().toISOString().split('T')[0];
      const filename = `Estimate_${clientName}_${date}.pdf`;

      // Download PDF
      pdf.save(filename);

      toast({
        title: "PDF Downloaded",
        description: "Your estimate PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
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
            disabled={isSaving || !!estimate?.project_estimate_uuid}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : estimate?.project_estimate_uuid ? "Saved" : "Save Estimate"}
          </Button>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleDownloadPDF}
              variant="outline"
              disabled={isSaving || isGeneratingPDF}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
            >
              {isGeneratingPDF ? "Generating..." : "PDF"}
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleShowEmailForm} 
              variant="outline"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
            >
              <Mail className="h-4 w-4" />
              {isSaving ? "Saving..." : "Email"}
            </Button>
            <Button 
              onClick={handleShowWhatsAppForm} 
              variant="outline"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-white"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
            >
              <Share2 className="h-4 w-4" />
              {isSaving ? "Saving..." : "WhatsApp"}
            </Button>
          </div>
        </div>
      )}
      
      <div ref={estimateRef}>
        <EstimateDetails estimate={estimate} />
      </div>
    </div>
  );
}
