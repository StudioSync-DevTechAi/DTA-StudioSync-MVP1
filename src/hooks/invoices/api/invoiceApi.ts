import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/invoices/types";

// Convert from our application type to Supabase type
export const mapInvoiceToSupabaseInvoice = (invoice: Invoice) => {
  return {
    id: invoice.id || undefined,
    display_number: invoice.displayNumber,
    client: invoice.client,
    client_email: invoice.clientEmail,
    date: invoice.date,
    amount: invoice.amount,
    paid_amount: invoice.paidAmount,
    balance_amount: invoice.balanceAmount,
    status: invoice.status,
    items: invoice.items,
    estimate_id: invoice.estimateId,
    notes: invoice.notes,
    payment_date: invoice.paymentDate,
    payment_method: invoice.paymentMethod,
    gst_rate: invoice.gstRate,
    payments: invoice.payments
  };
};

// Convert from Supabase type to our application type
export const mapSupabaseInvoiceToInvoice = (item: any): Invoice => {
  return {
    id: item.id,
    displayNumber: item.display_number,
    client: item.client,
    clientEmail: item.client_email,
    date: item.date,
    amount: item.amount,
    paidAmount: item.paid_amount,
    balanceAmount: item.balance_amount,
    status: item.status as "pending" | "partial" | "paid",
    items: item.items,
    estimateId: item.estimate_id,
    notes: item.notes,
    paymentDate: item.payment_date,
    paymentMethod: item.payment_method,
    gstRate: item.gst_rate,
    payments: item.payments || []
  };
};

// Function to generate a user-friendly invoice number
export const generateInvoiceNumber = async (): Promise<string> => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  
  // Get count of invoices this month to determine the next sequential number
  const prefix = `INV-${year}${month}-`;
  
  // Fetch invoices with the current month/year prefix
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('display_number')
    .like('display_number', `${prefix}%`);
  
  if (error) {
    console.error("Error fetching invoices for number generation:", error);
    // Fallback: just return a number based on timestamp
    return `${prefix}001`;
  }
  
  // Count invoices with the current month/year prefix
  const count = invoices?.length || 0;
  
  // Format: INV-YYYYMM-XXX where XXX is sequential
  const sequentialNumber = (count + 1).toString().padStart(3, '0');
  return `${prefix}${sequentialNumber}`;
};

// Fetch all invoices
export const fetchInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
    
    return (data || []).map(item => mapSupabaseInvoiceToInvoice(item));
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

// Add a new invoice
export const addInvoice = async (invoice: Invoice): Promise<Invoice> => {
  try {
    // Generate friendly invoice number if not provided
    if (!invoice.displayNumber) {
      invoice.displayNumber = await generateInvoiceNumber();
    }
    
    const invoiceData = mapInvoiceToSupabaseInvoice(invoice);
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();
    
    if (error) {
      console.error("Error adding invoice:", error);
      throw error;
    }
    
    return mapSupabaseInvoiceToInvoice(data);
  } catch (error) {
    console.error("Error adding invoice:", error);
    throw error;
  }
};

// Update an existing invoice
export const updateInvoice = async (invoice: Invoice): Promise<Invoice> => {
  try {
    if (!invoice.id) {
      throw new Error("Invoice ID is required for update");
    }
    
    const invoiceData = mapInvoiceToSupabaseInvoice(invoice);
    // Remove id from update data as it's used in the where clause
    const { id, ...updateData } = invoiceData;
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoice.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
    
    return mapSupabaseInvoiceToInvoice(data);
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};