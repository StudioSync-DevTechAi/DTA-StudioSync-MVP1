
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { Service, EVENT_OPTIONS } from "../types";
import { useToast } from "@/components/ui/use-toast";

interface ServiceCardProps {
  service: Service;
  onUpdate: (field: keyof Service, value: string) => void;
  onRemove: () => void;
}

export function ServiceCard({ service, onUpdate, onRemove }: ServiceCardProps) {
  const { toast } = useToast();
  
  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const currentDate = new Date();
    
    // Remove time part for comparison
    currentDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < currentDate) {
      toast({
        title: "Invalid date",
        description: "Cannot select a past date for events",
        variant: "destructive",
      });
      return;
    }
    
    onUpdate("date", e.target.value);
  };

  return (
    <Card className="p-4 relative" style={{ backgroundColor: '#1a0f3d', borderColor: '#3d2a5f' }}>
      <div className="absolute right-2 top-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Event</Label>
          <Select
            value={service.event}
            onValueChange={(value) => onUpdate("event", value)}
          >
            <SelectTrigger className="text-white placeholder:text-gray-400" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}>
              <SelectValue placeholder="Select event" className="text-white" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
              {EVENT_OPTIONS.map((event) => (
                <SelectItem key={event} value={event} className="text-white hover:bg-[#1a0f3d]">
                  {event}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Date</Label>
          <Input
            type="date"
            value={service.date}
            min={today}
            onChange={handleDateChange}
            className="text-white"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Number of Photographers</Label>
          <Input
            type="number"
            min="0"
            value={service.photographers}
            onChange={(e) => onUpdate("photographers", e.target.value)}
            placeholder="Enter number of photographers"
            className="text-white placeholder:text-gray-400"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Number of Cinematographers</Label>
          <Input
            type="number"
            min="0"
            value={service.cinematographers}
            onChange={(e) => onUpdate("cinematographers", e.target.value)}
            placeholder="Enter number of cinematographers"
            className="text-white placeholder:text-gray-400"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          />
        </div>
      </div>
    </Card>
  );
}
