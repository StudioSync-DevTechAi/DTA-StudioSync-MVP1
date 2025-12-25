
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormValues } from "./FormSchema";

interface AmountFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

export function AmountField({ form }: AmountFieldProps) {
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Amount</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              placeholder="Enter amount" 
              {...field}
              step="0.01"
              className="text-white placeholder:text-gray-400"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
