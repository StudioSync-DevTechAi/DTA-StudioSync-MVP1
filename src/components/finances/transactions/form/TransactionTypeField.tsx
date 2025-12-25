
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormValues } from "./FormSchema";

interface TransactionTypeFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

export function TransactionTypeField({ form }: TransactionTypeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="transaction_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Transaction Type</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger 
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#2d1b4e] border-[#3d2a5f]">
              <SelectItem value="income" className="text-white hover:bg-white/10">Income</SelectItem>
              <SelectItem value="expense" className="text-white hover:bg-white/10">Expense</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
