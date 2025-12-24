
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    if (lowerCase.includes('photo')) return "bg-blue-600 text-white";
    if (lowerCase.includes('video') || lowerCase.includes('cinemat') || lowerCase.includes('film')) return "bg-purple-600 text-white";
    if (lowerCase.includes('album') || lowerCase.includes('book')) return "bg-amber-600 text-white";
    return "bg-gray-600 text-white";
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
        <h3 className="text-lg font-medium text-white">Deliverables</h3>
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
        <p className="text-sm text-gray-300">No deliverables added yet. Add deliverables to be included in the estimate.</p>
      ) : (
        <div className="space-y-2">
          {deliverables.map((deliverable, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Textarea
                value={deliverable}
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder="Enter deliverable (e.g., Photos, Videos, Album)"
                className="flex-1 min-w-0 text-white placeholder:text-gray-400 resize-none"
                style={{ 
                  backgroundColor: '#2d1b4e', 
                  borderColor: '#3d2a5f', 
                  color: '#ffffff', 
                  minWidth: '300px',
                  minHeight: '40px',
                  maxHeight: '200px'
                }}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <Input
                type="text"
                value={deliverableAmounts[index] || ''}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="₹0"
                className="w-24 text-white placeholder:text-gray-400 flex-shrink-0"
                style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
              />
              <Badge 
                variant="secondary" 
                className={`${getDeliverableBadgeColor(deliverable)} border-transparent flex-shrink-0`}
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
