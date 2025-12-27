
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TransactionHeaderProps {
  onAddTransaction: () => void;
}

export function TransactionHeader({ onAddTransaction }: TransactionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 xs:gap-4">
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold tracking-tight text-white">Transactions</h2>
        <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 xs:mt-1">
          Manage your income and expense transactions
        </p>
      </div>
      <div className="w-full sm:w-auto">
        <Button 
          onClick={onAddTransaction} 
          className="w-full sm:w-auto text-xs xs:text-sm h-9 xs:h-10 px-3 xs:px-4"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        >
          <Plus className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
          <span className="hidden xs:inline">New Transaction</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}
