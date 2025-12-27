
import React from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCategories } from "@/hooks/finances/api/categoryApi";
import { useQuery } from "@tanstack/react-query";
import { TransactionForm } from "@/components/finances/transactions/TransactionForm";
import { TransactionsView } from "@/components/finances/transactions/TransactionsView";
import { FinancialReports } from "@/components/finances/reports/FinancialReports";
import { useFinancesPage } from "@/hooks/finances/useFinancesPage";
import { FinancesHeader } from "@/components/finances/overview/FinancesHeader";
import { FinancesOverviewTab } from "@/components/finances/overview/FinancesOverviewTab";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { PERMISSIONS } from "@/types/rbac";

export default function FinancesPage() {
  const {
    isTransactionModalOpen,
    setIsTransactionModalOpen,
    activeTab,
    setActiveTab,
    selectedYear,
    setSelectedYear,
    summaryStats,
    handleNewTransaction,
    handleTransactionSubmit,
    revenueData
  } = useFinancesPage();
  
  // Use React Query to fetch categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  return (
    <Layout>
      <div 
        className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 animate-in"
        style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}
      >
        <FinancesHeader 
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          handleNewTransaction={handleNewTransaction}
        />

        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList 
            className="grid w-full grid-cols-1 sm:grid-cols-3 mb-3 xs:mb-4 sm:mb-6 md:mb-8 gap-2 sm:gap-0 bg-white/10 border-white/20 h-auto sm:h-10"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 text-xs xs:text-sm px-3 xs:px-4 py-2 xs:py-2.5 sm:py-0"
            >
              Overview
            </TabsTrigger>
            <PermissionGuard permission={PERMISSIONS.FINANCES_MANAGE} fallback={<></>}>
              <TabsTrigger 
                value="transactions"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 text-xs xs:text-sm px-3 xs:px-4 py-2 xs:py-2.5 sm:py-0"
              >
                Transactions
              </TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.FINANCES_REPORTS} fallback={<></>}>
              <TabsTrigger 
                value="reports"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 text-xs xs:text-sm px-3 xs:px-4 py-2 xs:py-2.5 sm:py-0"
              >
                <span className="hidden sm:inline">Reports & Analysis</span>
                <span className="sm:hidden">Reports</span>
              </TabsTrigger>
            </PermissionGuard>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <FinancesOverviewTab 
              summaryStats={summaryStats}
              revenueData={revenueData}
            />
          </TabsContent>
          
          <PermissionGuard permission={PERMISSIONS.FINANCES_MANAGE}>
            <TabsContent value="transactions" className="mt-0">
              <TransactionsView 
                categories={categories} 
                onAddTransaction={handleNewTransaction} 
              />
            </TabsContent>
          </PermissionGuard>
          
          <PermissionGuard permission={PERMISSIONS.FINANCES_REPORTS}>
            <TabsContent value="reports" className="mt-0">
              <FinancialReports year={selectedYear} />
            </TabsContent>
          </PermissionGuard>
        </Tabs>
      </div>
      
      <PermissionGuard permission={PERMISSIONS.FINANCES_MANAGE}>
        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
          <DialogContent 
            className="sm:max-w-[600px]"
            style={{ backgroundColor: 'rgba(26, 15, 61, 0.98)', backdropFilter: 'blur(10px)' }}
          >
            <DialogHeader>
              <DialogTitle className="text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Record New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm 
              onSubmit={handleTransactionSubmit} 
              categories={categories} 
              onCancel={() => setIsTransactionModalOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </PermissionGuard>
    </Layout>
  );
}
