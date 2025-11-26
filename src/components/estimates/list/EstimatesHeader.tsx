
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
}

export function EstimatesHeader({ onNewEstimate, canCreate = true, showActions = true }: EstimatesHeaderProps) {
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate("/estimates/projects/new");
  };

  const handleHeaderClick = () => {
    navigate("/estimates");
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-4">
          <h1 
            className="text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleHeaderClick}
          >
            Estimates
          </h1>
          <DraftsBox />
        </div>
        <p className="text-sm text-muted-foreground">
          Create and manage your photography service estimates.
        </p>
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <PermissionGuard permission={PERMISSIONS.ESTIMATES_CREATE}>
            <Button onClick={onNewEstimate}>
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </PermissionGuard>
        </div>
      )}
    </div>
  );
}
