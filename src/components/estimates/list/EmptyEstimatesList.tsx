
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyEstimatesListProps {
  currentTab: string;
  onNewEstimate: () => void;
}

export function EmptyEstimatesList({ currentTab, onNewEstimate }: EmptyEstimatesListProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg"
      style={{ 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        backgroundColor: 'rgba(45, 27, 78, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <FileText className="h-8 w-8 text-white/70 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
        No {currentTab} estimates
      </h3>
      <p className="text-sm text-white/80 text-center mb-4" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
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
