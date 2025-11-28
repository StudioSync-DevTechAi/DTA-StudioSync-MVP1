
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
}

export function EstimatesHeader({ 
  onNewEstimate, 
  canCreate = true, 
  showActions = true,
  title = "Estimates",
  headerNavigationPath = "/estimates",
  description = "Create and manage your photography service estimates."
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
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <h1 
            className="text-xl sm:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleHeaderClick}
          >
            {title}
          </h1>
          <DraftsBox />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
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
