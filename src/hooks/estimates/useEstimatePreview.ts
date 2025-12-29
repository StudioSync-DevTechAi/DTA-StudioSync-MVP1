
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export function useEstimatePreview(
  estimate: any,
  onStatusChange: ((estimateId: string, newStatus: string, negotiatedAmountOrOptions?: string | { isProjectRequested?: boolean; isInvoiceRequested?: boolean }, selectedPackageIndex?: number) => void) | undefined,
  onClose: () => void
) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleStatusChange = (
    estimateId: string, 
    newStatus: string, 
    negotiatedAmountOrOptions?: string | { isProjectRequested?: boolean; isInvoiceRequested?: boolean }, 
    selectedPackageIndex?: number
  ) => {
    if (onStatusChange) {
      onStatusChange(estimateId, newStatus, negotiatedAmountOrOptions, selectedPackageIndex);
      
      toast({
        title: "Estimate Updated",
        description: `Estimate status changed to ${newStatus}`,
      });
    }
  };

  const hideAllForms = () => {
    setShowEmailForm(false);
    setShowWhatsAppForm(false);
    setShowApprovalForm(false);
  };
  
  const handleGoToScheduling = () => {
    onClose();
    // Navigate to scheduling page with a query parameter for the estimate ID
    navigate(`/scheduling?estimateId=${estimate.id}`);
  };

  return {
    showEmailForm,
    showWhatsAppForm,
    showApprovalForm,
    currentPageIndex,
    setShowEmailForm: (show: boolean) => {
      if (show) hideAllForms();
      setShowEmailForm(show);
    },
    setShowWhatsAppForm: (show: boolean) => {
      if (show) hideAllForms();
      setShowWhatsAppForm(show);
    },
    setShowApprovalForm: (show: boolean) => {
      if (show) hideAllForms();
      setShowApprovalForm(show);
    },
    setCurrentPageIndex,
    handleStatusChange,
    handleGoToScheduling
  };
}
