
import { useState } from "react";
import { Invoice } from "@/components/invoices/types";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInvoices, addInvoice as apiAddInvoice, updateInvoice as apiUpdateInvoice } from "./api/invoiceApi";
import { filterInvoices, sortInvoices, SortOption } from "./utils/invoiceFilters";
import { useEstimateProcessing } from "./useEstimateProcessing";

export function useInvoices() {
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [searchQuery, setSearchQuery] = useState("");
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
    filterInvoices(invoices, searchQuery, statusFilter),
    sortBy
  );

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
