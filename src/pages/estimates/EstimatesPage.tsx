
import Layout from "@/components/Layout";
import { EstimatesHeader } from "@/components/estimates/list/EstimatesHeader";
import { EstimatesTabs } from "@/components/estimates/list/EstimatesTabs";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { EstimatePreview } from "@/components/estimates/EstimatePreview";
import { useEstimatesPage } from "@/hooks/estimates/useEstimatesPage";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { PERMISSIONS } from "@/types/rbac";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState, useEffect } from "react";

export default function EstimatesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    showNewEstimateForm,
    selectedEstimate,
    showPreview,
    isEditing,
    currentTab,
    filteredEstimates,
    setCurrentTab,
    handleEditEstimate,
    handleOpenPreview,
    handleStatusChange,
    handleQuickStatusChange,
    handleGoToScheduling,
    handleCreateNewEstimate,
    handleCloseForm,
    handleClosePreview
  } = useEstimatesPage();

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div 
          className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6"
          style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
        >
          <LoadingSpinner text="Loading estimates..." fullScreen={false} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6"
      >
          <EstimatesHeader 
            onNewEstimate={handleCreateNewEstimate}
            canCreate={true}
          />
          
          <EstimatesTabs
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            filteredEstimates={filteredEstimates}
            onEdit={handleEditEstimate}
            onPreview={handleOpenPreview}
            onStatusChange={handleQuickStatusChange}
            onGoToScheduling={handleGoToScheduling}
            onNewEstimate={handleCreateNewEstimate}
          />

          <PermissionGuard permission={PERMISSIONS.ESTIMATES_CREATE}>
            <EstimateForm
              open={showNewEstimateForm}
              onClose={handleCloseForm}
              editingEstimate={isEditing ? selectedEstimate : null}
            />
          </PermissionGuard>

          {selectedEstimate && (
            <EstimatePreview
              open={showPreview}
              onClose={handleClosePreview}
              estimate={selectedEstimate}
              onStatusChange={handleStatusChange}
            />
          )}
      </div>
    </Layout>
  );
}
