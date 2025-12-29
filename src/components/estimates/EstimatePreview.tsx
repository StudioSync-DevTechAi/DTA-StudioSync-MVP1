
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusChecker } from "./preview/StatusChecker";
import { HeaderActions } from "./preview/HeaderActions";
import { useEstimatePreview } from "@/hooks/estimates/useEstimatePreview";
import { PreviewContent } from "./preview/PreviewContent";
import { PreviewPagination } from "./preview/PreviewPagination";
import { ScheduleButton } from "./preview/ScheduleButton";
import { PreviewFormDisplay } from "./preview/PreviewFormDisplay";
import { useInvoices } from "@/hooks/invoices/useInvoices";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface EstimatePreviewProps {
  open: boolean;
  onClose: () => void;
  estimate: {
    id: string;
    clientName: string;
    clientEmail?: string;
    date: string;
    amount: string;
    status: string;
    selectedServices?: string[];
    selectedPackageIndex?: number;
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
  };
  onStatusChange?: (estimateId: string, newStatus: string, negotiatedAmount?: string, selectedPackageIndex?: number) => void;
}

export function EstimatePreview({ open, onClose, estimate, onStatusChange }: EstimatePreviewProps) {
  const { hasInvoiceForEstimate } = useInvoices();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    showEmailForm,
    showWhatsAppForm,
    showApprovalForm,
    currentPageIndex,
    setShowEmailForm,
    setShowWhatsAppForm,
    setShowApprovalForm,
    setCurrentPageIndex,
    handleStatusChange,
    handleGoToScheduling
  } = useEstimatePreview(estimate, onStatusChange, onClose);

  // Handle navigation to invoice page with estimate data
  const handleCreateInvoice = () => {
    // Check if an invoice already exists for this estimate
    if (hasInvoiceForEstimate(estimate.id)) {
      toast({
        title: "Invoice Already Exists",
        description: "An invoice has already been created for this estimate.",
        variant: "destructive"
      });
      return;
    }
    
    navigate("/invoices", { 
      state: { 
        fromEstimate: estimate 
      } 
    });
    onClose();
  };

  // Check if the estimate has multiple packages or if a specific package is selected
  const hasMultiplePackages = estimate.packages && estimate.packages.length > 1;
  const selectedPackage = estimate.selectedPackageIndex !== undefined && 
    estimate.packages && 
    estimate.packages[estimate.selectedPackageIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:bg-white/10"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)' }}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Estimate Preview</DialogTitle>
          {hasMultiplePackages && selectedPackage && (
            <div className="text-sm text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
              Selected Package: <span className="font-medium text-white">{selectedPackage.name || `Option ${estimate.selectedPackageIndex! + 1}`}</span>
            </div>
          )}
          <HeaderActions 
            onShowEmailForm={() => setShowEmailForm(true)}
            onShowWhatsAppForm={() => setShowWhatsAppForm(true)}
            onShowApprovalForm={() => setShowApprovalForm(true)}
            isApproved={estimate.status === "approved"}
            onCreateInvoice={handleCreateInvoice}
            estimateId={estimate.id}
            hasPackages={hasMultiplePackages}
            onStatusChange={handleStatusChange}
          />
        </DialogHeader>

        <StatusChecker 
          isActive={showEmailForm} 
          estimate={estimate} 
          onStatusChange={handleStatusChange} 
        />

        <PreviewFormDisplay 
          showEmailForm={showEmailForm}
          showWhatsAppForm={showWhatsAppForm}
          showApprovalForm={showApprovalForm}
          onCloseEmailForm={() => setShowEmailForm(false)}
          onCloseWhatsAppForm={() => setShowWhatsAppForm(false)}
          onCloseApprovalForm={() => setShowApprovalForm(false)}
          estimate={estimate}
          onStatusChange={handleStatusChange}
        />

        {!showEmailForm && !showWhatsAppForm && !showApprovalForm && (
          <>
            {/* Preview Pagination - Moved to top and made sticky */}
            <div className="sticky top-0 z-10 bg-[rgba(26,15,61,0.98)] backdrop-blur-md py-3 mb-4 border-b border-white/10">
              <PreviewPagination 
                currentPageIndex={currentPageIndex}
                setCurrentPageIndex={setCurrentPageIndex}
              />
            </div>
            
            <PreviewContent 
              currentPageIndex={currentPageIndex} 
              estimate={estimate} 
            />
            
            <ScheduleButton 
              isApproved={estimate.status === "approved"}
              onSchedule={handleGoToScheduling}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
