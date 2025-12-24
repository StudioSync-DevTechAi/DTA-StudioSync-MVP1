
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Estimate, Service } from "../types";
import { ServiceCard } from "./ServiceCard";
import { Deliverables } from "./Deliverables";
import { useState, useEffect } from "react";

interface EstimateCardProps {
  estimate: Estimate;
  index: number;
  onServiceAdd: () => void;
  onServiceUpdate: (serviceIndex: number, field: keyof Service, value: string) => void;
  onServiceRemove: (serviceIndex: number) => void;
  onDeliverableAdd: () => void;
  onDeliverableUpdate: (deliverableIndex: number, value: string) => void;
  onDeliverableRemove: (deliverableIndex: number) => void;
  onTotalUpdate: (total: string) => void;
  onNameUpdate?: (name: string) => void; // Add handler for name updates
  onPackageDelete?: () => void;
}

export function EstimateCard({
  estimate,
  index,
  onServiceAdd,
  onServiceUpdate,
  onServiceRemove,
  onDeliverableAdd,
  onDeliverableUpdate,
  onDeliverableRemove,
  onTotalUpdate,
  onNameUpdate,
  onPackageDelete,
}: EstimateCardProps) {
  // Track amounts for each deliverable by index
  const [deliverableAmounts, setDeliverableAmounts] = useState<Record<number, string>>({});

  // Calculate total when deliverable amounts change
  useEffect(() => {
    const total = Object.values(deliverableAmounts).reduce((sum, amount) => {
      const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
      return sum + numAmount;
    }, 0);
    
    // Only update if total has changed to avoid infinite loops
    const formattedTotal = total.toFixed(2);
    if (estimate.total !== formattedTotal) {
      onTotalUpdate(formattedTotal);
    }
  }, [deliverableAmounts, estimate.total, onTotalUpdate]);

  // Clean up amounts when deliverables list length changes from external sources
  // (This is a safety net in case items are removed from outside this component)
  useEffect(() => {
    const maxIndex = estimate.deliverables.length - 1;
    setDeliverableAmounts(prevAmounts => {
      const newAmounts: Record<number, string> = {};
      Object.keys(prevAmounts).forEach(key => {
        const idx = parseInt(key);
        if (idx <= maxIndex) {
          newAmounts[idx] = prevAmounts[idx];
        }
      });
      return newAmounts;
    });
  }, [estimate.deliverables.length]);

  const handleDeliverableAmountUpdate = (deliverableIndex: number, amount: string) => {
    setDeliverableAmounts(prev => ({
      ...prev,
      [deliverableIndex]: amount
    }));
  };

  const handleDeliverableRemove = (deliverableIndex: number) => {
    // Remove the amount for this index and reindex the remaining amounts
    const newAmounts: Record<number, string> = {};
    Object.keys(deliverableAmounts).forEach(key => {
      const idx = parseInt(key);
      if (idx < deliverableIndex) {
        // Keep amounts before the removed index
        newAmounts[idx] = deliverableAmounts[idx];
      } else if (idx > deliverableIndex) {
        // Shift amounts after the removed index down by 1
        newAmounts[idx - 1] = deliverableAmounts[idx];
      }
      // Skip the amount at deliverableIndex (it's being removed)
    });
    setDeliverableAmounts(newAmounts);
    onDeliverableRemove(deliverableIndex);
  };

  return (
    <div className="space-y-4 pt-6 border-t">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Input
            value={estimate.name || ""}
            onChange={(e) => onNameUpdate && onNameUpdate(e.target.value)}
            className="text-lg font-medium border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
            placeholder={`PACKAGE OPTION ${index + 1}`}
          />
        </div>
        {onPackageDelete && (
          <Button variant="ghost" size="sm" onClick={onPackageDelete} className="text-red-500 h-8">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Package
          </Button>
        )}
      </div>
      
      <div className="space-y-6">
        {estimate.services.map((service, serviceIndex) => (
          <ServiceCard
            key={serviceIndex}
            service={service}
            onUpdate={(field, value) => onServiceUpdate(serviceIndex, field, value)}
            onRemove={() => onServiceRemove(serviceIndex)}
          />
        ))}
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={onServiceAdd}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>

        <Deliverables
          deliverables={estimate.deliverables}
          deliverableAmounts={deliverableAmounts}
          onAdd={onDeliverableAdd}
          onUpdate={onDeliverableUpdate}
          onUpdateAmount={handleDeliverableAmountUpdate}
          onRemove={handleDeliverableRemove}
        />

        <div className="flex justify-end gap-2 items-center pt-4 border-t">
          <Label>Total Amount:</Label>
          <Input
            value={estimate.total}
            onChange={(e) => onTotalUpdate(e.target.value)}
            className="w-32"
            placeholder="₹0.00"
          />
        </div>
      </div>
    </div>
  );
}
