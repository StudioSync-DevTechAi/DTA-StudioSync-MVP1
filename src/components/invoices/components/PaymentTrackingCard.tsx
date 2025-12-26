
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentTrackingCardProps {
  amount: string;
  onAmountChange: (value: string) => void;
  paidAmount: string;
  onPaidAmountChange: (value: string) => void;
  balanceAmount: string;
  notes: string;
  onNotesChange: (value: string) => void;
}

export function PaymentTrackingCard({
  amount,
  onAmountChange,
  paidAmount,
  onPaidAmountChange,
  balanceAmount,
  notes,
  onNotesChange
}: PaymentTrackingCardProps) {
  // Handler to ensure ₹ symbol is always present and cannot be deleted
  const handleAmountChange = (value: string, onChange: (value: string) => void) => {
    // Remove all ₹ symbols first
    let cleaned = value.replace(/₹/g, '');
    
    // If user tries to delete everything, keep ₹0.00
    if (cleaned.trim() === '' || cleaned === '0' || cleaned === '0.') {
      onChange('₹0.00');
      return;
    }
    
    // Remove any non-numeric characters except decimal point
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Always prepend ₹ symbol
    onChange('₹' + cleaned);
  };

  // Handler for paid amount with ₹ symbol protection
  const handlePaidAmountChange = (value: string) => {
    handleAmountChange(value, onPaidAmountChange);
  };

  // Handler for total amount with ₹ symbol protection
  const handleTotalAmountChange = (value: string) => {
    handleAmountChange(value, onAmountChange);
  };

  return (
    <Card 
      className="p-4"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <h3 className="font-medium mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Payment Tracking</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalAmount" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Total Amount</Label>
            <Input 
              id="totalAmount" 
              value={amount}
              onFocus={(e) => {
                // Position cursor in the integer part (at end of integer digits)
                const input = e.target as HTMLInputElement;
                const value = input.value;
                
                if (value.includes('.')) {
                  const decimalIndex = value.indexOf('.');
                  // Position cursor at end of integer part (just before decimal)
                  setTimeout(() => {
                    input.setSelectionRange(decimalIndex, decimalIndex);
                  }, 0);
                } else {
                  // If no decimal, position at end (after all digits)
                  setTimeout(() => {
                    input.setSelectionRange(value.length, value.length);
                  }, 0);
                }
              }}
              onClick={(e) => {
                // Position cursor in the integer part when clicking
                const input = e.target as HTMLInputElement;
                const value = input.value;
                
                if (value.includes('.')) {
                  const decimalIndex = value.indexOf('.');
                  // Position cursor at end of integer part (just before decimal)
                  setTimeout(() => {
                    input.setSelectionRange(decimalIndex, decimalIndex);
                  }, 0);
                } else {
                  // If no decimal, position at end (after all digits)
                  setTimeout(() => {
                    input.setSelectionRange(value.length, value.length);
                  }, 0);
                }
              }}
              onChange={(e) => {
                const cursorPosition = e.target.selectionStart || 0;
                handleTotalAmountChange(e.target.value);
                
                // Restore cursor position in integer part
                setTimeout(() => {
                  const input = e.target as HTMLInputElement;
                  const newValue = input.value;
                  if (newValue.includes('.')) {
                    const decimalIndex = newValue.indexOf('.');
                    input.setSelectionRange(decimalIndex, decimalIndex);
                  } else {
                    input.setSelectionRange(newValue.length, newValue.length);
                  }
                }, 0);
              }}
              onKeyDown={(e) => {
                // Prevent deletion if only ₹ symbol remains
                if (e.key === 'Backspace' && amount === '₹') {
                  e.preventDefault();
                }
              }}
              placeholder="₹0.00"
              className="text-white placeholder:text-gray-400 text-center"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidAmount" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Paid Amount</Label>
            <Input 
              id="paidAmount" 
              value={paidAmount}
              onFocus={(e) => {
                // Position cursor in the integer part (at end of integer digits)
                const input = e.target as HTMLInputElement;
                const value = input.value;
                
                if (value.includes('.')) {
                  const decimalIndex = value.indexOf('.');
                  // Position cursor at end of integer part (just before decimal)
                  setTimeout(() => {
                    input.setSelectionRange(decimalIndex, decimalIndex);
                  }, 0);
                } else {
                  // If no decimal, position at end (after all digits)
                  setTimeout(() => {
                    input.setSelectionRange(value.length, value.length);
                  }, 0);
                }
              }}
              onClick={(e) => {
                // Position cursor in the integer part when clicking
                const input = e.target as HTMLInputElement;
                const value = input.value;
                
                if (value.includes('.')) {
                  const decimalIndex = value.indexOf('.');
                  // Position cursor at end of integer part (just before decimal)
                  setTimeout(() => {
                    input.setSelectionRange(decimalIndex, decimalIndex);
                  }, 0);
                } else {
                  // If no decimal, position at end (after all digits)
                  setTimeout(() => {
                    input.setSelectionRange(value.length, value.length);
                  }, 0);
                }
              }}
              onChange={(e) => {
                handlePaidAmountChange(e.target.value);
                
                // Restore cursor position in integer part
                setTimeout(() => {
                  const input = e.target as HTMLInputElement;
                  const newValue = input.value;
                  if (newValue.includes('.')) {
                    const decimalIndex = newValue.indexOf('.');
                    input.setSelectionRange(decimalIndex, decimalIndex);
                  } else {
                    input.setSelectionRange(newValue.length, newValue.length);
                  }
                }, 0);
              }}
              onKeyDown={(e) => {
                // Prevent deletion if only ₹ symbol remains
                if (e.key === 'Backspace' && paidAmount === '₹') {
                  e.preventDefault();
                }
              }}
              placeholder="₹0.00"
              className="text-white placeholder:text-gray-400 text-center"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balanceAmount" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Balance</Label>
            <Input 
              id="balanceAmount" 
              value={balanceAmount}
              readOnly
              placeholder="₹0.00"
              className="text-white text-center placeholder:text-gray-400"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Additional notes about payment"
            className="text-white placeholder:text-gray-400"
            style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          />
        </div>
      </div>
    </Card>
  );
}
