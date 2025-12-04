
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export function useEstimatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNewEstimateForm, setShowNewEstimateForm] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState("pending");
  const [estimates, setEstimates] = useState(() => {
    const savedEstimates = localStorage.getItem("estimates");
    return savedEstimates ? JSON.parse(savedEstimates) : [];
  });

  useEffect(() => {
    localStorage.setItem("estimates", JSON.stringify(estimates));
  }, [estimates]);

  const handleEditEstimate = (estimate) => {
    setSelectedEstimate(estimate);
    setIsEditing(true);
    setShowNewEstimateForm(true);
  };

  const handleOpenPreview = (estimate) => {
    setSelectedEstimate(estimate);
    setShowPreview(true);
  };

  const handleStatusChange = (estimateId: string, newStatus: string, negotiatedAmount?: string, selectedPackageIndex?: number) => {
    const updatedEstimates = estimates.map(est => {
      if (est.id === estimateId) {
        const updatedEstimate = {
          ...est,
          status: newStatus,
          selectedPackageIndex: selectedPackageIndex
        };
        
        if (selectedPackageIndex !== undefined && updatedEstimate.packages && updatedEstimate.packages[selectedPackageIndex]) {
          updatedEstimate.amount = updatedEstimate.packages[selectedPackageIndex].amount;
        }
        
        if (negotiatedAmount) {
          updatedEstimate.amount = negotiatedAmount;
          
          if (selectedPackageIndex !== undefined && updatedEstimate.packages) {
            updatedEstimate.packages = updatedEstimate.packages.map((pkg, idx) => {
              if (idx === selectedPackageIndex) {
                return {
                  ...pkg,
                  amount: negotiatedAmount
                };
              }
              return pkg;
            });
          } else if (updatedEstimate.packages) {
            const ratio = parseFloat(negotiatedAmount) / parseFloat(est.amount);
            updatedEstimate.packages = updatedEstimate.packages.map(pkg => ({
              ...pkg,
              amount: (parseFloat(pkg.amount) * ratio).toFixed(2)
            }));
          }
        }
        
        return updatedEstimate;
      }
      return est;
    });
    
    setEstimates(updatedEstimates);
    setSelectedEstimate(updatedEstimates.find(est => est.id === estimateId));
    
    const toastMessages = {
      approved: "Estimate has been approved! Proceeding to next steps.",
      declined: "Estimate has been declined.",
      negotiating: "Estimate status updated to negotiating.",
      pending: "Estimate status updated to pending."
    };
    
    toast({
      title: "Status Updated",
      description: toastMessages[newStatus] || "Estimate status has been updated.",
      variant: newStatus === "declined" ? "destructive" : "default"
    });
  };

  const handleQuickStatusChange = (estimateId: string, newStatus: string) => {
    handleStatusChange(estimateId, newStatus);
    setShowPreview(false);
  };

  const handleGoToScheduling = (estimateId: string) => {
    navigate(`/scheduling?estimateId=${estimateId}`);
  };

  const handleCreateNewEstimate = () => {
    // Navigate to the new estimate page instead of opening a dialog
    navigate("/estimates/new");
  };

  const handleCloseForm = () => {
    setShowNewEstimateForm(false);
    setIsEditing(false);
    setSelectedEstimate(null);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const getFilteredEstimates = () => {
    return estimates.filter(estimate => {
      if (currentTab === "pending") return estimate.status === "pending" || estimate.status === "negotiating";
      if (currentTab === "approved") return estimate.status === "approved";
      if (currentTab === "declined") return estimate.status === "declined";
      return true;
    });
  };

  return {
    showNewEstimateForm,
    selectedEstimate,
    showPreview,
    isEditing,
    currentTab,
    estimates,
    filteredEstimates: getFilteredEstimates(),
    setCurrentTab,
    handleEditEstimate,
    handleOpenPreview,
    handleStatusChange,
    handleQuickStatusChange,
    handleGoToScheduling,
    handleCreateNewEstimate,
    handleCloseForm,
    handleClosePreview
  };
}
