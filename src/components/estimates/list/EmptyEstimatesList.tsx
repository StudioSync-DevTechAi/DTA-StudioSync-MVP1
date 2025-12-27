
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyEstimatesListProps {
  currentTab: string;
  onNewEstimate: () => void;
}

export function EmptyEstimatesList({ currentTab, onNewEstimate }: EmptyEstimatesListProps) {
  return (
    <div 
      className="rounded-lg bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center p-8 relative border-2 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400/60 hover:scale-[1.02]"
      style={{ backgroundColor: 'transparent', borderColor: 'rgb(255, 255, 255)', borderWidth: '2px', borderStyle: 'solid' }}
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
