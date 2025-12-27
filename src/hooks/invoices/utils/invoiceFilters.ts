
import { Invoice } from "@/components/invoices/types";

export type SortOption = 
  | "client_asc" | "client_desc"
  | "invoiceNumber_asc" | "invoiceNumber_desc"
  | "date_asc" | "date_desc"
  | "amount_asc" | "amount_desc"
  | "balance_asc" | "balance_desc"
  | "status_asc" | "status_desc"
  | "date" | "amount" | "balanceHighToLow" | "balanceLowToHigh"; // Keep old options for backward compatibility

export type SearchType = "client" | "invoice";

// Filter invoices by search query and status
export const filterInvoices = (
  invoices: Invoice[],
  searchQuery: string,
  statusFilter: string | null,
  searchType: SearchType = "client"
): Invoice[] => {
  return invoices.filter((invoice) => {
    let matchesSearch = true;
    
    if (searchQuery.trim()) {
      if (searchType === "client") {
        matchesSearch = invoice.client
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      } else if (searchType === "invoice") {
        const invoiceNumber = invoice.displayNumber || invoice.id.substring(0, 8);
        matchesSearch = invoiceNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }
    }
    
    const matchesStatus = !statusFilter || invoice.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
};

// Sort invoices by the specified criteria
export const sortInvoices = (invoices: Invoice[], sortBy: SortOption): Invoice[] => {
  return [...invoices].sort((a, b) => {
    // Client sorting
    if (sortBy === "client_asc") {
      return a.client.localeCompare(b.client);
    } else if (sortBy === "client_desc") {
      return b.client.localeCompare(a.client);
    }
    
    // Invoice Number sorting
    if (sortBy === "invoiceNumber_asc") {
      const aNum = a.displayNumber || a.id.substring(0, 8);
      const bNum = b.displayNumber || b.id.substring(0, 8);
      return aNum.localeCompare(bNum);
    } else if (sortBy === "invoiceNumber_desc") {
      const aNum = a.displayNumber || a.id.substring(0, 8);
      const bNum = b.displayNumber || b.id.substring(0, 8);
      return bNum.localeCompare(aNum);
    }
    
    // Date sorting
    if (sortBy === "date_asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === "date_desc" || sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    // Amount sorting
    if (sortBy === "amount_asc") {
      return parseInt(a.amount.replace(/[₹,]/g, "")) - parseInt(b.amount.replace(/[₹,]/g, ""));
    } else if (sortBy === "amount_desc" || sortBy === "amount") {
      return parseInt(b.amount.replace(/[₹,]/g, "")) - parseInt(a.amount.replace(/[₹,]/g, ""));
    }
    
    // Balance sorting
    if (sortBy === "balance_asc") {
      return parseInt(a.balanceAmount.replace(/[₹,]/g, "")) - parseInt(b.balanceAmount.replace(/[₹,]/g, ""));
    } else if (sortBy === "balance_desc" || sortBy === "balanceHighToLow") {
      return parseInt(b.balanceAmount.replace(/[₹,]/g, "")) - parseInt(a.balanceAmount.replace(/[₹,]/g, ""));
    } else if (sortBy === "balanceLowToHigh") {
      return parseInt(a.balanceAmount.replace(/[₹,]/g, "")) - parseInt(b.balanceAmount.replace(/[₹,]/g, ""));
    }
    
    // Status sorting
    if (sortBy === "status_asc") {
      return a.status.localeCompare(b.status);
    } else if (sortBy === "status_desc") {
      return b.status.localeCompare(a.status);
    }
    
    return 0;
  });
};
