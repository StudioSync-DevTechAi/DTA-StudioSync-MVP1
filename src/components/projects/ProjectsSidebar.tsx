import { cn } from "@/lib/utils";
import { FolderKanban, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProjectsSidebarProps {
  className?: string;
}

export function ProjectsSidebar({ className }: ProjectsSidebarProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("w-64 bg-card border-r p-4 flex flex-col", className)}>
      <div className="space-y-4 flex-1">
        <div>
          <h2 className="text-lg font-semibold mb-4">Studio Success System</h2>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground">
              <FolderKanban className="h-4 w-4" />
              <span className="text-sm font-medium">Projects</span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/estimates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Estimates
        </Button>
      </div>
    </div>
  );
}

