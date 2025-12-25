
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormValues } from "./FormSchema";
import { FinanceSubcategory } from "@/hooks/finances/api/types";

interface SubcategoryFieldProps {
  form: UseFormReturn<TransactionFormValues>;
  subcategories: FinanceSubcategory[];
}

export function SubcategoryField({ form, subcategories }: SubcategoryFieldProps) {
  if (subcategories.length === 0) {
    return null;
  }
  
  return (
    <FormField
      control={form.control}
      name="subcategory_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Subcategory</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || "none"}
          >
            <FormControl>
              <SelectTrigger 
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <SelectValue placeholder="Select subcategory (optional)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#2d1b4e] border-[#3d2a5f]">
              <SelectItem value="none" className="text-white hover:bg-white/10">None</SelectItem>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id} className="text-white hover:bg-white/10">
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
