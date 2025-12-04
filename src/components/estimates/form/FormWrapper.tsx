
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
