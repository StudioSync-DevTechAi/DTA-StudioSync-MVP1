
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { PERMISSIONS } from "@/types/rbac";
import { useNavigate } from "react-router-dom";
import { DraftsBox } from "@/components/estimates/DraftsBox";

interface EstimatesHeaderProps {
  onNewEstimate: () => void;
  canCreate?: boolean;
  showActions?: boolean; // Control whether to show action buttons
  title?: string; // Optional title override
  headerNavigationPath?: string; // Optional navigation path for header click
  description?: string; // Optional description override
  showDashboardTitle?: boolean; // Show "Projects Dashboard" text on the right
  dashboardTitle?: string; // Custom dashboard title
  dashboardDescription?: string; // Custom dashboard description
}

export function EstimatesHeader({ 
  onNewEstimate, 
  canCreate = true, 
  showActions = true,
  title = "Estimates",
  headerNavigationPath = "/estimates",
  description = "Create and manage your photography service estimates.",
  showDashboardTitle = false,
  dashboardTitle = "Projects Dashboard",
  dashboardDescription = "Manage your photography projects"
}: EstimatesHeaderProps) {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/estimates/projects/new");
  };

  const handleHeaderClick = () => {
    navigate(headerNavigationPath);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1 flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2 sm:gap-4 w-full">
          <h1 
            className="text-xl sm:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity shrink-0 text-white"
            onClick={handleHeaderClick}
          >
            {title}
          </h1>
          <DraftsBox />
          {showDashboardTitle && (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  {dashboardTitle}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1">
                  {dashboardDescription}
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs sm:text-sm text-white/80">
          {description}
        </p>
      </div>
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleNewProject} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <PermissionGuard permission={PERMISSIONS.ESTIMATES_CREATE}>
            <Button onClick={onNewEstimate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </PermissionGuard>
        </div>
      )}
    </div>
  );
}
