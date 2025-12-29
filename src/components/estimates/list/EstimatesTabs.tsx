
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EstimateCard } from "../list/EstimateCard";
import { EmptyEstimatesList } from "../list/EmptyEstimatesList";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface EstimatesTabsProps {
  currentTab: string;
  onTabChange: (value: string) => void;
  filteredEstimates: any[];
  tabCounts?: {
    pending: number;
    approved: number;
    declined: number;
  };
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
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
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onPreview,
  onStatusChange,
  onGoToScheduling,
  onNewEstimate
}: EstimatesTabsProps) {
  // Calculate which 5 page numbers to show
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  return (
    <Tabs defaultValue="pending" value={currentTab} onValueChange={onTabChange}>
      <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-5 md:mb-6 gap-2 sm:gap-4 flex-wrap">
        <TabsList 
          className="bg-white/10 border-white/20 w-full sm:w-auto flex-wrap sm:flex-nowrap h-auto sm:h-10"
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

      {/* Pagination - only show if more than 1 page */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8 sm:h-9 sm:w-9 text-white border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(page)}
              className={`h-8 w-8 sm:h-9 sm:w-9 text-sm font-medium ${
                currentPage === page
                  ? "bg-white/20 text-white border-white/30"
                  : "text-white border-white/20 hover:bg-white/10"
              }`}
              style={
                currentPage === page
                  ? { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }
              }
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 sm:h-9 sm:w-9 text-white border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      </div>

      <TabsContent value={currentTab} className="space-y-3 xs:space-y-4 sm:space-y-5">
        {filteredEstimates.length > 0 ? (
          (() => {
            // Paginate: show only 10 cards per page
            const itemsPerPage = 10;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedEstimates = filteredEstimates.slice(startIndex, endIndex);
            
            return paginatedEstimates.map((estimate) => (
              <EstimateCard
                key={estimate.id}
                estimate={estimate}
                onEdit={onEdit}
                onPreview={onPreview}
                onStatusChange={onStatusChange}
                onGoToScheduling={onGoToScheduling}
              />
            ));
          })()
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
