
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstimateCard } from "../list/EstimateCard";
import { EmptyEstimatesList } from "../list/EmptyEstimatesList";

interface EstimatesTabsProps {
  currentTab: string;
  onTabChange: (value: string) => void;
  filteredEstimates: any[];
  tabCounts?: {
    pending: number;
    approved: number;
    declined: number;
  };
  onEdit: (estimate: any) => void;
  onPreview: (estimate: any) => void;
  onStatusChange: (estimateId: string, newStatus: string) => void;
  onGoToScheduling: (estimateId: string) => void;
  onNewEstimate: () => void;
}

export function EstimatesTabs({
  currentTab,
  onTabChange,
  filteredEstimates,
  tabCounts = { pending: 0, approved: 0, declined: 0 },
  onEdit,
  onPreview,
  onStatusChange,
  onGoToScheduling,
  onNewEstimate
}: EstimatesTabsProps) {
  return (
    <Tabs defaultValue="pending" value={currentTab} onValueChange={onTabChange}>
      <TabsList 
        className="mb-3 xs:mb-4 sm:mb-5 md:mb-6 bg-white/10 border-white/20 w-full sm:w-auto flex-wrap sm:flex-nowrap h-auto sm:h-10"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
      >
        <TabsTrigger 
          value="pending"
          className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-1.5 flex-1 sm:flex-initial"
        >
          Pending
          {tabCounts.pending > 0 && (
            <span className="ml-1.5 xs:ml-2 px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-semibold bg-white/20 text-white">
              {tabCounts.pending}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="approved"
          className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-1.5 flex-1 sm:flex-initial"
        >
          Approved
          {tabCounts.approved > 0 && (
            <span className="ml-1.5 xs:ml-2 px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-semibold bg-white/20 text-white">
              {tabCounts.approved}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="declined"
          className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-1.5 flex-1 sm:flex-initial"
        >
          Declined
          {tabCounts.declined > 0 && (
            <span className="ml-1.5 xs:ml-2 px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-semibold bg-white/20 text-white">
              {tabCounts.declined}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={currentTab} className="space-y-3 xs:space-y-4 sm:space-y-5">
        {filteredEstimates.length > 0 ? (
          filteredEstimates.map((estimate) => (
            <EstimateCard
              key={estimate.id}
              estimate={estimate}
              onEdit={onEdit}
              onPreview={onPreview}
              onStatusChange={onStatusChange}
              onGoToScheduling={onGoToScheduling}
            />
          ))
        ) : (
          <EmptyEstimatesList 
            currentTab={currentTab} 
            onNewEstimate={onNewEstimate} 
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
