
import Layout from "@/components/Layout";
import { EstimatesHeader } from "@/components/estimates/list/EstimatesHeader";
import { EstimatesTabs } from "@/components/estimates/list/EstimatesTabs";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { EstimatePreview } from "@/components/estimates/EstimatePreview";
import { useEstimatesPage } from "@/hooks/estimates/useEstimatesPage";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { PERMISSIONS } from "@/types/rbac";

export default function EstimatesPage() {
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

  return (
    <Layout>
      <div className="space-y-6">
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
