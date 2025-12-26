
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
              onChange={(e) => onAmountChange(e.target.value)}
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
              onChange={(e) => onPaidAmountChange(e.target.value)}
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
