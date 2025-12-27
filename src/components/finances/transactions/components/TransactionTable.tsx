
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinanceTransaction, FinanceCategory } from "@/hooks/finances/api/financeApi";
import { format } from "date-fns";
import { TransactionActions } from "./TransactionActions";

interface TransactionTableProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  onEdit: (transaction: FinanceTransaction) => void;
  onDelete: (transaction: FinanceTransaction) => void;
}

export function TransactionTable({ 
  transactions, 
  categories,
  onEdit,
  onDelete 
}: TransactionTableProps) {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4">Date</TableHead>
            <TableHead className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4 hidden sm:table-cell">Type</TableHead>
            <TableHead className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4">Category</TableHead>
            <TableHead className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4 hidden md:table-cell">Description</TableHead>
            <TableHead className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4 hidden lg:table-cell">Payment Method</TableHead>
            <TableHead className="text-right text-xs xs:text-sm px-2 xs:px-3 sm:px-4">Amount</TableHead>
            <TableHead className="w-[80px] text-xs xs:text-sm px-2 xs:px-3 sm:px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4">
                {format(new Date(transaction.transaction_date), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4 hidden sm:table-cell">
                <span
                  className={`inline-flex px-1.5 xs:px-2 py-0.5 xs:py-1 text-[10px] xs:text-xs font-medium rounded-full ${
                    transaction.transaction_type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {transaction.transaction_type === "income" ? "Income" : "Expense"}
                </span>
              </TableCell>
              <TableCell className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4">
                <span className="truncate block max-w-[100px] sm:max-w-none">{getCategoryName(transaction.category_id)}</span>
              </TableCell>
              <TableCell className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4 hidden md:table-cell">
                <span className="truncate block max-w-[150px] lg:max-w-none">{transaction.description || "-"}</span>
              </TableCell>
              <TableCell className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4 hidden lg:table-cell">
                {transaction.payment_method
                  ? transaction.payment_method.replace("_", " ")
                  : "-"}
              </TableCell>
              <TableCell className="text-right font-medium text-xs xs:text-sm px-2 xs:px-3 sm:px-4">
                <span
                  className={
                    transaction.transaction_type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {transaction.transaction_type === "income" ? "+" : "-"} ₹
                  {Number(transaction.amount).toLocaleString()}
                </span>
              </TableCell>
              <TableCell className="text-xs xs:text-sm px-2 xs:px-3 sm:px-4">
                <TransactionActions 
                  transaction={transaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
