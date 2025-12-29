
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";

interface ApprovalFormProps {
  onClose: () => void;
  estimate: {
    id: string;
    amount: string;
    packages?: Array<{
      name?: string;
      amount: string;
      services: any[];
      deliverables?: string[];
    }>;
    deliverables?: string[];
  };
  onStatusChange: (estimateId: string, newStatus: string, negotiatedAmountOrOptions?: string | { isProjectRequested?: boolean; isInvoiceRequested?: boolean }, selectedPackageIndex?: number) => void;
  initialOptions?: { isProjectRequested?: boolean; isInvoiceRequested?: boolean };
}

export function ApprovalForm({ onClose, estimate, onStatusChange, initialOptions }: ApprovalFormProps) {
  const [isNegotiated, setIsNegotiated] = useState(false);
  const [negotiatedAmount, setNegotiatedAmount] = useState(estimate.amount);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | undefined>(
    estimate.packages && estimate.packages.length > 0 ? 0 : undefined
  );
  const [newProject, setNewProject] = useState(initialOptions?.isProjectRequested || false);
  const [newInvoice, setNewInvoice] = useState(initialOptions?.isInvoiceRequested || false);
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      // Prevent approval if packages exist but none is selected
      if (estimate.packages && estimate.packages.length > 0 && selectedPackageIndex === undefined) {
        toast({
          title: "Package Selection Required",
          description: "Please select a package before approving the estimate.",
          variant: "destructive"
        });
        return;
      }
  
      console.log("Approving estimate with details:", {
        estimateId: estimate.id,
        negotiatedAmount: isNegotiated ? negotiatedAmount : undefined,
        selectedPackageIndex,
        // Log deliverables for selected package if available
        deliverables: selectedPackageIndex !== undefined && estimate.packages 
          ? estimate.packages[selectedPackageIndex].deliverables
          : estimate.deliverables
      });
      
      // Update the status with the selected package index and checkbox options
      onStatusChange(
        estimate.id, 
        'approved', 
        {
          isProjectRequested: newProject,
          isInvoiceRequested: newInvoice
        },
        selectedPackageIndex
      );
      
      // Show success toast
      toast({
        title: "Estimate Approved",
        description: selectedPackageIndex !== undefined 
          ? `Package Option ${selectedPackageIndex + 1} has been approved.` 
          : "The estimate has been approved."
      });
      
      onClose();
    } catch (error) {
      console.error("Error approving estimate:", error);
      toast({
        title: "Error",
        description: "Failed to approve the estimate. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Only show package selection if there are packages
  const showPackageSelector = estimate.packages && estimate.packages.length > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
      >
        <DialogHeader>
          <DialogTitle className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Approve Estimate</DialogTitle>
          <DialogDescription className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            Mark this estimate as approved by the client. 
            {showPackageSelector && " Please select which package option the client has approved."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {showPackageSelector && (
            <div className="space-y-3">
              <Label className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Select approved package option</Label>
              <RadioGroup 
                value={selectedPackageIndex?.toString()} 
                onValueChange={(value) => setSelectedPackageIndex(parseInt(value))}
              >
                {estimate.packages?.map((pkg, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 py-2 border rounded-md px-3"
                    style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', borderWidth: '1.5px', borderStyle: 'solid' }}
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`package-${index}`}
                      className="border-[#5a4a7a] text-white"
                      style={{ borderColor: '#5a4a7a', borderWidth: '1.5px', borderStyle: 'solid' }}
                    />
                    <Label htmlFor={`package-${index}`} className="flex-1 cursor-pointer text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                      <div className="flex justify-between w-full">
                        <span>Package Option {index + 1} {pkg.name ? `- ${pkg.name}` : ''}</span>
                        <span className="font-semibold">{pkg.amount}</span>
                      </div>
                      {pkg.deliverables && pkg.deliverables.length > 0 && (
                        <div className="text-xs text-white/70 mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                          Deliverables: {pkg.deliverables.join(', ')}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <div className="flex h-5 items-center">
              <input
                id="negotiated"
                type="checkbox"
                className="h-4 w-4 rounded"
                style={{ borderColor: '#5a4a7a', borderWidth: '1.5px', borderStyle: 'solid', backgroundColor: 'rgba(45, 27, 78, 0.95)' }}
                checked={isNegotiated}
                onChange={(e) => setIsNegotiated(e.target.checked)}
              />
            </div>
            <div className="ml-2 text-sm">
              <Label htmlFor="negotiated" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client negotiated a different amount</Label>
            </div>
          </div>
          
          {isNegotiated && (
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Negotiated Amount</Label>
              <Input
                id="amount"
                type="text"
                value={negotiatedAmount}
                onChange={(e) => setNegotiatedAmount(e.target.value)}
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
              />
            </div>
          )}

          {/* Approve with checkboxes */}
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: '#3d2a5f' }}>
            <Label className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Approve with:</Label>
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="approve-new-project"
                  checked={newProject}
                  onCheckedChange={(checked) => setNewProject(checked === true)}
                  className="rounded-none border-white/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-4 w-4"
                />
                <Label 
                  htmlFor="approve-new-project"
                  className="text-sm text-white/90 cursor-pointer"
                  style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}
                >
                  New Project
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="approve-new-invoice"
                  checked={newInvoice}
                  onCheckedChange={(checked) => setNewInvoice(checked === true)}
                  className="rounded-none border-white/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-4 w-4"
                />
                <Label 
                  htmlFor="approve-new-invoice"
                  className="text-sm text-white/90 cursor-pointer"
                  style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}
                >
                  New Invoice
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={showPackageSelector && selectedPackageIndex === undefined}
            className="text-white hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          >
            Approve Estimate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
