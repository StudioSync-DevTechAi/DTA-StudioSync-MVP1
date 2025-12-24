
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generatePreviewEstimate } from "../../utils/estimateHelpers";
import { EstimateFormData, PreviewEstimate } from "../types";

export function useEstimateForm(editingEstimate?: any) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<EstimateFormData>({
    clientName: "",
    clientEmail: "",
    clientPhNo: "",
    selectedServices: [],
    estimateDetails: {
      events: [],
      estimates: [],
      deliverables: []
    },
    terms: [
      "This estimate is valid for 30 days from the date of issue.",
      "A 50% advance payment is required to confirm the booking.",
      "The balance payment is due before the event date."
    ],
    portfolioLinks: [],
    selectedTemplate: "modern"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<PreviewEstimate | null>(null);

  useEffect(() => {
    if (editingEstimate) {
      const selectedServices = editingEstimate.selectedServices || [];
      
      let estimates = [];
      if (editingEstimate.packages && editingEstimate.packages.length > 0) {
        estimates = editingEstimate.packages.map(pkg => ({
          services: pkg.services || [],
          deliverables: pkg.deliverables || [],
          total: pkg.amount
        }));
      } else {
        estimates = [{
          services: editingEstimate.services || [],
          deliverables: editingEstimate.deliverables || [],
          total: editingEstimate.amount
        }];
      }
      
      setFormData({
        clientName: editingEstimate.clientName || "",
        clientEmail: editingEstimate.clientEmail || "",
        clientPhNo: editingEstimate.clientPhNo || "",
        selectedServices,
        estimateDetails: {
          events: [],
          estimates,
          deliverables: []
        },
        terms: editingEstimate.terms || [
          "This estimate is valid for 30 days from the date of issue.",
          "A 50% advance payment is required to confirm the booking.",
          "The balance payment is due before the event date."
        ],
        portfolioLinks: editingEstimate.portfolioLinks || [],
        selectedTemplate: editingEstimate.selectedTemplate || "modern"
      });
      
      setPreviewEstimate(editingEstimate);
      
      // If editing, start directly on the estimate details page
      setCurrentPage(2);
    }
  }, [editingEstimate]);

  const handleGeneratePreview = () => {
    const preview = generatePreviewEstimate(formData, toast);
    if (preview) {
      if (editingEstimate) {
        preview.id = editingEstimate.id;
        preview.status = editingEstimate.status;
        preview.clientEmail = formData.clientEmail || editingEstimate.clientEmail || "";
        preview.clientName = editingEstimate.clientName; // Keep original client name when editing
        preview.selectedPackageIndex = editingEstimate.selectedPackageIndex; // Keep selected package index
      } else {
        preview.clientEmail = formData.clientEmail || "";
        // Default to the first package if not editing
        preview.selectedPackageIndex = 0;
      }
      
      // Add selectedServices to the preview
      preview.selectedServices = formData.selectedServices;
      
      // Add terms to the preview
      preview.terms = formData.terms;
      
      // Add portfolio links to the preview
      preview.portfolioLinks = formData.portfolioLinks;
      
      // Add selected template to the preview
      preview.selectedTemplate = formData.selectedTemplate;
      
      setPreviewEstimate(preview);
      setCurrentPage(5);
    }
  };

  const handleSaveEstimate = async () => {
    if (!previewEstimate) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Saving estimate:", previewEstimate);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedEstimates = localStorage.getItem("estimates");
      let estimates = savedEstimates ? JSON.parse(savedEstimates) : [];
      
      if (editingEstimate) {
        estimates = estimates.map(est => 
          est.id === previewEstimate.id ? previewEstimate : est
        );
        
        toast({
          title: "Estimate Updated",
          description: `Estimate for ${previewEstimate.clientName} has been updated successfully.`,
        });
      } else {
        estimates.unshift(previewEstimate);
        
        toast({
          title: "Estimate Created",
          description: `Estimate for ${formData.clientName} has been created successfully.`,
        });
      }
      
      localStorage.setItem("estimates", JSON.stringify(estimates));
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your estimate. Please try again.",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage === 4) {
      handleGeneratePreview();
    } else {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    // When editing, don't allow going back from the estimate details page
    if (editingEstimate && currentPage === 2) {
      return;
    }
    setCurrentPage(prev => prev - 1);
  };

  const handleUpdateFormData = (key: keyof EstimateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return {
    currentPage,
    formData,
    isSubmitting,
    previewEstimate,
    setCurrentPage,
    handleNextPage,
    handlePreviousPage,
    handleUpdateFormData,
    handleSaveEstimate,
  };
}
