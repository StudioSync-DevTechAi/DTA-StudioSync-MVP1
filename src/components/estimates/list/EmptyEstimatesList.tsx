
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyEstimatesListProps {
  currentTab: string;
  onNewEstimate: () => void;
}

export function EmptyEstimatesList({ currentTab, onNewEstimate }: EmptyEstimatesListProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-lg bg-white/5">
      <FileText className="h-8 w-8 text-white/70 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">
        No {currentTab} estimates
      </h3>
      <p className="text-sm text-white/80 text-center mb-4">
        {currentTab === "pending" ? 
          "Create a new estimate or wait for client responses." :
          currentTab === "approved" ? 
          "Approved estimates will appear here." :
          "Declined estimates will appear here."}
      </p>
      {currentTab === "pending" && (
        <Button onClick={onNewEstimate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Estimate
        </Button>
      )}
    </div>
  );
}
