
import Layout from "@/components/Layout";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoiceStats } from "@/components/invoices/components/InvoiceStats";
import { InvoiceFilters } from "@/components/invoices/components/InvoiceFilters";
import { InvoicesList } from "@/components/invoices/components/InvoicesList";
import { useInvoices } from "@/hooks/invoices/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesPage() {
  const {
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
    isLoading
  } = useInvoices();

  const handleSaveInvoice = (invoice: any, invoiceFormData: any) => {
    if (selectedInvoice) {
      updateInvoice(invoice, invoiceFormData);
    } else {
      addInvoice(invoice, invoiceFormData);
    }
  };

  const handleRecordPayment = (updatedInvoice: any) => {
    // For payment recording, we need to reconstruct the form data
    // The updated invoice should have the new payment amounts
    updateInvoice(updatedInvoice);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8 animate-in">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Statistics Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          
          {/* Search and Filter Skeleton */}
          <div className="flex gap-4 items-center">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Table Skeleton */}
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 animate-in"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 text-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Invoices</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Manage your client invoices and payments
            </p>
          </div>
          <Button 
            onClick={() => setShowNewInvoice(true)} 
            className="animated-border w-full sm:w-auto"
            variant="outline"
            style={{
              backgroundColor: 'transparent',
              color: '#ffffff',
              borderColor: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Statistics Cards */}
        <InvoiceStats invoices={filteredInvoices} />

        {/* Search and Filter Bar */}
        <InvoiceFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Invoices List */}
        <InvoicesList 
          invoices={filteredInvoices}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onViewDetails={setSelectedInvoice}
          onEdit={(invoice) => {
            setSelectedInvoice(invoice);
            setShowNewInvoice(true);
          }}
          onRecordPayment={handleRecordPayment}
        />
      </div>

      {/* Modals */}
      <InvoiceForm 
        open={showNewInvoice} 
        onClose={() => setShowNewInvoice(false)} 
        onSave={handleSaveInvoice}
        editingInvoice={selectedInvoice}
      />
      
      <InvoiceDetails
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onEdit={() => setShowNewInvoice(true)}
      />
    </Layout>
  );
}
