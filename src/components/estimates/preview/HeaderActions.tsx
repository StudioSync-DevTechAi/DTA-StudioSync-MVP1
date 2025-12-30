
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Share2, FileText } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface HeaderActionsProps {
  onShowEmailForm: () => void;
  onShowWhatsAppForm: () => void;
  onShowApprovalForm: () => void;
  isApproved: boolean;
  onCreateInvoice?: () => void;
  estimateId?: string;
  hasPackages?: boolean; // Whether the estimate has multiple packages that need selection
  onStatusChange?: (estimateId: string, newStatus: string, options?: { isProjectRequested?: boolean; isInvoiceRequested?: boolean }) => void;
  initialOptions?: { isProjectRequested?: boolean; isInvoiceRequested?: boolean }; // Initial checkbox state from EstimateCard
}

export function HeaderActions({ 
  onShowEmailForm, 
  onShowWhatsAppForm, 
  onShowApprovalForm,
  isApproved,
  onCreateInvoice,
  estimateId,
  hasPackages,
  onStatusChange,
  initialOptions
}: HeaderActionsProps) {
  // Initialize checkbox state from initialOptions if provided (from EstimateCard)
  const [newProject, setNewProject] = useState(initialOptions?.isProjectRequested || false);
  const [newInvoice, setNewInvoice] = useState(initialOptions?.isInvoiceRequested || false);

  const handleApprove = () => {
    // If there are packages, show approval form for package selection
    // Otherwise, directly approve with checkbox options
    if (hasPackages) {
      onShowApprovalForm();
    } else if (onStatusChange && estimateId) {
      onStatusChange(estimateId, "approved", {
        isProjectRequested: newProject,
        isInvoiceRequested: newInvoice
      });
      // Reset checkboxes after approval
      setNewProject(false);
      setNewInvoice(false);
    } else {
      onShowApprovalForm();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isApproved && (
        <>
          {/* Approve with checkboxes - positioned to the left of Approve button */}
          <div className="flex flex-col xs:flex-row items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 text-[10px] xs:text-xs sm:text-sm text-white/80">
            <span className="whitespace-nowrap">Approve with:</span>
            <div className="flex flex-col xs:flex-row items-center xs:items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-1 xs:gap-1.5">
                <Checkbox
                  id={`new-project-header-${estimateId || 'default'}`}
                  checked={newProject}
                  onCheckedChange={(checked) => setNewProject(checked === true)}
                  className="rounded-none border-white/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0"
                />
                <Label 
                  htmlFor={`new-project-header-${estimateId || 'default'}`}
                  className="text-[10px] xs:text-xs sm:text-sm text-white/90 cursor-pointer whitespace-nowrap"
                  style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}
                >
                  New Project
                </Label>
              </div>
              <div className="flex items-center gap-1 xs:gap-1.5">
                <Checkbox
                  id={`new-invoice-header-${estimateId || 'default'}`}
                  checked={newInvoice}
                  onCheckedChange={(checked) => setNewInvoice(checked === true)}
                  className="rounded-none border-white/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0"
                />
                <Label 
                  htmlFor={`new-invoice-header-${estimateId || 'default'}`}
                  className="text-[10px] xs:text-xs sm:text-sm text-white/90 cursor-pointer whitespace-nowrap"
                  style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}
                >
                  New Invoice
                </Label>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleApprove}
            disabled={false}
            className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          >
            Approve
          </Button>
        </>
      )}
      
      <Button 
        onClick={onShowEmailForm} 
        variant="outline" 
        size="icon"
        className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        <Mail className="h-4 w-4" />
      </Button>
      
      <Button 
        onClick={onShowWhatsAppForm} 
        variant="outline" 
        size="icon"
        className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      
      {isApproved && onCreateInvoice && (
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
            align="end"
            className="bg-[#2d1b4e] border-[#3d2a5f]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
          >
            <DropdownMenuItem 
              onClick={onCreateInvoice}
              className="text-white hover:bg-white/10"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
