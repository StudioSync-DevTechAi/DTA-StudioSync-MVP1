import { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface DraftProject {
  id: string;
  projectName: string;
  projectType?: string;
  currentPage: number;
  lastModified: string;
  hasProjectEstimateUuid: boolean; // Whether it's been saved to database
}

export function DraftsBox() {
  const [drafts, setDrafts] = useState<DraftProject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Load drafts from sessionStorage
  useEffect(() => {
    const loadDrafts = () => {
      try {
        const allDrafts: DraftProject[] = [];
        
        // Check for current draft in sessionStorage
        const savedFormData = sessionStorage.getItem("newProjectFormData");
        const savedCurrentPage = sessionStorage.getItem("newProjectCurrentPage");
        const savedProjectName = sessionStorage.getItem("newProjectName");
        const savedProjectType = sessionStorage.getItem("newProjectType");
        const savedProjectEstimateUuid = sessionStorage.getItem("newProjectEstimateUuid");
        const savedLastModified = sessionStorage.getItem("newProjectLastModified");

        if (savedFormData && savedCurrentPage) {
          // Parse form data to get project name
          const formData = JSON.parse(savedFormData);
          const projectName = savedProjectName || formData.projectName || "Untitled Project";
          
          allDrafts.push({
            id: savedProjectEstimateUuid || `draft-${Date.now()}`,
            projectName,
            projectType: savedProjectType || formData.projectType || undefined,
            currentPage: parseInt(savedCurrentPage, 10) || 1,
            lastModified: savedLastModified || new Date().toISOString(),
            hasProjectEstimateUuid: !!savedProjectEstimateUuid
          });
        }

        // TODO: Load additional drafts from sessionStorage or database
        // For now, we only show the current active draft
        
        setDrafts(allDrafts);
      } catch (error) {
        console.error("Error loading drafts:", error);
      }
    };

    loadDrafts();
    
    // Listen for storage changes (when user saves/updates draft)
    const handleStorageChange = () => {
      loadDrafts();
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadDrafts, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDraftClick = (draft: DraftProject) => {
    // Navigate to the draft project
    if (draft.hasProjectEstimateUuid) {
      navigate(`/estimates/projects/new?draft=${draft.id}`);
    } else {
      navigate("/estimates/projects/new");
    }
    setIsOpen(false);
  };

  const handleDeleteDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clear sessionStorage for this draft
    if (draftId.startsWith("draft-") || !draftId.includes("project_estimate_uuid")) {
      // It's a local draft, clear sessionStorage
      sessionStorage.removeItem("newProjectFormData");
      sessionStorage.removeItem("newProjectCurrentPage");
      sessionStorage.removeItem("newProjectEventPackages");
      sessionStorage.removeItem("newProjectSelectedFormat");
      sessionStorage.removeItem("newProjectName");
      sessionStorage.removeItem("newProjectType");
      sessionStorage.removeItem("newProjectLastModified");
    }
    
    // TODO: Delete from database if it has project_estimate_uuid
    
    // Reload drafts
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  };

  const draftCount = drafts.length;
  const unfinishedCount = drafts.filter(d => d.currentPage < 3 || !d.hasProjectEstimateUuid).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative flex items-center gap-2 px-4 py-2 h-auto"
        >
          <FileText className="h-4 w-4" />
          <span className="font-medium">Drafts</span>
          {draftCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-1 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
            >
              {unfinishedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Unfinished Projects</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {draftCount === 0 
              ? "No drafts found" 
              : `${unfinishedCount} project${unfinishedCount !== 1 ? 's' : ''} not completed`
            }
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {draftCount === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No unfinished projects</p>
              <p className="text-xs mt-1">Start a new project to see drafts here</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {drafts.map((draft) => (
                <Card
                  key={draft.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleDraftClick(draft)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {draft.projectName}
                          </h4>
                          {draft.hasProjectEstimateUuid && (
                            <Badge variant="secondary" className="text-xs">
                              Saved
                            </Badge>
                          )}
                        </div>
                        {draft.projectType && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {draft.projectType}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(draft.lastModified), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <span>•</span>
                          <span>Page {draft.currentPage} of 3</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

