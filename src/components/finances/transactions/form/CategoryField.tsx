
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormValues } from "./FormSchema";
import { FinanceCategory } from "@/hooks/finances/api/financeApi";

interface CategoryFieldProps {
  form: UseFormReturn<TransactionFormValues>;
  filteredCategories: FinanceCategory[];
}

export function CategoryField({ form, filteredCategories }: CategoryFieldProps) {
  return (
    <FormField
      control={form.control}
      name="category_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Category</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger 
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#2d1b4e] border-[#3d2a5f]">
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="text-white hover:bg-white/10">
                  {category.name}
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
