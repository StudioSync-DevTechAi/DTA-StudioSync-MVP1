
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface PaymentFormProps {
  paymentDate: string;
  setPaymentDate: (date: string) => void;
  paymentAmount: string;
  handlePaymentAmountChange: (amount: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  collectedBy: string;
  setCollectedBy: (name: string) => void;
  amountError: string;
  maxAllowedPayment: number;
  handleSubmit: () => Promise<boolean>;
  onClose: () => void;
}

export function PaymentForm({
  paymentDate,
  setPaymentDate,
  paymentAmount,
  handlePaymentAmountChange,
  paymentMethod,
  setPaymentMethod,
  collectedBy,
  setCollectedBy,
  amountError,
  maxAllowedPayment,
  handleSubmit,
  onClose
}: PaymentFormProps) {
  const [displayAmount, setDisplayAmount] = useState("");

  // Format payment amount for display
  useEffect(() => {
    if (paymentAmount) {
      const numericValue = parseFloat(paymentAmount.replace(/[₹,]/g, ""));
      if (!isNaN(numericValue)) {
        setDisplayAmount(`₹${numericValue.toLocaleString('en-IN')}`);
      } else {
        setDisplayAmount(paymentAmount);
      }
    } else {
      setDisplayAmount("");
    }
  }, [paymentAmount]);

  // Handle input changes and format the currency
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Remove any non-numeric characters except dots
    const numericValue = value.replace(/[^0-9.]/g, "");
    
    // Only update if it's empty or a valid number
    if (numericValue === "" || !isNaN(parseFloat(numericValue))) {
      handlePaymentAmountChange(numericValue);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex flex-row items-center justify-between gap-4">
        <Label htmlFor="paymentDate" className="text-white whitespace-nowrap" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          Payment Date
        </Label>
        <Input 
          id="paymentDate" 
          type="date" 
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="text-white w-48 text-center [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:[filter:invert(1)_brightness(1.5)] [&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-datetime-edit-text]:text-center [&::-webkit-datetime-edit-month-field]:text-center [&::-webkit-datetime-edit-day-field]:text-center [&::-webkit-datetime-edit-year-field]:text-center [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center [&::-webkit-datetime-edit]:w-full"
          style={{ 
            backgroundColor: 'rgba(45, 27, 78, 0.95)', 
            borderColor: '#5a4a7a', 
            borderWidth: '1.5px', 
            borderStyle: 'solid', 
            textAlign: 'center',
            paddingLeft: '2.5rem',
            paddingRight: '2.5rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </div>
      
      <div className="flex flex-row items-center justify-between gap-4">
        <Label htmlFor="paymentAmount" className="text-white h-10 flex flex-col justify-center" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          <span>Amount</span>
          <span>Max: ₹{maxAllowedPayment.toLocaleString('en-IN')}</span>
        </Label>
        <div className="flex flex-col">
          <Input 
            id="paymentAmount" 
            type="text" 
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder="₹0.00"
            className={`text-white placeholder:text-gray-400 w-48 text-center ${amountError ? "border-red-500" : ""}`}
            style={{ 
              backgroundColor: 'rgba(45, 27, 78, 0.95)', 
              borderColor: amountError ? '#ef4444' : '#5a4a7a', 
              borderWidth: '1.5px', 
              borderStyle: 'solid',
              textAlign: 'center'
            }}
          />
          {amountError && (
            <p className="text-red-400 text-sm mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
              {amountError}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex flex-row items-center justify-between gap-4">
        <Label htmlFor="paymentMethod" className="text-white whitespace-nowrap" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          Payment Mode
        </Label>
        <Select 
          value={paymentMethod} 
          onValueChange={setPaymentMethod}
        >
          <SelectTrigger 
            id="paymentMethod"
            className="text-white w-48 [&>svg]:absolute [&>svg]:left-[calc(100%-3rem)]"
            style={{ 
              backgroundColor: 'rgba(45, 27, 78, 0.95)', 
              borderColor: '#5a4a7a', 
              borderWidth: '1.5px', 
              borderStyle: 'solid',
              justifyContent: 'center',
            }}
          >
            <SelectValue 
              placeholder="Select payment method" 
              className="text-center"
              style={{ 
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                paddingRight: '3rem'
              }}
            />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
            <SelectItem 
              value="cash" 
              className="text-white hover:bg-[#1a0f3d] text-center justify-center"
              style={{ textAlign: 'center', justifyContent: 'center' }}
            >
              Cash
            </SelectItem>
            <SelectItem 
              value="bank" 
              className="text-white hover:bg-[#1a0f3d] text-center justify-center"
              style={{ textAlign: 'center', justifyContent: 'center' }}
            >
              Bank Transfer
            </SelectItem>
            <SelectItem 
              value="upi" 
              className="text-white hover:bg-[#1a0f3d] text-center justify-center"
              style={{ textAlign: 'center', justifyContent: 'center' }}
            >
              UPI
            </SelectItem>
            <SelectItem 
              value="card" 
              className="text-white hover:bg-[#1a0f3d] text-center justify-center"
              style={{ textAlign: 'center', justifyContent: 'center' }}
            >
              Card
            </SelectItem>
            <SelectItem 
              value="cheque" 
              className="text-white hover:bg-[#1a0f3d] text-center justify-center"
              style={{ textAlign: 'center', justifyContent: 'center' }}
            >
              Cheque
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-row items-center justify-between gap-4">
        <Label htmlFor="collectedBy" className="text-white whitespace-nowrap" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          Collected By
        </Label>
        <Input 
          id="collectedBy" 
          type="text" 
          value={collectedBy}
          onChange={(e) => setCollectedBy(e.target.value)}
          placeholder="Staff name"
          className="text-white placeholder:text-gray-400 w-48 text-center"
          style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}
        />
      </div>
      
      <div className="pt-4 flex justify-center gap-4">
        <Button 
          variant="outline" 
          type="button" 
          onClick={onClose}
          className="text-white hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', borderWidth: '1.5px', borderStyle: 'solid' }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!!amountError}
          className="text-white hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
        >
          Record Payment
        </Button>
      </div>
    </form>
  );
}
