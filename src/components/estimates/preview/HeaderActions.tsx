
import { Button } from "@/components/ui/button";
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
}

export function HeaderActions({ 
  onShowEmailForm, 
  onShowWhatsAppForm, 
  onShowApprovalForm,
  isApproved,
  onCreateInvoice
}: HeaderActionsProps) {
  return (
    <div className="flex gap-2">
      {!isApproved && (
        <Button 
          onClick={onShowApprovalForm} 
          className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        >
          Approve
        </Button>
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
