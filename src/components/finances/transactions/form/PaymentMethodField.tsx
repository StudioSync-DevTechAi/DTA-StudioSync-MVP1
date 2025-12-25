
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TransactionFormValues } from "./FormSchema";

interface PaymentMethodFieldProps {
  form: UseFormReturn<TransactionFormValues>;
}

export function PaymentMethodField({ form }: PaymentMethodFieldProps) {
  return (
    <FormField
      control={form.control}
      name="payment_method"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Method</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value || "none"}
          >
            <FormControl>
              <SelectTrigger 
                className="text-white placeholder:text-gray-400"
                style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <SelectValue placeholder="Select payment method (optional)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#2d1b4e] border-[#3d2a5f]">
              <SelectItem value="none" className="text-white hover:bg-white/10">None</SelectItem>
              <SelectItem value="cash" className="text-white hover:bg-white/10">Cash</SelectItem>
              <SelectItem value="bank_transfer" className="text-white hover:bg-white/10">Bank Transfer</SelectItem>
              <SelectItem value="upi" className="text-white hover:bg-white/10">UPI</SelectItem>
              <SelectItem value="credit_card" className="text-white hover:bg-white/10">Credit Card</SelectItem>
              <SelectItem value="debit_card" className="text-white hover:bg-white/10">Debit Card</SelectItem>
              <SelectItem value="cheque" className="text-white hover:bg-white/10">Cheque</SelectItem>
              <SelectItem value="online_payment" className="text-white hover:bg-white/10">Online Payment</SelectItem>
              <SelectItem value="paypal" className="text-white hover:bg-white/10">PayPal</SelectItem>
              <SelectItem value="venmo" className="text-white hover:bg-white/10">Venmo</SelectItem>
              <SelectItem value="stripe" className="text-white hover:bg-white/10">Stripe</SelectItem>
              <SelectItem value="other" className="text-white hover:bg-white/10">Other</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
