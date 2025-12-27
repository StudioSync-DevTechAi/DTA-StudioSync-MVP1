
import { useState, useEffect } from "react";
import { Invoice, InvoicePayment } from "@/components/invoices/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentRecord } from "@/components/invoices/components/PaymentHistory";

interface InvoicePaymentData {
  invoiceId: string;
  clientName: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  description?: string;
}

type RecordPaymentFn = (paymentData: InvoicePaymentData) => Promise<any>;

export const useRecordPayment = (
  invoice: Invoice, 
  onSave: (invoice: Invoice) => void, 
  onClose: () => void,
  recordPaymentAsTransaction?: RecordPaymentFn
) => {
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<string>(
    Math.max(0, parseFloat(invoice.balanceAmount)).toFixed(2)
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [collectedBy, setCollectedBy] = useState<string>("self");
  const [amountError, setAmountError] = useState<string>("");
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  const maxAllowedPayment = parseFloat(invoice.balanceAmount);

  // Fetch payment history from invoice_items_table
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('invoice_items_table')
          .select('payment_history')
          .eq('invoice_uuid', invoice.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Error fetching payment history:", error);
          return;
        }

        if (data && data.payment_history) {
          const history = Array.isArray(data.payment_history) 
            ? data.payment_history as PaymentRecord[]
            : [];
          setPaymentHistory(history);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };

    fetchPaymentHistory();
  }, [invoice.id]);

  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value);

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setAmountError("Please enter a valid amount");
    } else if (numValue <= 0) {
      setAmountError("Amount must be greater than zero");
    } else if (numValue > maxAllowedPayment) {
      setAmountError(`Amount cannot exceed the remaining balance (${maxAllowedPayment})`);
    } else {
      setAmountError("");
    }
  };

  const handleSubmit = async () => {
    try {
      const amount = parseFloat(paymentAmount);
      
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid payment amount");
        return false;
      }
      
      if (amount > maxAllowedPayment) {
        toast.error(`Payment amount cannot exceed the remaining balance (${maxAllowedPayment})`);
        return false;
      }

      // Update the invoice's payment history
      const paymentId = crypto.randomUUID();
      const payment: InvoicePayment = {
        id: paymentId,
        date: paymentDate,
        amount: amount,
        method: paymentMethod,
        collected_by: collectedBy
      };

      const existingPayments = invoice.payments || [];
      const updatedPayments = [...existingPayments, payment];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const invoiceAmount = parseFloat(invoice.amount);
      const newBalance = invoiceAmount - totalPaid;
      const newStatus = newBalance <= 0 ? "paid" : "partial";

      // Check if invoice exists in invoice_items_table
      const { data: invoiceData, error: checkError } = await supabase
        .from('invoice_items_table')
        .select('invoice_uuid, invoice_form_data')
        .eq('invoice_uuid', invoice.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking invoice:", checkError);
        toast.error("Failed to verify invoice");
        return false;
      }

      if (!invoiceData) {
        toast.error("Invoice not found. Please create the invoice first.");
        return false;
      }

      // Update invoice form data with new payment information
      const currentFormData = invoiceData.invoice_form_data || {};
      const currentPaymentTracking = currentFormData.paymentTracking || {};
      
      const updatedFormData = {
        ...currentFormData,
        paymentTracking: {
          ...currentPaymentTracking,
          totalAmount: invoice.amount,
          paidAmount: totalPaid.toString(),
          balanceAmount: newBalance.toString(),
          notes: currentPaymentTracking.notes || ""
        },
        payments: updatedPayments.map(p => ({
          id: p.id,
          date: p.date,
          amount: p.amount,
          method: p.method,
          collected_by: p.collected_by
        }))
      };

      // Update invoice_items_table with payment information
      const { error: updateError } = await supabase
        .from('invoice_items_table')
        .update({
          invoice_form_data: updatedFormData,
          invoice_status: newStatus === 'paid' ? 'paid' : newStatus === 'partial' ? 'sent' : 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('invoice_uuid', invoice.id);

      if (updateError) {
        console.error("Error updating invoice:", updateError);
        toast.error("Failed to update invoice");
        return false;
      }

      // Save payment form data and history to invoice_items_table
      const paymentFormData = {
        paymentDate,
        paymentAmount: amount.toString(),
        paymentMethod,
        collectedBy
      };

      const { data: paymentData, error: paymentError } = await supabase
        .rpc('save_payment_data', {
          p_invoice_uuid: invoice.id,
          p_payment_form_data: paymentFormData
        });

      if (paymentError) {
        console.error("Error saving payment form data:", paymentError);
        toast.error(`Failed to save payment data: ${paymentError.message}`);
        // Payment was already saved to invoice_items_table, so we continue
      } else if (paymentData) {
        if (paymentData.success && paymentData.payment_history) {
          // Update payment history state
          const history = Array.isArray(paymentData.payment_history) 
            ? paymentData.payment_history as PaymentRecord[]
            : [];
          setPaymentHistory(history);
        } else if (!paymentData.success) {
          // RPC returned but with success: false
          console.error("Payment data save failed:", paymentData.error);
          toast.error(`Failed to save payment data: ${paymentData.error || 'Unknown error'}`);
        }
      }

      // If we have a transaction recorder function, use it
      if (recordPaymentAsTransaction) {
        const paymentData: InvoicePaymentData = {
          invoiceId: invoice.id,
          clientName: invoice.client,
          amount: amount,
          paymentDate,
          paymentMethod,
          description: `Payment for Invoice #${invoice.displayNumber || invoice.id.slice(0, 8)}`
        };
        
        await recordPaymentAsTransaction(paymentData);
      }

      // Fetch updated invoice from invoice_items_table
      const { data: updatedInvoiceData, error: fetchError } = await supabase
        .from('invoice_items_table')
        .select('*')
        .eq('invoice_uuid', invoice.id)
        .single();

      if (fetchError) {
        console.error("Error fetching updated invoice:", fetchError);
        // Use the invoice data we have, but with updated payment info
        const updatedInvoice: Invoice = {
          ...invoice,
          paidAmount: totalPaid.toString(),
          balanceAmount: newBalance.toString(),
          status: newStatus,
          payments: updatedPayments
        };
        toast.success("Payment recorded successfully");
        onSave(updatedInvoice);
        onClose();
        return true;
      }

      // Map the updated invoice data to our Invoice format
      const formData = updatedInvoiceData.invoice_form_data || {};
      const clientDetails = formData.clientDetails || {};
      const paymentTracking = formData.paymentTracking || {};
      const totals = formData.totals || {};
      
      const updatedInvoice: Invoice = {
        id: updatedInvoiceData.invoice_uuid,
        displayNumber: updatedInvoiceData.invoice_number,
        client: clientDetails.name || invoice.client,
        clientEmail: clientDetails.email || invoice.clientEmail,
        date: updatedInvoiceData.invoice_date || invoice.date,
        amount: paymentTracking.totalAmount || invoice.amount,
        paidAmount: paymentTracking.paidAmount || totalPaid.toString(),
        balanceAmount: paymentTracking.balanceAmount || newBalance.toString(),
        status: updatedInvoiceData.invoice_status === 'paid' ? 'paid' : 
                updatedInvoiceData.invoice_status === 'sent' ? 'partial' : 'pending',
        items: formData.invoiceItems || invoice.items,
        estimateId: updatedInvoiceData.project_estimate_uuid || invoice.estimateId,
        notes: paymentTracking.notes || invoice.notes,
        paymentDate: formData.paymentDetails?.paymentDate || invoice.paymentDate,
        paymentMethod: formData.paymentDetails?.paymentMethod || invoice.paymentMethod,
        gstRate: totals.gstRate || invoice.gstRate,
        payments: Array.isArray(formData.payments) 
          ? formData.payments.map((p: any) => ({
              id: p.id,
              date: p.date,
              amount: Number(p.amount),
              method: p.method,
              collected_by: p.collected_by
            } as InvoicePayment))
          : updatedPayments
      };

      toast.success("Payment recorded successfully");
      onSave(updatedInvoice);
      onClose();
      return true;
    } catch (error) {
      console.error("Error in payment submission:", error);
      toast.error("An error occurred while recording the payment");
      return false;
    }
  };

  return {
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
    paymentHistory
  };
};
