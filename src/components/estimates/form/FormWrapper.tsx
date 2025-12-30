
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  currentPage?: number;
  onPrevious?: () => void;
  hideBackButton?: boolean; // Hide back button when estimate is saved
}

export function FormWrapper({ open, onClose, title, children, currentPage = 0, onPrevious, hideBackButton = false }: FormWrapperProps) {
  const showPreviousButton = currentPage > 0 && onPrevious && !hideBackButton;
  const isEstimatesPage = currentPage === 2;
  const isPreviewPage = currentPage === 5;
  
  // Wider width for Estimates page to match inner content width
  // Even wider for Preview page to show full estimate
  // For other pages, use default responsive width
  let dialogWidthClass: string;
  let dialogHeightClass: string;
  
  if (isPreviewPage) {
    // Preview page: wider and taller to show full estimate
    dialogWidthClass = "w-[calc(100vw-2rem)] max-w-6xl";
    dialogHeightClass = "max-h-[95vh] overflow-y-auto";
  } else if (isEstimatesPage) {
    dialogWidthClass = "w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)]";
    dialogHeightClass = "max-h-[90vh] overflow-y-auto";
  } else {
    dialogWidthClass = "w-full max-w-lg sm:max-w-lg";
    dialogHeightClass = "max-h-[90vh] overflow-y-auto";
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`${dialogWidthClass} ${dialogHeightClass}`}
        style={{ backgroundColor: '#1a0f3d' }}
      >
        <DialogHeader className="relative">
          {showPreviousButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              className="absolute left-0 top-0 text-white hover:bg-white/10"
              title="Previous page"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <DialogTitle className="text-white text-center">New Estimate</DialogTitle>
        </DialogHeader>
        <div 
          className="space-y-6 p-4 rounded-lg" 
          style={{ backgroundColor: '#1a0f3d' }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
