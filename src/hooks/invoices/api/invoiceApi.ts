import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/components/invoices/types";

// Convert from invoice_items_table to our application type
export const mapSupabaseInvoiceToInvoice = (item: any): Invoice => {
  const formData = item.invoice_form_data || {};
  const clientDetails = formData.clientDetails || {};
  const companyDetails = formData.companyDetails || {};
  const paymentTracking = formData.paymentTracking || {};
  const totals = formData.totals || {};
  const paymentDetails = formData.paymentDetails || {};
  
  // Map invoice status from database to application status
  let status: "pending" | "partial" | "paid" = "pending";
  if (item.invoice_status === "paid") {
    status = "paid";
  } else if (item.invoice_status === "sent") {
    status = "partial";
  } else {
    status = "pending";
  }
  
  // Map invoice items to ensure proper structure
  const mappedItems = (formData.invoiceItems || []).map((invoiceItem: any) => ({
    description: invoiceItem.description || "",
    amount: invoiceItem.amount || ""
  }));

  return {
    id: item.invoice_uuid,
    displayNumber: item.invoice_number,
    client: clientDetails.name || "",
    clientEmail: clientDetails.email || "",
    date: item.invoice_date || formData.invoiceDate || "",
    amount: paymentTracking.totalAmount || totals.total || "0",
    paidAmount: paymentTracking.paidAmount || "0",
    balanceAmount: paymentTracking.balanceAmount || paymentTracking.totalAmount || "0",
    status: status,
    items: mappedItems,
    estimateId: item.project_estimate_uuid,
    notes: paymentTracking.notes || "",
    paymentDate: paymentDetails.paymentDate || paymentTracking.paymentDate || "",
    paymentMethod: paymentDetails.paymentMethod || "",
    gstRate: totals.gstRate || formData.gstRate || "0",
    payments: formData.payments || [],
    // Store the full form data for editing
    invoiceFormData: formData
  };
};

// Helper function to reconstruct invoice form data from Invoice object
export const reconstructInvoiceFormData = (invoice: Invoice): any => {
  // If invoice already has form data, use it
  if (invoice.invoiceFormData) {
    return invoice.invoiceFormData;
  }
  
  // Otherwise, reconstruct from Invoice object
  const items = invoice.items || [];
  let subtotal = 0;
  items.forEach(item => {
    subtotal += parseFloat(item.amount.replace(/[₹,]/g, "")) || 0;
  });
  
  const gstRateValue = parseFloat(invoice.gstRate || "0");
  const gstAmount = subtotal * (gstRateValue / 100);
  const total = subtotal + gstAmount;
  
  return {
    invoiceType: invoice.status === "pending" ? "proforma" : "paid",
    invoiceDate: invoice.date,
    clientDetails: {
      name: invoice.client,
      email: invoice.clientEmail || "",
      phone: "", // Not available in Invoice type
      address: "", // Not available in Invoice type
      gst: "" // Not available in Invoice type
    },
    companyDetails: {
      name: "",
      email: "",
      phone: "",
      address: "",
      gst: ""
    },
    invoiceItems: items.map(item => ({
      description: item.description,
      amount: item.amount.replace(/[₹,]/g, "")
    })),
    paymentDetails: {
      paymentReceived: invoice.status === "paid",
      paymentDate: invoice.paymentDate || "",
      paymentMethod: invoice.paymentMethod || "bank"
    },
    totals: {
      subtotal: subtotal.toFixed(2),
      gstRate: gstRateValue.toString(),
      gstAmount: gstAmount.toFixed(2),
      total: total.toFixed(2)
    },
    paymentTracking: {
      totalAmount: invoice.amount.replace(/[₹,]/g, ""),
      paidAmount: invoice.paidAmount.replace(/[₹,]/g, ""),
      balanceAmount: invoice.balanceAmount.replace(/[₹,]/g, ""),
      notes: invoice.notes || ""
    }
  };
};

// Fetch all invoices from invoice_items_table
export const fetchInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoice_items_table')
      .select('*')
      .order('invoice_date', { ascending: false })
      .order('created_at', { ascending: false });
    
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

// Add a new invoice using RPC function
export const addInvoice = async (invoice: Invoice, invoiceFormData: any): Promise<Invoice> => {
  try {
    // Get photography owner phone number
    let photographyOwnerPhno = '';
    try {
      const { data: ownerData, error: ownerError } = await supabase
        .from("photography_owner_table")
        .select("photography_owner_phno")
        .limit(1)
        .maybeSingle();
      
      if (ownerError) {
        console.warn("Error fetching photography owner:", ownerError);
      } else if (ownerData?.photography_owner_phno) {
        photographyOwnerPhno = ownerData.photography_owner_phno;
      }
    } catch (error) {
      console.warn("Error fetching photography owner:", error);
    }
    
    if (!photographyOwnerPhno) {
      throw new Error("Photography owner information not found. Please contact support.");
    }
    
    // Get client phone number from invoice form data
    const clientPhno = invoiceFormData.clientDetails?.phone?.replace(/\s/g, '') || '';
    
    if (!clientPhno) {
      throw new Error("Client phone number is required to save the invoice.");
    }
    
    // Call RPC function to save invoice
    const { data, error } = await supabase.rpc('save_invoice_items_form_data', {
      p_photography_owner_phno: photographyOwnerPhno,
      p_client_phno: clientPhno,
      p_invoice_form_data: invoiceFormData,
      p_project_estimate_uuid: invoice.estimateId || null,
      p_cost_items_uuid: null, // Can be added later if needed
      p_invoice_uuid: null // New invoice, so no UUID
    });
    
    if (error) {
      console.error("Error saving invoice to database:", error);
      throw error;
    }
    
    if (data && data.success) {
      // Fetch the newly created invoice
      const { data: newInvoice, error: fetchError } = await supabase
        .from('invoice_items_table')
        .select('*')
        .eq('invoice_uuid', data.invoice_uuid)
        .single();
      
      if (fetchError) {
        console.error("Error fetching new invoice:", fetchError);
        throw fetchError;
      }
      
      return mapSupabaseInvoiceToInvoice(newInvoice);
    } else {
      throw new Error(data?.error || "Failed to save invoice");
    }
  } catch (error) {
    console.error("Error adding invoice:", error);
    throw error;
  }
};

// Update an existing invoice using RPC function
export const updateInvoice = async (invoice: Invoice, invoiceFormData?: any): Promise<Invoice> => {
  try {
    if (!invoice.id) {
      throw new Error("Invoice ID is required for update");
    }
    
    // If invoiceFormData is not provided, try to get it from the invoice or reconstruct it
    let formData = invoiceFormData;
    if (!formData) {
      if (invoice.invoiceFormData) {
        formData = invoice.invoiceFormData;
      } else {
        // Fetch the invoice from database to get the full form data
        const { data: existingInvoice, error: fetchError } = await supabase
          .from('invoice_items_table')
          .select('*')
          .eq('invoice_uuid', invoice.id)
          .single();
        
        if (fetchError) {
          console.warn("Error fetching existing invoice for update:", fetchError);
          // Reconstruct from invoice object as fallback
          formData = reconstructInvoiceFormData(invoice);
        } else {
          formData = existingInvoice.invoice_form_data || reconstructInvoiceFormData(invoice);
        }
      }
    }
    
    // Update payment tracking if invoice amounts have changed
    if (invoice.amount || invoice.paidAmount || invoice.balanceAmount) {
      formData = {
        ...formData,
        paymentTracking: {
          ...formData.paymentTracking,
          totalAmount: invoice.amount?.replace(/[₹,]/g, "") || formData.paymentTracking?.totalAmount || "0",
          paidAmount: invoice.paidAmount?.replace(/[₹,]/g, "") || formData.paymentTracking?.paidAmount || "0",
          balanceAmount: invoice.balanceAmount?.replace(/[₹,]/g, "") || formData.paymentTracking?.balanceAmount || "0",
          notes: invoice.notes || formData.paymentTracking?.notes || ""
        }
      };
    }
    
    // Get photography owner phone number
    let photographyOwnerPhno = '';
    try {
      const { data: ownerData, error: ownerError } = await supabase
        .from("photography_owner_table")
        .select("photography_owner_phno")
        .limit(1)
        .maybeSingle();
      
      if (ownerError) {
        console.warn("Error fetching photography owner:", ownerError);
      } else if (ownerData?.photography_owner_phno) {
        photographyOwnerPhno = ownerData.photography_owner_phno;
      }
    } catch (error) {
      console.warn("Error fetching photography owner:", error);
    }
    
    if (!photographyOwnerPhno) {
      throw new Error("Photography owner information not found. Please contact support.");
    }
    
    // Get client phone number from invoice form data
    const clientPhno = formData.clientDetails?.phone?.replace(/\s/g, '') || '';
    
    if (!clientPhno) {
      throw new Error("Client phone number is required to update the invoice.");
    }
    
    // Call RPC function to update invoice
    const { data, error } = await supabase.rpc('save_invoice_items_form_data', {
      p_photography_owner_phno: photographyOwnerPhno,
      p_client_phno: clientPhno,
      p_invoice_form_data: formData,
      p_project_estimate_uuid: invoice.estimateId || null,
      p_cost_items_uuid: null, // Can be added later if needed
      p_invoice_uuid: invoice.id // Existing invoice UUID for update
    });
    
    if (error) {
      console.error("Error updating invoice in database:", error);
      throw error;
    }
    
    if (data && data.success) {
      // Fetch the updated invoice
      const { data: updatedInvoice, error: fetchError } = await supabase
        .from('invoice_items_table')
        .select('*')
        .eq('invoice_uuid', invoice.id)
        .single();
      
      if (fetchError) {
        console.error("Error fetching updated invoice:", fetchError);
        throw fetchError;
      }
      
      return mapSupabaseInvoiceToInvoice(updatedInvoice);
    } else {
      throw new Error(data?.error || "Failed to update invoice");
    }
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};