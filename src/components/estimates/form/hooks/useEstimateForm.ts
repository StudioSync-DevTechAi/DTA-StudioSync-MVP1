
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generatePreviewEstimate } from "../../utils/estimateHelpers";
import { EstimateFormData, PreviewEstimate } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function useEstimateForm(editingEstimate?: any, onSaveCallback?: (estimate: any) => void) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Helper function to get projectName from localStorage
  const getStoredProjectName = (): string => {
    try {
      const stored = localStorage.getItem("estimate_projectName");
      return stored ? stored : "";
    } catch (error) {
      console.error("Error reading projectName from localStorage:", error);
      return "";
    }
  };
  
  const [formData, setFormData] = useState<EstimateFormData>({
    clientName: "",
    clientEmail: "",
    clientPhNo: "",
    countryCode: "+91",
    projectName: getStoredProjectName(),  // Initialize from localStorage if available
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

  // Save projectName to localStorage whenever it changes
  useEffect(() => {
    try {
      if (formData.projectName !== undefined && formData.projectName !== null) {
        localStorage.setItem("estimate_projectName", formData.projectName || "");
      }
    } catch (error) {
      console.error("Error saving projectName to localStorage:", error);
    }
  }, [formData.projectName]);

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
      
      const editingProjectName = editingEstimate.projectName || "";
      
      setFormData({
        clientName: editingEstimate.clientName || "",
        clientEmail: editingEstimate.clientEmail || "",
        clientPhNo: editingEstimate.clientPhNo || "",
        countryCode: editingEstimate.countryCode || "+91",
        projectName: editingProjectName,
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
      
      // Update localStorage with the editing estimate's project name
      try {
        if (editingProjectName) {
          localStorage.setItem("estimate_projectName", editingProjectName);
        }
      } catch (error) {
        console.error("Error saving projectName to localStorage when editing:", error);
      }
      
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
      
      // Get photography owner phone number
      let photographyOwnerPhno = '';
      try {
        const { data: ownerData, error: ownerError } = await supabase
          .from("photography_owner_table")
          .select("photography_owner_phno")
          .limit(1)
          .maybeSingle();
        
        if (ownerError) {
          console.warn("Error fetching photography owner:", ownerError);
        } else if (ownerData?.photography_owner_phno) {
          photographyOwnerPhno = ownerData.photography_owner_phno;
        }
      } catch (error) {
        console.warn("Error fetching photography owner:", error);
      }
      
      // Get client phone number from form data
      const clientPhno = formData.clientPhNo?.replace(/\s/g, '') || '';
      
      if (!photographyOwnerPhno) {
        toast({
          title: "Error",
          description: "Photography owner information not found. Please contact support.",
          variant: "destructive",
        });
        return Promise.reject(new Error("Photography owner not found"));
      }
      
      if (!clientPhno) {
        toast({
          title: "Error",
          description: "Client phone number is required to save the estimate.",
          variant: "destructive",
        });
        return Promise.reject(new Error("Client phone number is required"));
      }
      
      // Get projectName from formData or localStorage as fallback
      const storedProjectName = getStoredProjectName();
      const projectNameToSend = formData.projectName || storedProjectName || '';
      
      // Prepare estimate form data JSONB
      const estimateFormData = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhNo: clientPhno,
        projectName: projectNameToSend,  // Include project name from formData or localStorage - will be persisted in project_name column
        selectedServices: formData.selectedServices,
        estimateDetails: formData.estimateDetails,
        terms: formData.terms,
        portfolioLinks: formData.portfolioLinks,
        selectedTemplate: formData.selectedTemplate,
        previewEstimate: previewEstimate,
        // Include project_estimate_uuid if editing existing estimate
        ...(editingEstimate?.project_estimate_uuid || editingEstimate?.projectEstimateUuid ? {
          project_estimate_uuid: editingEstimate.project_estimate_uuid || editingEstimate.projectEstimateUuid
        } : {})
      };
      
      // Log the project name being sent for debugging
      console.log("Saving estimate with projectName (from formData/localStorage):", projectNameToSend);
      
      // Call RPC function to save estimate
      const { data, error } = await supabase.rpc('save_estimate_form_data', {
        p_photography_owner_phno: photographyOwnerPhno,
        p_client_phno: clientPhno,
        p_estimate_form_data: estimateFormData as any
      });
      
      if (error) {
        console.error("Error saving estimate to database:", error);
        throw error;
      }
      
      if (data && data.success) {
        // Clear projectName from localStorage after successful save
        try {
          localStorage.removeItem("estimate_projectName");
          console.log("Cleared projectName from localStorage after successful save");
        } catch (error) {
          console.error("Error clearing projectName from localStorage:", error);
        }
        
        // Also save to localStorage for backward compatibility
        const savedEstimates = localStorage.getItem("estimates");
        let estimates = savedEstimates ? JSON.parse(savedEstimates) : [];
        
        if (editingEstimate) {
          // Update existing estimate
          const updatedEstimate = {
            ...previewEstimate,
            id: previewEstimate.id || editingEstimate.id,
            project_estimate_uuid: data.project_estimate_uuid || previewEstimate.project_estimate_uuid || editingEstimate.project_estimate_uuid,
            projectEstimateUuid: data.project_estimate_uuid || previewEstimate.projectEstimateUuid || editingEstimate.projectEstimateUuid
          };
          
          // Update previewEstimate state with the UUID so it shows in the preview
          setPreviewEstimate({
            ...previewEstimate,
            project_estimate_uuid: data.project_estimate_uuid || previewEstimate.project_estimate_uuid || editingEstimate.project_estimate_uuid
          });
          estimates = estimates.map(est => 
            est.id === previewEstimate.id || est.id === editingEstimate.id ? updatedEstimate : est
          );
          
          toast({
            title: "Estimate Updated",
            description: `Estimate for ${previewEstimate.clientName} has been updated successfully.`,
          });
          
          // Call the callback to notify parent component
          if (onSaveCallback) {
            onSaveCallback(updatedEstimate);
          }
        } else {
          // Add the project_estimate_uuid to the preview estimate
          const savedEstimate = {
            ...previewEstimate,
            id: data.project_estimate_uuid,
            project_estimate_uuid: data.project_estimate_uuid,  // Include UUID for estimate number display
            projectEstimateUuid: data.project_estimate_uuid,
            status: "pending" // Ensure new estimates have pending status
          };
          
          // Update previewEstimate state with the UUID so it shows in the preview
          setPreviewEstimate({
            ...previewEstimate,
            project_estimate_uuid: data.project_estimate_uuid
          });
          estimates.unshift(savedEstimate);
          
          toast({
            title: "Estimate Created",
            description: `Estimate for ${formData.clientName} has been created successfully.`,
          });
          
          // Call the callback to notify parent component
          if (onSaveCallback) {
            onSaveCallback(savedEstimate);
          }
        }
        
        localStorage.setItem("estimates", JSON.stringify(estimates));
        
        return Promise.resolve();
      } else {
        throw new Error(data?.error || "Failed to save estimate");
      }
    } catch (error: any) {
      console.error("Error saving estimate:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem saving your estimate. Please try again.",
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
