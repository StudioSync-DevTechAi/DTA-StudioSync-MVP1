
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeliverablesProps {
  deliverables: string[];
  deliverableAmounts?: Record<number, string>;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onUpdateAmount?: (index: number, amount: string) => void;
  onRemove: (index: number) => void;
}

export function Deliverables({ 
  deliverables, 
  deliverableAmounts = {},
  onAdd, 
  onUpdate, 
  onUpdateAmount,
  onRemove 
}: DeliverablesProps) {
  // Function to determine the badge color based on deliverable type
  const getDeliverableBadgeColor = (deliverable: string) => {
    const lowerCase = deliverable.toLowerCase();
    if (lowerCase.includes('photo')) return "bg-blue-100 text-blue-800";
    if (lowerCase.includes('video') || lowerCase.includes('cinemat') || lowerCase.includes('film')) return "bg-purple-100 text-purple-800";
    if (lowerCase.includes('album') || lowerCase.includes('book')) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  const handleAmountChange = (index: number, value: string) => {
    if (onUpdateAmount) {
      // Allow only numbers, decimal point, and currency symbols
      const cleanedValue = value.replace(/[^0-9.]/g, '');
      onUpdateAmount(index, cleanedValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Deliverables</h3>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          size="sm"
          className="ml-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Deliverable
        </Button>
      </div>

      {deliverables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deliverables added yet. Add deliverables to be included in the estimate.</p>
      ) : (
        <div className="space-y-2">
          {deliverables.map((deliverable, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={deliverable}
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder="Enter deliverable (e.g., Photos, Videos, Album)"
                className="flex-1"
              />
              <Input
                type="text"
                value={deliverableAmounts[index] || ''}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="₹0"
                className="w-28"
              />
              <Badge 
                variant="secondary" 
                className={getDeliverableBadgeColor(deliverable)}
              >
                {deliverable.toLowerCase().includes('photo') ? 'Photos' : 
                  deliverable.toLowerCase().includes('video') || 
                  deliverable.toLowerCase().includes('film') || 
                  deliverable.toLowerCase().includes('cinemat') ? 'Videos' : 
                  deliverable.toLowerCase().includes('album') || 
                  deliverable.toLowerCase().includes('book') ? 'Album' : 'Other'}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
