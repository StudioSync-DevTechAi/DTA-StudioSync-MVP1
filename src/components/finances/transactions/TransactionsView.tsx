
import React from "react";
import { Card } from "@/components/ui/card";
import { FinanceCategory } from "@/hooks/finances/api/financeApi";
import { TransactionHeader } from "./components/TransactionHeader";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionTable } from "./components/TransactionTable";
import { EmptyTransactionState } from "./components/EmptyTransactionState";
import { DeleteTransactionDialog } from "./components/DeleteTransactionDialog";
import { EditTransactionDialog } from "./components/EditTransactionDialog";
import { useTransactionView } from "./hooks/useTransactionView";

interface TransactionsViewProps {
  categories: FinanceCategory[];
  onAddTransaction: () => void;
}

export function TransactionsView({ categories, onAddTransaction }: TransactionsViewProps) {
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedTransaction,
    filteredTransactions,
    isLoading,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleSubmitEdit
  } = useTransactionView();

  return (
    <div className="space-y-4">
      <TransactionHeader onAddTransaction={onAddTransaction} />

      <Card className="p-4 transition-all hover:shadow-lg" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterCategory={filterCategory}
          onFilterCategoryChange={setFilterCategory}
          categories={categories}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyTransactionState />
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Card>

      <EditTransactionDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        transaction={selectedTransaction}
        categories={categories}
        onSubmit={handleSubmitEdit}
      />

      <DeleteTransactionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
