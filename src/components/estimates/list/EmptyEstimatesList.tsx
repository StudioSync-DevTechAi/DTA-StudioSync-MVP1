
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyEstimatesListProps {
  currentTab: string;
  onNewEstimate: () => void;
}

export function EmptyEstimatesList({ currentTab, onNewEstimate }: EmptyEstimatesListProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-4 xs:p-6 sm:p-8 border-2 border-dashed rounded-lg"
      style={{ 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        backgroundColor: 'rgba(45, 27, 78, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <FileText className="h-6 w-6 xs:h-8 xs:w-8 text-white/70 mb-3 xs:mb-4" />
      <h3 className="text-base xs:text-lg sm:text-xl font-medium text-white mb-2 text-center px-2" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
        No {currentTab} estimates
      </h3>
      <p className="text-xs xs:text-sm text-white/80 text-center mb-3 xs:mb-4 px-2" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
        {currentTab === "pending" ? 
          "Create a new estimate or wait for client responses." :
          currentTab === "approved" ? 
          "Approved estimates will appear here." :
          "Declined estimates will appear here."}
      </p>
      {currentTab === "pending" && (
        <Button onClick={onNewEstimate} className="text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-3 xs:px-4 sm:px-6">
          <Plus className="h-3 w-3 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
          Create Estimate
        </Button>
      )}
    </div>
  );
}
