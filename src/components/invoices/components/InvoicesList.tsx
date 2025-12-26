
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Receipt, ArrowUpDown, Wallet, ChevronDown, Edit, Eye, DollarSign } from "lucide-react";
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
  onEdit?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export function InvoicesList({
  invoices,
  sortBy,
  setSortBy,
  onViewDetails,
  onEdit,
  onRecordPayment,
}: InvoicesListProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Format payment status with appropriate styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600/30 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/50';
      case 'partial':
        return 'bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded-full text-xs border border-yellow-500/50';
      default:
        return 'bg-gray-600/30 text-gray-300 px-2 py-1 rounded-full text-xs border border-gray-500/50';
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
          <div className="rounded-md border" style={{ borderColor: '#3d2a5f' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: '#3d2a5f' }}>
                  <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Client</TableHead>
                  <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoice #</TableHead>
                  <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Date</TableHead>
                  <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Amount</TableHead>
                  <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Balance</TableHead>
                  <TableHead className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Status</TableHead>
                  <TableHead className="text-right text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-white/5" style={{ borderColor: '#3d2a5f' }}>
                    <TableCell className="font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                      <span>{invoice.client}</span>
                    </TableCell>
                    <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.displayNumber || invoice.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.date}</TableCell>
                    <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.amount}</TableCell>
                    <TableCell className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.balanceAmount}</TableCell>
                    <TableCell>
                      <span className={getStatusStyle(invoice.status)} style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                          onClick={() => onViewDetails(invoice)}
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {onEdit && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                            onClick={() => onEdit(invoice)}
                            title="Edit Invoice"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onRecordPayment && invoice.status !== "paid" && (
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                            onClick={() => handleRecordPayment(invoice)}
                            title="Record Payment"
                          >
                            <DollarSign className="h-4 w-4" />
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
