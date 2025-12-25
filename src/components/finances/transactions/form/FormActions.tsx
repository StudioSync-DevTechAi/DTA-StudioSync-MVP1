
import React from "react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export function FormActions({ onCancel, isSubmitting, isEditing }: FormActionsProps) {
  return (
    <div className="flex gap-2 justify-end">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel} 
        disabled={isSubmitting}
        className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        {isSubmitting ? "Saving..." : isEditing ? "Update" : "Record"} Transaction
      </Button>
    </div>
  );
}
