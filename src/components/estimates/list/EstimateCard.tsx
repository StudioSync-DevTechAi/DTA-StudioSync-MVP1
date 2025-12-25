
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
      className="rounded-lg border bg-card text-card-foreground shadow-sm p-6"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>{estimate.clientName}</h3>
          {estimate.clientPhNo && (
            <p className="text-sm text-white mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              PhNo: {estimate.clientPhNo}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
            <span>Created: {new Date(estimate.date).toLocaleDateString()}</span>
            <span>Amount: {estimate.amount}</span>
            {estimate.selectedPackageIndex !== undefined && estimate.packages && (
              <span>Selected Package: {estimate.packages[estimate.selectedPackageIndex]?.name || 
                `Option ${estimate.selectedPackageIndex + 1}`}</span>
            )}
            <span className={`capitalize px-2 py-1 rounded-full text-xs ${
              estimate.status === "approved" ? "bg-green-600 text-white" :
              estimate.status === "declined" ? "bg-red-600 text-white" :
              estimate.status === "negotiating" ? "bg-yellow-600 text-white" :
              "bg-gray-600 text-white"
            }`}>
              {estimate.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => onPreview(estimate)}
            className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          
          {(estimate.status === "pending" || estimate.status === "negotiating") && (
            <>
              <Button 
                variant="outline"
                onClick={() => onEdit(estimate)}
                className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
                style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-green-500/50 hover:bg-green-600/20"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.5)' }}
                onClick={() => onStatusChange(estimate.id, "approved")}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                className="text-white border-red-500/50 hover:bg-red-600/20"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)' }}
                onClick={() => onStatusChange(estimate.id, "declined")}
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </>
          )}
          
          {estimate.status === "approved" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
                >
                  Next Steps
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
