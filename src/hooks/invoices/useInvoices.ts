
import { useState, useEffect } from "react";
import { Invoice } from "@/components/invoices/types";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInvoices, addInvoice as apiAddInvoice, updateInvoice as apiUpdateInvoice } from "./api/invoiceApi";
import { filterInvoices, sortInvoices, SortOption, SearchType } from "./utils/invoiceFilters";
import { useEstimateProcessing } from "./useEstimateProcessing";

export function useInvoices() {
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("client");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices from Supabase
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        return await fetchInvoices();
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Use the estimate processing hook
  const { 
    showNewInvoice, 
    setShowNewInvoice, 
    locationState, 
    hasInvoiceForEstimate 
  } = useEstimateProcessing(invoices);

  // Add invoice mutation
  const addInvoiceMutation = useMutation({
    mutationFn: ({ invoice, invoiceFormData }: { invoice: Invoice; invoiceFormData: any }) => 
      apiAddInvoice(invoice, invoiceFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      console.error("Failed to add invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive"
      });
    }
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ invoice, invoiceFormData }: { invoice: Invoice; invoiceFormData: any }) => 
      apiUpdateInvoice(invoice, invoiceFormData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      console.error("Failed to update invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    }
  });

  // Filter and sort invoices
  const filteredInvoices = sortInvoices(
    filterInvoices(invoices, searchQuery, statusFilter, searchType),
    sortBy
  );

  // Sync selectedInvoice with updated invoices list after refetch
  // This ensures InvoiceDetails shows the latest data after updates
  useEffect(() => {
    if (selectedInvoice && invoices.length > 0) {
      // Find the updated invoice in the refetched list
      const updatedInvoice = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updatedInvoice) {
        // Only update if the invoice data has actually changed
        // Compare key fields to avoid unnecessary re-renders
        const hasChanged = 
          updatedInvoice.amount !== selectedInvoice.amount ||
          updatedInvoice.paidAmount !== selectedInvoice.paidAmount ||
          updatedInvoice.balanceAmount !== selectedInvoice.balanceAmount ||
          updatedInvoice.status !== selectedInvoice.status ||
          JSON.stringify(updatedInvoice.items) !== JSON.stringify(selectedInvoice.items);
        
        if (hasChanged) {
          // Update selectedInvoice with the latest data from the refetched list
          // This keeps InvoiceDetails in sync with the database
          setSelectedInvoice(updatedInvoice);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]); // Only depend on invoices array to avoid infinite loops

  const addInvoice = (invoice: Invoice, invoiceFormData: any) => {
    addInvoiceMutation.mutate({ invoice, invoiceFormData }, {
      onSuccess: () => {
        toast({
          title: "Invoice Created",
          description: `Invoice for ${invoice.client} has been created successfully.`,
        });
      }
    });
  };

  const updateInvoice = (updatedInvoice: Invoice, invoiceFormData?: any) => {
    updateInvoiceMutation.mutate({ invoice: updatedInvoice, invoiceFormData }, {
      onSuccess: () => {
        toast({
          title: "Invoice Updated",
          description: `Invoice for ${updatedInvoice.client} has been updated.`,
        });
      }
    });
  };

  return {
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    statusFilter,
    setStatusFilter,
    showNewInvoice,
    setShowNewInvoice,
    selectedInvoice,
    setSelectedInvoice,
    filteredInvoices,
    addInvoice,
    updateInvoice,
    locationState,
    hasInvoiceForEstimate,
    isLoading
  };
}
