
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Check, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/invoices/useInvoices";
import { useToast } from "@/components/ui/use-toast";

interface EstimateCardProps {
  estimate: {
    id: string;
    clientName: string;
    date: string;
    amount: string;
    status: string;
    selectedPackageIndex?: number;
    packages?: Array<any>;
    clientEmail?: string;
    clientPhNo?: string;
  };
  onEdit: (estimate: any) => void;
  onPreview: (estimate: any) => void;
  onStatusChange: (estimateId: string, newStatus: string) => void;
  onGoToScheduling: (estimateId: string) => void;
}

export function EstimateCard({ 
  estimate, 
  onEdit, 
  onPreview, 
  onStatusChange,
  onGoToScheduling
}: EstimateCardProps) {
  const navigate = useNavigate();
  const { hasInvoiceForEstimate } = useInvoices();
  const { toast } = useToast();

  // Handle navigation to invoice page with estimate data
  const handleCreateInvoice = () => {
    // Check if an invoice already exists for this estimate
    if (hasInvoiceForEstimate(estimate.id)) {
      toast({
        title: "Invoice Already Exists",
        description: "An invoice has already been created for this estimate.",
        variant: "destructive"
      });
      return;
    }
    
    navigate("/invoices", { 
      state: { 
        fromEstimate: estimate 
      } 
    });
  };

  return (
    <Card 
      key={estimate.id} 
      className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 xs:p-4 sm:p-5 md:p-6"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base xs:text-lg sm:text-xl font-medium text-white truncate" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>{estimate.clientName}</h3>
          {estimate.clientPhNo && (
            <p className="text-xs xs:text-sm text-white mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              PhNo: {estimate.clientPhNo}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4 mt-2 text-[10px] xs:text-xs sm:text-sm text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
            <span className="whitespace-nowrap">Created: {new Date(estimate.date).toLocaleDateString()}</span>
            <span className="whitespace-nowrap">Amount: {estimate.amount}</span>
            {estimate.selectedPackageIndex !== undefined && estimate.packages && (
              <span className="hidden sm:inline whitespace-nowrap">Selected Package: {estimate.packages[estimate.selectedPackageIndex]?.name || 
                `Option ${estimate.selectedPackageIndex + 1}`}</span>
            )}
            <span className={`capitalize px-2 py-1 rounded-full text-[10px] xs:text-xs whitespace-nowrap ${
              estimate.status === "approved" ? "bg-green-600 text-white" :
              estimate.status === "declined" ? "bg-red-600 text-white" :
              estimate.status === "negotiating" ? "bg-yellow-600 text-white" :
              "bg-gray-600 text-white"
            }`}>
              {estimate.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
          <Button 
            variant="outline"
            onClick={() => onPreview(estimate)}
            className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">View</span>
          </Button>
          
          {(estimate.status === "pending" || estimate.status === "negotiating") && (
            <>
              <Button 
                variant="outline"
                onClick={() => onEdit(estimate)}
                className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              >
                <Edit className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Edit</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-green-500/50 hover:bg-green-600/20 text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.5)' }}
                onClick={() => onStatusChange(estimate.id, "approved")}
              >
                <Check className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Approve</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-red-500/50 hover:bg-red-600/20 text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)' }}
                onClick={() => onStatusChange(estimate.id, "declined")}
              >
                <X className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Decline</span>
              </Button>
            </>
          )}
          
          {estimate.status === "approved" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
                >
                  <span className="hidden xs:inline">Next Steps</span>
                  <span className="xs:hidden">Next</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-[#2d1b4e] border-[#3d2a5f]"
              >
                <DropdownMenuItem 
                  onClick={handleCreateInvoice}
                  className="text-white hover:bg-white/10"
                >
                  Create Invoice
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/pre-production")}
                  className="text-white hover:bg-white/10"
                >
                  Pre-Production Tasks
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onGoToScheduling(estimate.id)}
                  className="text-white hover:bg-white/10"
                >
                  Schedule Events
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
}
