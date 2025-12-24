
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormWrapper } from "./form/FormWrapper";
import { EstimateFormPages } from "./form/EstimateFormPages";
import { useEstimateForm } from "./form/hooks/useEstimateForm";
import { useToast } from "@/components/ui/use-toast";

interface EstimateFormProps {
  open: boolean;
  onClose: () => void;
  editingEstimate?: any;
}

export function EstimateForm({ open, onClose, editingEstimate }: EstimateFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentPage,
    formData,
    isSubmitting,
    previewEstimate,
    setCurrentPage,
    handleNextPage,
    handlePreviousPage,
    handleUpdateFormData,
    handleSaveEstimate,
  } = useEstimateForm(editingEstimate);

  const handleCloseAndReset = () => {
    if (!editingEstimate) {
      // Reset form data only when creating a new estimate
      handleUpdateFormData("clientName", "");
      handleUpdateFormData("clientEmail", "");
      handleUpdateFormData("selectedServices", []);
      handleUpdateFormData("estimateDetails", {
        events: [],
        estimates: [],
        deliverables: []
      });
    }
    
    setCurrentPage(editingEstimate ? 2 : 0);
    onClose();
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Allow empty email for now
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCurrentStep = () => {
    // Validate depending on the current step
    if (currentPage === 0) {
      if (!formData.clientName.trim()) {
        toast({
          title: "Client name required",
          description: "Please enter the client name to continue.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
      
      // Email validation (if provided)
      const email = formData.clientEmail;
      if (email && !validateEmail(email)) {
        toast({
          title: "Invalid email format",
          description: "Please enter a valid email address or leave it blank.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
    } else if (currentPage === 1) {
      // Make services selection optional - removed validation that was here
      return true;
    } else if (currentPage === 2) {
      // Validate estimate details
      const { estimates } = formData.estimateDetails;
      if (!estimates || estimates.length === 0) {
        toast({
          title: "No estimate packages",
          description: "Please add at least one estimate package to continue.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
      
      // Check if at least one service exists within any estimate
      const hasServices = estimates.some(estimate => 
        estimate.services && estimate.services.length > 0
      );
      
      if (!hasServices) {
        toast({
          title: "Missing services",
          description: "Please add at least one service to an estimate package.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
    }
    
    return true;
  };
  
  const handleNextWithValidation = () => {
    if (validateCurrentStep()) {
      handleNextPage();
    }
  };

  const getDialogTitle = () => {
    if (editingEstimate) {
      return "Edit Estimate Details";
    }
    return currentPage === 3 ? "Preview Estimate" : "Create New Estimate";
  };

  return (
    <FormWrapper 
      open={open} 
      onClose={handleCloseAndReset}
      title={getDialogTitle()}
      currentPage={currentPage}
      onPrevious={currentPage > 0 ? handlePreviousPage : undefined}
    >
      <EstimateFormPages 
        currentPage={currentPage}
        formData={formData}
        previewEstimate={previewEstimate}
        isSubmitting={isSubmitting}
        isEditing={!!editingEstimate}
        onUpdateFormData={handleUpdateFormData}
        onPrevious={handlePreviousPage}
        onNext={handleNextWithValidation}
        onSave={handleSaveEstimate}
      />
    </FormWrapper>
  );
}
