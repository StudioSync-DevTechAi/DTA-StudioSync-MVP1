
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Receipt, ArrowUpDown, Wallet, Edit, Eye, DollarSign, Filter, ArrowUp, ArrowDown, Search } from "lucide-react";
import { useState } from "react";
import { Invoice } from "../types";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import type { SortOption } from "@/hooks/invoices/utils/invoiceFilters";
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
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  statusFilter?: string | null;
  setStatusFilter?: (status: string | null) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onViewDetails: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export function InvoicesList({
  invoices,
  sortBy,
  setSortBy,
  statusFilter,
  setStatusFilter,
  searchQuery = "",
  setSearchQuery,
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

  const handleColumnSort = (column: "client" | "invoiceNumber" | "date" | "amount" | "balance" | "status") => {
    const currentSort = sortBy;
    const isAscending = currentSort === `${column}_asc`;
    const isDescending = currentSort === `${column}_desc`;
    
    // Toggle between ascending and descending
    if (isAscending) {
      setSortBy(`${column}_desc` as SortOption);
    } else if (isDescending) {
      setSortBy(`${column}_asc` as SortOption);
    } else {
      // If not currently sorted by this column, start with ascending
      setSortBy(`${column}_asc` as SortOption);
    }
  };

  const getSortIcon = (column: "client" | "invoiceNumber" | "date" | "amount" | "balance" | "status") => {
    const currentSort = sortBy;
    if (currentSort === `${column}_asc`) {
      return <ArrowUp className="h-3 w-3 ml-1" />;
    } else if (currentSort === `${column}_desc`) {
      return <ArrowDown className="h-3 w-3 ml-1" />;
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
  };

  return (
    <Card style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white flex-shrink-0" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Recent Invoices</h2>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              className="pl-9 text-white placeholder:text-gray-400"
              style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 text-white border-[#3d2a5f] hover:bg-[#1a0f3d] flex-shrink-0"
                style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <Filter className="h-4 w-4" />
                {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2d1b4e] border-[#3d2a5f]">
              <DropdownMenuItem 
                onClick={() => setStatusFilter && setStatusFilter(null)}
                className="text-white hover:bg-white/10"
              >
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter && setStatusFilter("paid")}
                className="text-white hover:bg-white/10"
              >
                Paid
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter && setStatusFilter("partial")}
                className="text-white hover:bg-white/10"
              >
                Partial
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setStatusFilter && setStatusFilter("pending")}
                className="text-white hover:bg-white/10"
              >
                Pending
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
                <TableRow className="hover:bg-transparent" style={{ borderColor: '#3d2a5f' }}>
                  <TableHead 
                    className="text-white text-left cursor-pointer hover:bg-white/5 select-none transition-colors" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("client")}
                  >
                    <div className="flex items-center">
                      Client
                      {getSortIcon("client")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("invoiceNumber")}
                  >
                    <div className="flex items-center justify-center">
                      Invoice #
                      {getSortIcon("invoiceNumber")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("date")}
                  >
                    <div className="flex items-center justify-center">
                      Date
                      {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("amount")}
                  >
                    <div className="flex items-center justify-center">
                      Amount
                      {getSortIcon("amount")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("balance")}
                  >
                    <div className="flex items-center justify-center">
                      Balance
                      {getSortIcon("balance")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("status")}
                  >
                    <div className="flex items-center justify-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-white/5" style={{ borderColor: '#3d2a5f' }}>
                    <TableCell className="font-medium text-white text-left" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                      <span>{invoice.client}</span>
                    </TableCell>
                    <TableCell className="text-white text-center" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.displayNumber || invoice.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-white text-center" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.date}</TableCell>
                    <TableCell className="text-white text-center" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.amount}</TableCell>
                    <TableCell className="text-white text-center" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.balanceAmount}</TableCell>
                    <TableCell className="text-center">
                      <span className={getStatusStyle(invoice.status)} style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
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
                        
                        {onRecordPayment && (
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
