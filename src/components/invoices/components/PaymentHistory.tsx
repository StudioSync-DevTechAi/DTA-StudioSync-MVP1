import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { format } from "date-fns";

export interface PaymentRecord {
  payment_id: string;
  payment_date: string;
  payment_amount: string;
  payment_method: string;
  collected_by: string;
  timestamp: string;
}

interface PaymentHistoryProps {
  paymentHistory: PaymentRecord[];
}

export function PaymentHistory({ paymentHistory }: PaymentHistoryProps) {
  if (!paymentHistory || paymentHistory.length === 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
            title="Payment History"
          >
            <History className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 max-h-96 overflow-y-auto"
          style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
        >
          <div className="space-y-3">
            <h4 className="font-semibold text-white mb-3" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              Payment History
            </h4>
            <p className="text-sm text-white/70" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
              No payment history available
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
          title="Payment History"
        >
          <History className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 max-h-96 overflow-y-auto"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-white mb-3" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
            Payment History
            <span className="text-sm font-normal text-white/70 ml-2">
              ({paymentHistory.length} {paymentHistory.length === 1 ? 'payment' : 'payments'})
            </span>
          </h4>
          <div className="space-y-2">
            {paymentHistory
              .slice()
              .reverse()
              .map((payment, index) => (
                <div
                  key={payment.payment_id || index}
                  className="p-3 rounded-md border"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                      Payment #{paymentHistory.length - index}
                    </span>
                    <span className="text-xs text-white/70" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                      {format(new Date(payment.timestamp || payment.payment_date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Amount:</span>
                      <span className="text-white font-medium" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                        ₹{parseFloat(payment.payment_amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Method:</span>
                      <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {payment.payment_method?.charAt(0).toUpperCase() + payment.payment_method?.slice(1) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Collected By:</span>
                      <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {payment.collected_by || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>Date:</span>
                      <span className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

