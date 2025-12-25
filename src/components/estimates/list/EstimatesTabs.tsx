
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstimateCard } from "../list/EstimateCard";
import { EmptyEstimatesList } from "../list/EmptyEstimatesList";

interface EstimatesTabsProps {
  currentTab: string;
  onTabChange: (value: string) => void;
  filteredEstimates: any[];
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
  onEdit,
  onPreview,
  onStatusChange,
  onGoToScheduling,
  onNewEstimate
}: EstimatesTabsProps) {
  return (
    <Tabs defaultValue="pending" value={currentTab} onValueChange={onTabChange}>
      <TabsList 
        className="mb-4 bg-white/10 border-white/20"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
      >
        <TabsTrigger 
          value="pending"
          className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
        >
          Pending
        </TabsTrigger>
        <TabsTrigger 
          value="approved"
          className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
        >
          Approved
        </TabsTrigger>
        <TabsTrigger 
          value="declined"
          className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
        >
          Declined
        </TabsTrigger>
      </TabsList>

      <TabsContent value={currentTab} className="space-y-4">
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
