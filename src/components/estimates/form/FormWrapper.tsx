
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReactNode } from "react";

interface FormWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function FormWrapper({ open, onClose, title, children }: FormWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#1a0f3d' }}
      >
        <DialogHeader>
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
