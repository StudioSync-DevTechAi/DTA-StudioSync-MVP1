import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { EstimatesHeader } from "@/components/estimates/list/EstimatesHeader";
import { EstimateFormPages } from "@/components/estimates/form/EstimateFormPages";
import { useEstimateForm } from "@/components/estimates/form/hooks/useEstimateForm";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewEstimatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Track completed tabs (unlocked tabs)
  const [completedTabs, setCompletedTabs] = useState<Set<number>>(new Set([0])); // Start with Welcome tab unlocked
  
  // Get estimateId from URL if editing existing estimate
  const estimateIdFromUrl = searchParams.get('estimateId');
  
  // TODO: Load editing estimate data if estimateIdFromUrl exists
  const editingEstimate = estimateIdFromUrl ? null : undefined; // Placeholder for editing functionality
  
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

  // Sync URL with currentPage from hook on initial load
  useEffect(() => {
    const pageFromUrl = searchParams.get('page');
    if (pageFromUrl) {
      const pageIndex = parseInt(pageFromUrl, 10);
      if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex <= 5 && pageIndex !== currentPage) {
        setCurrentPage(pageIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const validateEmail = (email: string) => {
    if (!email) return true; // Allow empty email for now
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if current tab is valid (mandatory fields filled)
  const isCurrentTabValid = () => {
    if (currentPage === 0) {
      // Welcome: Client name is mandatory, email optional but must be valid if provided
      return formData.clientName.trim().length > 0 && 
             (!formData.clientEmail || validateEmail(formData.clientEmail));
    } else if (currentPage === 1) {
      // Services: Must select at least one service card
      return formData.selectedServices && formData.selectedServices.length > 0;
    } else if (currentPage === 2) {
      // Details: Must have at least one estimate with at least one service
      const { estimates } = formData.estimateDetails;
      if (!estimates || estimates.length === 0) return false;
      return estimates.some(estimate => 
        estimate.services && estimate.services.length > 0
      );
    } else if (currentPage === 3) {
      // Portfolio: Optional, so always valid
      return true;
    } else if (currentPage === 4) {
      // Template: Must have a template selected (default is "modern" so should always be valid)
      return !!formData.selectedTemplate;
    } else if (currentPage === 5) {
      // Preview: Always valid if we reached here
      return true;
    }
    return false;
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
      // Services: Must select at least one service
      if (!formData.selectedServices || formData.selectedServices.length === 0) {
        toast({
          title: "Service selection required",
          description: "Please select at least one service to continue.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
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
    } else if (currentPage === 4) {
      // Template: Must have a template selected
      if (!formData.selectedTemplate) {
        toast({
          title: "Template required",
          description: "Please select a template to continue.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
    }
    
    return true;
  };
  
  // Update URL when currentPage changes (but not on initial mount)
  const prevPageRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevPageRef.current !== null && prevPageRef.current !== currentPage) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', currentPage.toString());
      navigate(`/estimates/new?${newSearchParams.toString()}`, { replace: true });
    }
    prevPageRef.current = currentPage;
  }, [currentPage, navigate, searchParams]);

  const handleNextWithValidation = () => {
    if (validateCurrentStep()) {
      // Mark current tab as completed and unlock next tab
      const nextPage = currentPage + 1;
      setCompletedTabs(prev => new Set([...prev, currentPage, nextPage]));
      handleNextPage();
    }
  };

  const handlePrevious = () => {
    handlePreviousPage();
  };

  const handleTabChange = (value: string) => {
    const pageIndex = parseInt(value, 10);
    if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex <= 5) {
      // Welcome tab (0) is always accessible, others must be completed/unlocked
      if (pageIndex === 0 || completedTabs.has(pageIndex)) {
        setCurrentPage(pageIndex);
      } else {
        toast({
          title: "Tab locked",
          description: "Please complete the previous steps to unlock this tab.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };
  
  // Check if a tab is accessible
  const isTabAccessible = (tabIndex: number) => {
    return tabIndex === 0 || completedTabs.has(tabIndex);
  };

  const handleSave = async () => {
    try {
      await handleSaveEstimate();
      // Navigate back to estimates list after successful save
      navigate("/estimates");
    } catch (error) {
      // Error handling is done in handleSaveEstimate
      console.error("Error saving estimate:", error);
    }
  };

  const handleNewEstimate = () => {
    navigate("/estimates");
  };

  const getPageTitle = () => {
    const pageTitles = [
      "Welcome",
      "Services",
      "Estimate Details",
      "Portfolio",
      "Template",
      "Preview"
    ];
    return pageTitles[currentPage] || "Create New Estimate";
  };

  // Determine button states
  const isNextDisabled = !isCurrentTabValid() || isSubmitting;
  const showPrevious = currentPage > 0;
  const showNext = currentPage < 5;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        <EstimatesHeader 
          onNewEstimate={handleNewEstimate}
          canCreate={true}
          showActions={false}
          title="Estimates"
          headerNavigationPath="/estimates"
          description="Create a new estimate for your client"
        />
        
        <div className="max-w-6xl mx-auto">
          {/* Navigation Buttons and Tabs - All in one row */}
          <div className="flex items-center justify-center gap-4 mb-4 -mt-2">
            {/* Previous Button - Left side */}
            <div className="flex-shrink-0">
              {showPrevious ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <div className="w-[100px]" /> // Spacer for left side to maintain layout
              )}
            </div>

            {/* Tabs Navigation - Centered */}
            <Tabs value={currentPage.toString()} onValueChange={handleTabChange} className="flex-1 flex justify-center">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
                <TabsTrigger 
                  value="0" 
                  disabled={false}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  Welcome
                </TabsTrigger>
                <TabsTrigger 
                  value="1"
                  disabled={!isTabAccessible(1)}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                    !isTabAccessible(1) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Services
                </TabsTrigger>
                <TabsTrigger 
                  value="2"
                  disabled={!isTabAccessible(2)}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                    !isTabAccessible(2) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="3"
                  disabled={!isTabAccessible(3)}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                    !isTabAccessible(3) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Portfolio
                </TabsTrigger>
                <TabsTrigger 
                  value="4"
                  disabled={!isTabAccessible(4)}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                    !isTabAccessible(4) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Template
                </TabsTrigger>
                <TabsTrigger 
                  value="5"
                  disabled={!isTabAccessible(5)}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                    !isTabAccessible(5) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Next Button - Right side */}
            <div className="flex-shrink-0">
              {showNext && (
                <Button
                  onClick={handleNextWithValidation}
                  disabled={isNextDisabled}
                  className={cn(
                    "flex items-center gap-2",
                    isNextDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {currentPage === 4 ? "Preview" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <Tabs value={currentPage.toString()} onValueChange={handleTabChange} className="w-full">
            <div className="rounded-lg border bg-card text-card-foreground w-full shadow-lg p-4 sm:p-6">
              <EstimateFormPages 
                currentPage={currentPage}
                formData={formData}
                previewEstimate={previewEstimate}
                isSubmitting={isSubmitting}
                isEditing={!!editingEstimate}
                onUpdateFormData={handleUpdateFormData}
                onPrevious={handlePrevious}
                onNext={handleNextWithValidation}
                onSave={handleSave}
                hideNavigation={true}
              />
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

