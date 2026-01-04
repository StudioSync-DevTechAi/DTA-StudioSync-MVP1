import { useState, useEffect, useRef } from "react";
import { Invoice, InvoiceItem } from "@/components/invoices/types";
import { ClientDetailsFormState } from "@/components/invoices/types/formTypes";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Define validation schema
const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      amount: z.string().min(1, "Amount is required")
    })
  ).min(1, "At least one item is required"),
});

export function useInvoiceForm(editingInvoice?: Invoice | null, estimateData?: any) {
  const { user } = useAuth();
  
  // Client Details State
  const [clientDetails, setClientDetails] = useState<ClientDetailsFormState>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientGst: "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyGst: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: "proforma",
    paymentReceived: false,
    paymentDate: "",
    paymentMethod: "bank"
  });

  // Invoice Items & Calculation State
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", amount: "" }]);
  const [gstRate, setGstRate] = useState("18");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("₹0.00");
  const [balanceAmount, setBalanceAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pre-fill from estimate or editing invoice
  useEffect(() => {
    // Reset form when switching between invoices or closing
    if (!estimateData && !editingInvoice) {
      setClientDetails({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientAddress: "",
        clientGst: "",
        companyName: "",
        companyEmail: "",
        companyPhone: "",
        companyAddress: "",
        companyGst: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceType: "proforma",
        paymentReceived: false,
        paymentDate: "",
        paymentMethod: "bank"
      });
      setItems([{ description: "", amount: "" }]);
      setGstRate("18");
      setAmount("");
      setPaidAmount("₹0.00");
      setBalanceAmount("0");
      setNotes("");
      setValidationErrors({});
      return;
    }
    
    if (estimateData) {
      setClientDetails(prevState => ({
        ...prevState,
        clientName: estimateData.clientName || "",
        clientEmail: estimateData.clientEmail || "",
        clientPhone: estimateData.clientPhNo || estimateData.clientPhone || ""
      }));
      
      // Helper function to format amount with ₹ symbol
      const formatAmount = (amt: string | number | undefined): string => {
        if (!amt && amt !== 0) return "₹0.00";
        
        // Convert to string and remove any existing ₹ or commas
        let numValue: string;
        if (typeof amt === 'number') {
          numValue = amt.toString();
        } else {
          numValue = amt.replace(/[₹,]/g, "").trim();
        }
        
        // Check if it's a valid number
        if (numValue && !isNaN(parseFloat(numValue)) && parseFloat(numValue) >= 0) {
          // Format with ₹ and ensure 2 decimal places
          const parsed = parseFloat(numValue);
          return `₹${parsed.toFixed(2)}`;
        }
        
        return "₹0.00";
      };
      
      // Prioritize estimate's total amount over package amount
      const estimateAmount = estimateData.amount || estimateData.previewEstimate?.amount;
      const formattedEstimateAmount = formatAmount(estimateAmount);
      
      // Create items based on package selection or use estimate amount
      const selectedPackage = estimateData.packages && estimateData.packages[estimateData.selectedPackageIndex || 0];
      
      const newItems: InvoiceItem[] = [];
      
      if (selectedPackage) {
        // Add selected package as an item
        newItems.push({
          description: `Photography Package: ${selectedPackage.name || 'Option ' + (estimateData.selectedPackageIndex + 1)}`,
          amount: formattedEstimateAmount // Use estimate's total amount instead of package amount
        });
      } else if (estimateAmount) {
        // If no package but we have estimate amount, create a generic item
        newItems.push({
          description: "Photography Services",
          amount: formattedEstimateAmount
        });
      } else {
        // Fallback: empty item
        newItems.push({ description: "", amount: "" });
      }
      
      setItems(newItems);
      
      // Set the amount from estimate (this will auto-populate PaymentTrackingCard and TotalCard)
      if (formattedEstimateAmount && formattedEstimateAmount !== "₹0.00") {
        setAmount(formattedEstimateAmount);
        setBalanceAmount(formattedEstimateAmount);
      }
    } else if (editingInvoice) {
      // Fill form with editing invoice data
      // If invoice was loaded from database, it should have invoiceFormData
      const formData = editingInvoice.invoiceFormData;
      
      if (formData) {
        // Use form data from database (complete data)
        const clientDetails = formData.clientDetails || {};
        const companyDetails = formData.companyDetails || {};
        const paymentDetails = formData.paymentDetails || {};
        const paymentTracking = formData.paymentTracking || {};
        const totals = formData.totals || {};
        
        setClientDetails(prevState => ({
          ...prevState,
          clientName: clientDetails.name || "",
          clientEmail: clientDetails.email || "",
          clientPhone: clientDetails.phone || "",
          clientAddress: clientDetails.address || "",
          clientGst: clientDetails.gst || "",
          companyName: companyDetails.name || "",
          companyEmail: companyDetails.email || "",
          companyPhone: companyDetails.phone || "",
          companyAddress: companyDetails.address || "",
          companyGst: companyDetails.gst || "",
          invoiceDate: formData.invoiceDate || editingInvoice.date || new Date().toISOString().split('T')[0],
          invoiceType: formData.invoiceType || (editingInvoice.status === "pending" ? "proforma" : "paid"),
          paymentReceived: paymentDetails.paymentReceived || false,
          paymentDate: paymentDetails.paymentDate || "",
          paymentMethod: paymentDetails.paymentMethod || "bank"
        }));
        
        // Format invoice items - ensure amounts are properly formatted
        const invoiceItems = formData.invoiceItems || [];
        if (invoiceItems.length > 0) {
          setItems(invoiceItems.map((item: any) => {
            // If amount is a number, format it with ₹ symbol
            let formattedAmount = item.amount || "";
            if (formattedAmount && !formattedAmount.includes('₹')) {
              // If it's a plain number, add ₹ prefix
              formattedAmount = `₹${formattedAmount}`;
            }
            return {
              description: item.description || "",
              amount: formattedAmount
            };
          }));
        } else {
          setItems([{ description: "", amount: "" }]);
        }
        
        // Format amounts for display - handles numbers, strings with/without ₹
        const formatAmount = (amt: string | number | undefined) => {
          if (!amt && amt !== 0) return "";
          
          // Convert to string and remove any existing ₹ or commas
          let numValue: string;
          if (typeof amt === 'number') {
            numValue = amt.toString();
          } else {
            numValue = amt.replace(/[₹,]/g, "").trim();
          }
          
          // Check if it's a valid number
          if (numValue && !isNaN(parseFloat(numValue)) && parseFloat(numValue) >= 0) {
            // Format with ₹ and ensure 2 decimal places
            const parsed = parseFloat(numValue);
            return `₹${parsed.toFixed(2)}`;
          }
          
          // If not a valid number, return empty string or original if it already has ₹
          if (typeof amt === 'string' && amt.includes('₹')) {
            return amt;
          }
          return "";
        };
        
        setGstRate(totals.gstRate || formData.gstRate || "18");
        
        // Get raw values from form data
        const rawTotalAmount = paymentTracking.totalAmount || totals.total;
        const rawPaidAmount = paymentTracking.paidAmount;
        const rawBalanceAmount = paymentTracking.balanceAmount;
        
        // Format and set amounts
        setAmount(formatAmount(rawTotalAmount || editingInvoice.amount || "0"));
        setPaidAmount(formatAmount(rawPaidAmount || editingInvoice.paidAmount || "0"));
        setBalanceAmount(formatAmount(rawBalanceAmount || editingInvoice.balanceAmount || "0"));
        setNotes(paymentTracking.notes || editingInvoice.notes || "");
      } else {
        // Fallback: reconstruct from Invoice object (incomplete data)
        const isPaid = editingInvoice.status === "paid";
        
        // Format amounts helper - handles strings with/without ₹
        const formatAmount = (amt: string | undefined) => {
          if (!amt && amt !== "0") return "";
          
          // Remove any existing ₹ or commas
          const numValue = amt.replace(/[₹,]/g, "").trim();
          
          // Check if it's a valid number
          if (numValue && !isNaN(parseFloat(numValue)) && parseFloat(numValue) >= 0) {
            // Format with ₹ and ensure 2 decimal places
            const parsed = parseFloat(numValue);
            return `₹${parsed.toFixed(2)}`;
          }
          
          // If already has ₹, return as is
          if (amt.includes('₹')) {
            return amt;
          }
          return "";
        };
        
        setClientDetails(prevState => ({
          ...prevState,
          clientName: editingInvoice.client || "",
          clientEmail: editingInvoice.clientEmail || "",
          invoiceDate: editingInvoice.date || new Date().toISOString().split('T')[0],
          invoiceType: editingInvoice.status === "pending" ? "proforma" : "paid",
          paymentReceived: isPaid,
          paymentDate: editingInvoice.paymentDate || "",
          paymentMethod: editingInvoice.paymentMethod || "bank"
        }));
        
        // Format invoice items amounts
        setItems((editingInvoice.items || []).map(item => ({
          description: item.description || "",
          amount: formatAmount(item.amount)
        })));
        
        setGstRate(editingInvoice.gstRate || "18");
        setAmount(formatAmount(editingInvoice.amount));
        setPaidAmount(formatAmount(editingInvoice.paidAmount || "0"));
        // Calculate balance from amount and paidAmount if balanceAmount is not available
        const totalAmt = parseFloat((editingInvoice.amount || "0").replace(/[₹,]/g, "")) || 0;
        const paidAmt = parseFloat((editingInvoice.paidAmount || "0").replace(/[₹,]/g, "")) || 0;
        const balance = totalAmt - paidAmt;
        setBalanceAmount(formatAmount(editingInvoice.balanceAmount || `₹${Math.max(0, balance).toFixed(2)}`));
        setNotes(editingInvoice.notes || "");
      }
    }
  }, [estimateData, editingInvoice]);

  // Track previous calculated total to prevent unnecessary updates
  const prevCalculatedTotalRef = useRef<string>("");
  const isUpdatingAmountRef = useRef<boolean>(false);
  const itemsStringRef = useRef<string>("");
  const invoiceTypeRef = useRef<string>("");
  const gstRateRef = useRef<string>("");

  // Auto-update Total Amount when items change
  useEffect(() => {
    // Skip if we're already updating to prevent loops
    if (isUpdatingAmountRef.current) return;
    
    // Create a stable string representation of items to detect actual changes
    const itemsString = JSON.stringify(items.map(item => ({ 
      description: item.description, 
      amount: item.amount.replace(/[₹,]/g, "") 
    })));
    const currentInvoiceType = clientDetails.invoiceType;
    const currentGstRate = gstRate;
    
    // Only proceed if something actually changed
    if (
      itemsString === itemsStringRef.current &&
      currentInvoiceType === invoiceTypeRef.current &&
      currentGstRate === gstRateRef.current
    ) {
      return; // No changes, skip update
    }
    
    // Update refs
    itemsStringRef.current = itemsString;
    invoiceTypeRef.current = currentInvoiceType;
    gstRateRef.current = currentGstRate;
    
    if (items.length > 0 && items.some(item => item.amount && item.amount.trim() !== "")) {
      const calculatedTotal = calculateTotal();
      
      // Only update if the calculated total actually changed
      if (calculatedTotal && calculatedTotal !== "₹0.00" && calculatedTotal !== "" && calculatedTotal !== prevCalculatedTotalRef.current) {
        // Always update the amount to match the calculated total from items
        // This ensures PaymentTrackingCard's Total Amount stays in sync with invoice items
        isUpdatingAmountRef.current = true;
        setAmount(calculatedTotal);
        prevCalculatedTotalRef.current = calculatedTotal;
        // Reset flag after state update
        requestAnimationFrame(() => {
          isUpdatingAmountRef.current = false;
        });
      }
    } else if (items.length === 0 || !items.some(item => item.amount && item.amount.trim() !== "")) {
      // If no items or all items are empty, reset amount to ₹0.00
      if (amount !== "₹0.00") {
        isUpdatingAmountRef.current = true;
        setAmount("₹0.00");
        prevCalculatedTotalRef.current = "₹0.00";
        requestAnimationFrame(() => {
          isUpdatingAmountRef.current = false;
        });
      }
    }
  }, [items, clientDetails.invoiceType, gstRate]); // Note: amount is intentionally not in dependencies to avoid loops

  // Track previous balance to prevent unnecessary updates
  const prevBalanceRef = useRef<string>("");

  // Calculate balance whenever amount or paidAmount changes
  useEffect(() => {
    if (amount) {
      const total = parseFloat(amount.replace(/[₹,]/g, "")) || 0;
      const paid = parseFloat((paidAmount || "₹0.00").replace(/[₹,]/g, "")) || 0;
      const balance = Math.max(0, total - paid);
      const formattedBalance = `₹${balance.toFixed(2)}`;
      
      // Only update if balance actually changed
      if (formattedBalance !== prevBalanceRef.current) {
        setBalanceAmount(formattedBalance);
        prevBalanceRef.current = formattedBalance;
      }
    }
  }, [amount, paidAmount]);

  // Calculate total from items
  const calculateTotal = () => {
    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.amount.replace(/[₹,]/g, "")) || 0;
    });
    
    // If paid invoice, add GST
    let total = subtotal;
    if (clientDetails.invoiceType === "paid") {
      const gstAmount = (subtotal * (parseFloat(gstRate) / 100)) || 0;
      total += gstAmount;
    }
    
    // Return formatted with ₹ symbol
    return `₹${total.toFixed(2)}`;
  };

  // Update client details field
  const updateClientDetail = (field: keyof ClientDetailsFormState, value: string | boolean) => {
    setClientDetails(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Update items and clear validation errors
  const updateItems = (newItems: InvoiceItem[]) => {
    setItems(newItems);
    
    // Clear item-related validation errors
    setValidationErrors(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith('items.')) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    try {
      // Validate using Zod schema
      invoiceSchema.parse({
        clientName: clientDetails.clientName,
        clientEmail: clientDetails.clientEmail,
        invoiceDate: clientDetails.invoiceDate,
        items
      });
      
      // Additional validations not covered by schema
      if (items.length === 0) {
        errors.items = "At least one item is required";
      } else {
        items.forEach((item, index) => {
          const amountValue = item.amount.replace(/[₹,]/g, "");
          if (amountValue && isNaN(parseFloat(amountValue))) {
            errors[`items.${index}.amount`] = "Amount must be a valid number";
          }
        });
      }
      
      if (clientDetails.invoiceType === "paid" && clientDetails.paymentReceived) {
        if (!clientDetails.paymentDate) {
          errors.paymentDate = "Payment date is required when payment is received";
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>, onSave: (invoice: Invoice, invoiceFormData: any) => void) => {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return false;
    }
    
    const finalAmount = amount || calculateTotal();
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.amount.replace(/[₹,]/g, "")) || 0;
    });
    
    const gstRateValue = clientDetails.invoiceType === "paid" ? parseFloat(gstRate) : 0;
    const gstAmount = subtotal * (gstRateValue / 100);
    const total = subtotal + gstAmount;
    
    // Determine status from amount values, not just from form state
    const paidAmountValue = parseFloat(paidAmount.replace(/[₹,]/g, "")) || 0;
    const totalAmountValue = parseFloat(finalAmount.replace(/[₹,]/g, "")) || 0;
    
    let status: "pending" | "partial" | "paid";
    
    if (paidAmountValue >= totalAmountValue) {
      status = "paid";
    } else if (paidAmountValue > 0) {
      status = "partial";
    } else {
      status = "pending";
    }
    
    // Structure invoice form data for RPC function (JSONB format)
    const invoiceFormData = {
      invoiceType: clientDetails.invoiceType,
      invoiceDate: clientDetails.invoiceDate,
      clientDetails: {
        name: clientDetails.clientName,
        email: clientDetails.clientEmail,
        phone: clientDetails.clientPhone,
        address: clientDetails.clientAddress,
        gst: clientDetails.clientGst
      },
      companyDetails: {
        name: clientDetails.companyName,
        email: clientDetails.companyEmail,
        phone: clientDetails.companyPhone,
        address: clientDetails.companyAddress,
        gst: clientDetails.companyGst
      },
      invoiceItems: items.map(item => ({
        description: item.description,
        amount: item.amount.replace(/[₹,]/g, "")
      })),
      paymentDetails: {
        paymentReceived: clientDetails.paymentReceived,
        paymentDate: clientDetails.paymentDate || "",
        paymentMethod: clientDetails.paymentMethod || "bank"
      },
      totals: {
        subtotal: subtotal.toFixed(2),
        gstRate: gstRateValue.toString(),
        gstAmount: gstAmount.toFixed(2),
        total: total.toFixed(2)
      },
      paymentTracking: {
        totalAmount: finalAmount.replace(/[₹,]/g, ""),
        paidAmount: paidAmount.replace(/[₹,]/g, ""),
        balanceAmount: balanceAmount.replace(/[₹,]/g, ""),
        notes: notes || ""
      }
    };
    
    const newInvoice: Invoice = {
      id: editingInvoice?.id || "",  // For new invoices, the ID will be generated by Supabase
      client: clientDetails.clientName,
      clientEmail: clientDetails.clientEmail,
      date: clientDetails.invoiceDate,
      amount: finalAmount,
      paidAmount,
      balanceAmount,
      status,
      items,
      estimateId: estimateData?.id,
      notes,
      paymentDate: paidAmountValue > 0 ? (editingInvoice?.paymentDate || clientDetails.paymentDate) : undefined,
      paymentMethod: paidAmountValue > 0 ? (editingInvoice?.paymentMethod || clientDetails.paymentMethod) : undefined,
      gstRate: clientDetails.invoiceType === "paid" ? gstRate : "0"
    };
    
    onSave(newInvoice, invoiceFormData);
    return true;
  };

  return {
    clientDetails,
    updateClientDetail,
    items,
    setItems: updateItems,
    gstRate,
    setGstRate,
    amount,
    setAmount,
    paidAmount,
    setPaidAmount,
    balanceAmount,
    notes,
    setNotes,
    calculateTotal,
    handleSubmit,
    validationErrors
  };
}