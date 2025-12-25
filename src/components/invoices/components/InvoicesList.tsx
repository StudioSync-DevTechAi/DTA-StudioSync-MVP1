
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Receipt, ArrowUpDown, Wallet, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Invoice } from "../types";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoicesListProps {
  invoices: Invoice[];
  sortBy: "date" | "amount" | "balanceHighToLow" | "balanceLowToHigh";
  setSortBy: (sortBy: "date" | "amount" | "balanceHighToLow" | "balanceLowToHigh") => void;
  onViewDetails: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export function InvoicesList({
  invoices,
  sortBy,
  setSortBy,
  onViewDetails,
  onRecordPayment,
}: InvoicesListProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Format payment status with appropriate styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = (updatedInvoice: Invoice) => {
    if (onRecordPayment) {
      onRecordPayment(updatedInvoice);
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "date": return "Date";
      case "amount": return "Amount";
      case "balanceHighToLow": return "Balance (High to Low)";
      case "balanceLowToHigh": return "Balance (Low to High)";
      default: return "Date";
    }
  };

  return (
    <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Recent Invoices</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-white hover:bg-white/10"
                style={{ color: '#ffffff' }}
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort by {getSortLabel()}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2d1b4e] border-[#3d2a5f]">
              <DropdownMenuItem 
                onClick={() => setSortBy("date")}
                className="text-white hover:bg-white/10"
              >
                Date
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("amount")}
                className="text-white hover:bg-white/10"
              >
                Amount
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("balanceHighToLow")}
                className="text-white hover:bg-white/10"
              >
                Balance (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("balanceLowToHigh")}
                className="text-white hover:bg-white/10"
              >
                Balance (Low to High)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {invoices.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>No invoices found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <span>{invoice.client}</span>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.displayNumber || invoice.id.substring(0, 8)}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>{invoice.balanceAmount}</TableCell>
                    <TableCell>
                      <span className={getStatusStyle(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8"
                          onClick={() => onViewDetails(invoice)}
                        >
                          View
                        </Button>
                        
                        {onRecordPayment && invoice.status !== "paid" && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs h-8 gap-1"
                            onClick={() => handleRecordPayment(invoice)}
                          >
                            <Wallet className="h-3 w-3" />
                            Payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      {selectedInvoice && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onSave={handleSavePayment}
          invoice={selectedInvoice}
        />
      )}
    </Card>
  );
}
