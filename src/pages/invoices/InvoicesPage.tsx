
import Layout from "@/components/Layout";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoiceStats } from "@/components/invoices/components/InvoiceStats";
import { InvoiceFilters } from "@/components/invoices/components/InvoiceFilters";
import { InvoicesList } from "@/components/invoices/components/InvoicesList";
import { useInvoices } from "@/hooks/invoices/useInvoices";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function InvoicesPage() {
  const {
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
        <div 
          className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 animate-in"
          style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
        >
          <LoadingSpinner text="Loading invoices..." fullScreen={false} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 animate-in overflow-x-hidden w-full max-w-full"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 xs:gap-3 sm:gap-4 w-full max-w-full">
          <div className="flex-1 min-w-0 text-white text-center sm:text-left w-full sm:w-auto">
            <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight break-words" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Invoices</h1>
            <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-white/80 mt-0.5 xs:mt-1 sm:mt-2 break-words px-1 sm:px-0" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
              Manage your client invoices and payments
            </p>
          </div>
          <Button 
            onClick={() => setShowNewInvoice(true)} 
            className="animated-border w-full sm:w-auto text-[11px] xs:text-xs sm:text-sm h-8 xs:h-9 sm:h-10 px-2.5 xs:px-3 sm:px-4 shrink-0"
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
            <Plus className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1 xs:mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">New Invoice</span>
            <span className="xs:hidden">New</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <InvoiceStats invoices={filteredInvoices} />

        {/* Invoices List */}
        <InvoicesList 
          invoices={filteredInvoices}
          sortBy={sortBy}
          setSortBy={setSortBy}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
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
