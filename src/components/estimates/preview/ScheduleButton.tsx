
import { Button } from "@/components/ui/button";

interface ScheduleButtonProps {
  isApproved: boolean;
  onSchedule: () => void;
}

export function ScheduleButton({ isApproved, onSchedule }: ScheduleButtonProps) {
  if (!isApproved) return null;
  
  return (
    <div className="mt-6 flex justify-center">
      <Button 
        className="w-full max-w-md text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        onClick={onSchedule}
      >
        Schedule Events From This Estimate
      </Button>
    </div>
  );
}
