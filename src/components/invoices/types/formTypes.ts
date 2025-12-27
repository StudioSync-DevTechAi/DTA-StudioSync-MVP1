
import { Invoice, InvoiceItem } from "./index";

export interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice, invoiceFormData: any) => void;
  editingInvoice?: Invoice | null;
}

export interface ClientDetailsFormState {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientGst: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyGst: string;
  invoiceDate: string;
  invoiceType: "proforma" | "paid";
  paymentReceived: boolean;
  paymentDate: string;
  paymentMethod: string;
}
