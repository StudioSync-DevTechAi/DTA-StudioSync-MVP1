
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  onStatusChange: (estimateId: string, newStatus: string, options?: { isProjectRequested?: boolean; isInvoiceRequested?: boolean }) => void;
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
  const [newProject, setNewProject] = useState(false);
  const [newInvoice, setNewInvoice] = useState(false);

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
          <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 mt-2 text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
            <span className="whitespace-nowrap">Created: {new Date(estimate.date).toLocaleDateString()}</span>
            <span className="whitespace-nowrap">Amount: {estimate.amount}</span>
            {estimate.selectedPackageIndex !== undefined && estimate.packages && (
              <span className="hidden md:inline whitespace-nowrap">Selected Package: {estimate.packages[estimate.selectedPackageIndex]?.name || 
                `Option ${estimate.selectedPackageIndex + 1}`}</span>
            )}
            <span className={`capitalize px-1.5 xs:px-2 sm:px-2.5 py-0.5 xs:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 ${
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
          {(estimate.status === "pending" || estimate.status === "negotiating") ? (
            <>
              <div className="flex flex-col items-center gap-1.5 w-full sm:w-auto">
                {/* Approve with checkboxes - positioned above Edit and Approve buttons, centered */}
                <div className="flex flex-col xs:flex-row items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 text-[10px] xs:text-xs sm:text-sm text-white/80 -mt-2 mb-0.5 w-full px-1">
                  <span className="whitespace-nowrap">Approve with:</span>
                  <div className="flex flex-col xs:flex-row items-center xs:items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
                    <div className="flex items-center gap-1 xs:gap-1.5">
                      <Checkbox
                        id={`new-project-${estimate.id}`}
                        checked={newProject}
                        onCheckedChange={(checked) => setNewProject(checked === true)}
                        className="rounded-none border-white/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`new-project-${estimate.id}`}
                        className="text-[10px] xs:text-xs sm:text-sm text-white/90 cursor-pointer whitespace-nowrap"
                        style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}
                      >
                        New Project
                      </Label>
                    </div>
                    <div className="flex items-center gap-1 xs:gap-1.5">
                      <Checkbox
                        id={`new-invoice-${estimate.id}`}
                        checked={newInvoice}
                        onCheckedChange={(checked) => setNewInvoice(checked === true)}
                        className="rounded-none border-white/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`new-invoice-${estimate.id}`}
                        className="text-[10px] xs:text-xs sm:text-sm text-white/90 cursor-pointer whitespace-nowrap"
                        style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}
                      >
                        New Invoice
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons row - View, Edit, Approve, Decline */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 xs:gap-2 sm:flex-nowrap sm:gap-2 w-full">
                  <Button 
                    variant="outline"
                    onClick={() => onPreview(estimate)}
                    className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                    style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                  >
                    <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                    <span className="hidden xs:inline">View</span>
                  </Button>
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
                    onClick={() => {
                      // Handle approve with checkboxes
                      onStatusChange(estimate.id, "approved", {
                        isProjectRequested: newProject,
                        isInvoiceRequested: newInvoice
                      });
                      // Reset checkboxes after approval
                      setNewProject(false);
                      setNewInvoice(false);
                    }}
                  >
                    <Check className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Approve</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-white border-red-500/50 hover:bg-red-600/20 text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      opacity: (newProject || newInvoice) ? 0.5 : 1
                    }}
                    onClick={() => onStatusChange(estimate.id, "declined")}
                    disabled={newProject || newInvoice}
                  >
                    <X className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Decline</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={() => onPreview(estimate)}
                className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-8 xs:h-9 sm:h-10 px-2 xs:px-3 sm:px-4"
                style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              >
                <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">View</span>
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
