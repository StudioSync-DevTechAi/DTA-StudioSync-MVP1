
import { Card } from "@/components/ui/card";
import { Invoice } from "@/components/invoices/types";
import { DollarSign, CreditCard, FileText } from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";

interface InvoiceStatsProps {
  invoices: Invoice[];
}

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  // Calculate totals
  const totalOutstanding = invoices
    .filter(invoice => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + parseFloat(invoice.balanceAmount.replace(/[₹,]/g, "")), 0);

  const paidThisMonth = invoices
    .filter(invoice => {
      if (!invoice.paymentDate) return false;
      const paymentDate = new Date(invoice.paymentDate);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, invoice) => sum + parseFloat(invoice.paidAmount.replace(/[₹,]/g, "")), 0);

  const pendingInvoices = invoices.filter(invoice => invoice.status === "pending").length;

  return (
    <div className="grid gap-2 xs:gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 w-full max-w-full">
      <StatCard
        title="Total Outstanding"
        value={`₹${totalOutstanding.toLocaleString()}`}
        icon={DollarSign}
      />
      <StatCard
        title="Paid this Month"
        value={`₹${paidThisMonth.toLocaleString()}`}
        icon={CreditCard}
      />
      <StatCard
        title="Pending Invoices"
        value={pendingInvoices}
        icon={FileText}
      />
    </div>
  );
}
