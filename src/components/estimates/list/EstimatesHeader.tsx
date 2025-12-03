
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { PERMISSIONS } from "@/types/rbac";
import { useNavigate } from "react-router-dom";
import { DraftsBox } from "@/components/estimates/DraftsBox";

interface EstimatesHeaderProps {
  onNewEstimate: () => void;
  onNewProject?: () => void; // Optional handler for New Project button
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
  onNewProject,
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
    if (onNewProject) {
      onNewProject();
    } else {
      navigate("/estimates/projects/new");
    }
  };

  const handleHeaderClick = () => {
    navigate(headerNavigationPath);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1 flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2 sm:gap-4 w-full">
          <h1 
            className="text-xl sm:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            onClick={handleHeaderClick}
          >
            {title}
          </h1>
          <DraftsBox />
          {showDashboardTitle && (
            <>
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    {dashboardTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {dashboardDescription}
                  </p>
                </div>
              </div>
              {onNewProject && (
                <Button 
                  variant="outline" 
                  onClick={handleNewProject}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}
            </>
          )}
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
