
import { UseFormRegister, FormState, UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EventFormValues } from "@/hooks/scheduling/useCreateEventModal";

interface TeamRequirementsFormProps {
  register: UseFormRegister<EventFormValues>;
  errors: FormState<EventFormValues>['errors'];
  setValue: UseFormSetValue<EventFormValues>;
}

export function TeamRequirementsForm({ 
  register, 
  errors 
}: TeamRequirementsFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0">
          <Label htmlFor="photographersCount" className="text-sm sm:text-base">Number of Photographers</Label>
          <Input
            id="photographersCount"
            type="number"
            min="0"
            {...register("photographersCount", { valueAsNumber: true })}
            className="w-full"
          />
          {errors.photographersCount && (
            <p className="text-xs sm:text-sm text-destructive">{errors.photographersCount.message}</p>
          )}
        </div>
        
        <div className="space-y-2 min-w-0">
          <Label htmlFor="videographersCount" className="text-sm sm:text-base">Number of Videographers</Label>
          <Input
            id="videographersCount"
            type="number"
            min="0"
            {...register("videographersCount", { valueAsNumber: true })}
            className="w-full"
          />
          {errors.videographersCount && (
            <p className="text-xs sm:text-sm text-destructive">{errors.videographersCount.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="clientRequirements" className="text-sm sm:text-base">Client Requirements</Label>
        <Input
          id="clientRequirements"
          {...register("clientRequirements")}
          placeholder="Special requests or requirements"
          className="w-full"
        />
      </div>
    </>
  );
}
