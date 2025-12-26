
export interface InvoiceItem {
  description: string;
  amount: string;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: string;
  collected_by: string;
}

export interface Invoice {
  id: string;
  displayNumber?: string;
  client: string;
  clientEmail?: string;
  date: string;
  amount: string;
  paidAmount: string;
  balanceAmount: string;
  status: "pending" | "partial" | "paid";
  items: InvoiceItem[];
  estimateId?: string;
  notes?: string;
  paymentDate?: string;
  paymentMethod?: string;
  gstRate?: string;
  
  // Making sure payments is properly typed
  payments?: InvoicePayment[];
  
  // Store full invoice form data for editing (optional, populated when fetched from DB)
  invoiceFormData?: any;
  
  // Version history from database
  versionHistory?: Array<{
    version: number;
    invoice_form_data: any;
    updated_at: string;
    updated_by?: string;
  }>;
  currentVersion?: number;
}
