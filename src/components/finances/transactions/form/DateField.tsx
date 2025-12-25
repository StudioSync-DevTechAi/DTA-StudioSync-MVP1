
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormValues } from "./FormSchema";

interface DateFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

export function DateField({ form }: DateFieldProps) {
  return (
    <FormField
      control={form.control}
      name="transaction_date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Transaction Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className="w-full pl-3 text-left font-normal text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span className="text-gray-400">Select a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 bg-[#2d1b4e] border-[#3d2a5f]" 
              align="start"
              style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
            >
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
