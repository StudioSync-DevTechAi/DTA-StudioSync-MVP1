
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invoice } from "../types";
import { useRecordPayment } from "@/hooks/invoices/useRecordPayment";
import { PaymentForm } from "./PaymentForm";
import { useInvoicePaymentTransaction } from "@/hooks/finances/useInvoicePaymentTransaction";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  invoice: Invoice;
}

export function RecordPaymentDialog({ 
  open, 
  onClose, 
  onSave, 
  invoice 
}: RecordPaymentDialogProps) {
  const { recordPaymentAsTransaction } = useInvoicePaymentTransaction();
  
  const {
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
    handleSubmit
  } = useRecordPayment(invoice, onSave, onClose, recordPaymentAsTransaction);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-xs"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f', maxWidth: '360px' }}
      >
        <DialogHeader className="text-center relative">
          <DialogTitle className="text-white text-center absolute top-2 left-1/2 -translate-x-1/2" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
            Record Payment
          </DialogTitle>
          <DialogDescription className="text-white/80 text-left pt-10" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            <div className="flex flex-col space-y-1 items-start">
              <span>#Invoice: {invoice.displayNumber || invoice.id.slice(0, 8)}</span>
              <span>#Client: {invoice.client}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <PaymentForm
          paymentDate={paymentDate}
          setPaymentDate={setPaymentDate}
          paymentAmount={paymentAmount}
          handlePaymentAmountChange={handlePaymentAmountChange}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          collectedBy={collectedBy}
          setCollectedBy={setCollectedBy}
          amountError={amountError}
          maxAllowedPayment={maxAllowedPayment}
          handleSubmit={handleSubmit}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
