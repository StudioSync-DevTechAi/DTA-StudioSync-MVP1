
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SearchType } from "@/hooks/invoices/utils/invoiceFilters";

interface InvoicesListProps {
  invoices: Invoice[];
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  statusFilter?: string | null;
  setStatusFilter?: (status: string | null) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchType?: SearchType;
  setSearchType?: (type: SearchType) => void;
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
  searchType = "client",
  setSearchType,
  onViewDetails,
  onEdit,
  onRecordPayment,
}: InvoicesListProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

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
      return <ArrowUp className="h-2.5 w-2.5 xs:h-3 xs:w-3 ml-0.5 xs:ml-1" />;
    } else if (currentSort === `${column}_desc`) {
      return <ArrowDown className="h-2.5 w-2.5 xs:h-3 xs:w-3 ml-0.5 xs:ml-1" />;
    }
    return <ArrowUpDown className="h-2.5 w-2.5 xs:h-3 xs:w-3 ml-0.5 xs:ml-1 opacity-50" />;
  };

  return (
      <Card className="w-full max-w-full" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
      <div className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
          <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-white flex-shrink-0" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Recent Invoices</h2>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 xs:left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-white/70 z-10" />
            <Popover open={searchDropdownOpen} onOpenChange={setSearchDropdownOpen}>
              <PopoverTrigger asChild>
                <Input
                  placeholder={searchType === "client" ? "Search by client name..." : "Search by invoice number..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  onFocus={() => setSearchDropdownOpen(true)}
                  className="pl-7 xs:pl-8 sm:pl-9 text-[11px] xs:text-xs sm:text-sm text-white placeholder:text-gray-400 h-8 xs:h-9 sm:h-10"
                  style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
                />
              </PopoverTrigger>
              <PopoverContent 
                className="w-44 xs:w-48 sm:w-56 p-1.5 xs:p-2"
                align="start"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderColor: '#3d2a5f' }}
              >
                <div className="space-y-0.5 xs:space-y-1">
                  <button
                    onClick={() => {
                      setSearchType && setSearchType("client");
                      setSearchDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 xs:px-3 py-1.5 xs:py-2 rounded-md text-[11px] xs:text-xs sm:text-sm transition-colors ${
                      searchType === "client"
                        ? "bg-[#2d1b4e] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={searchType === "client" ? { backgroundColor: '#2d1b4e', color: '#ffffff' } : {}}
                  >
                    Search by Client Name
                  </button>
                  <button
                    onClick={() => {
                      setSearchType && setSearchType("invoice");
                      setSearchDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 xs:px-3 py-1.5 xs:py-2 rounded-md text-[11px] xs:text-xs sm:text-sm transition-colors ${
                      searchType === "invoice"
                        ? "bg-[#2d1b4e] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={searchType === "invoice" ? { backgroundColor: '#2d1b4e', color: '#ffffff' } : {}}
                  >
                    Search by Invoice Number
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-1 xs:gap-1.5 sm:gap-2 text-white border-[#3d2a5f] hover:bg-[#1a0f3d] flex-shrink-0 h-8 xs:h-9 sm:h-10 text-[11px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4"
                style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
              >
                <Filter className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All Status"}</span>
                <span className="xs:hidden">Filter</span>
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
          <div className="py-6 xs:py-8 text-center">
            <p className="text-white/80 text-xs xs:text-sm" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>No invoices found</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card View */}
            <div className="md:hidden space-y-3 xs:space-y-4 w-full">
              {invoices.map((invoice: Invoice) => (
                <Card 
                  key={invoice.id} 
                  className="w-full p-3 xs:p-4 transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm xs:text-base font-semibold text-white truncate" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
                          {invoice.client}
                        </h3>
                        <p className="text-[10px] xs:text-xs text-white/70 mt-0.5">
                          {invoice.displayNumber || invoice.id.substring(0, 8)}
                        </p>
                      </div>
                      <span className={`${getStatusStyle(invoice.status)} text-[10px] xs:text-xs shrink-0`} style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 xs:gap-3 text-[10px] xs:text-xs">
                      <div>
                        <p className="text-white/60 mb-0.5">Date</p>
                        <p className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.date}</p>
                      </div>
                      <div>
                        <p className="text-white/60 mb-0.5">Amount</p>
                        <p className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.amount}</p>
                      </div>
                      <div>
                        <p className="text-white/60 mb-0.5">Balance</p>
                        <p className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.balanceAmount}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-2 pt-2 border-t" style={{ borderColor: '#3d2a5f' }}>
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
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-x-auto scroll-smooth w-full" style={{ borderColor: '#3d2a5f', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <Table className="w-full min-w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderColor: '#3d2a5f' }}>
                  <TableHead 
                    className="text-white text-left cursor-pointer hover:bg-white/5 select-none transition-colors text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 h-10 xs:h-12" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("client")}
                  >
                    <div className="flex items-center">
                      Client
                      {getSortIcon("client")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 hidden sm:table-cell h-10 xs:h-12" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("invoiceNumber")}
                  >
                    <div className="flex items-center justify-center">
                      Invoice #
                      {getSortIcon("invoiceNumber")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 h-10 xs:h-12" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("date")}
                  >
                    <div className="flex items-center justify-center">
                      Date
                      {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 hidden xs:table-cell h-10 xs:h-12" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("amount")}
                  >
                    <div className="flex items-center justify-center">
                      Amount
                      {getSortIcon("amount")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 hidden md:table-cell h-10 xs:h-12" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("balance")}
                  >
                    <div className="flex items-center justify-center">
                      Balance
                      {getSortIcon("balance")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-white text-center cursor-pointer hover:bg-white/5 select-none transition-colors text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 h-10 xs:h-12" 
                    style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
                    onClick={() => handleColumnSort("status")}
                  >
                    <div className="flex items-center justify-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 h-10 xs:h-12" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-white/5" style={{ borderColor: '#3d2a5f' }}>
                    <TableCell className="font-medium text-white text-left text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 py-2 xs:py-3" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                      <span className="truncate block max-w-[100px] xs:max-w-[120px] sm:max-w-none">{invoice.client}</span>
                    </TableCell>
                    <TableCell className="text-white text-center text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 py-2 xs:py-3 hidden sm:table-cell" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.displayNumber || invoice.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-white text-center text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 py-2 xs:py-3" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.date}</TableCell>
                    <TableCell className="text-white text-center text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 py-2 xs:py-3 hidden xs:table-cell" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.amount}</TableCell>
                    <TableCell className="text-white text-center text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 md:px-4 py-2 xs:py-3 hidden md:table-cell" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{invoice.balanceAmount}</TableCell>
                    <TableCell className="text-center px-1.5 xs:px-2 sm:px-3 md:px-4 py-2 xs:py-3">
                      <span className={`${getStatusStyle(invoice.status)} text-[10px] xs:text-xs sm:text-sm`} style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center px-1 xs:px-1.5 sm:px-2 md:px-3 py-2 xs:py-3">
                      <div className="flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                          onClick={() => onViewDetails(invoice)}
                          title="View Invoice"
                        >
                          <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        
                        {onEdit && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                            onClick={() => onEdit(invoice)}
                            title="Edit Invoice"
                          >
                            <Edit className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                        
                        {onRecordPayment && (
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
                            style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
                            onClick={() => handleRecordPayment(invoice)}
                            title="Record Payment"
                          >
                            <DollarSign className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
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
