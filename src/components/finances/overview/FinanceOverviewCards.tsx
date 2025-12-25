
import React from "react";
import { Card } from "@/components/ui/card";
import { IndianRupee, ArrowUpRight, ArrowDownRight, PieChart, CalendarDays } from "lucide-react";

interface FinanceOverviewCardsProps {
  summaryStats: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    incomeByCategory: any[];
    expenseByCategory: any[];
  };
}

export function FinanceOverviewCards({ summaryStats }: FinanceOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="p-6 transition-all hover:shadow-lg hover:scale-105" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/20 rounded-full">
            <IndianRupee className="h-4 w-4 text-green-400" />
          </div>
          <span className="text-sm font-medium text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            Total Income
          </span>
        </div>
        <p className="text-2xl font-semibold mt-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          ₹{summaryStats.totalIncome.toLocaleString()}
        </p>
        <div className="flex items-center gap-1 mt-1 text-green-400" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-sm">This Month</span>
        </div>
      </Card>

      <Card className="p-6 transition-all hover:shadow-lg hover:scale-105" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/20 rounded-full">
            <IndianRupee className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-sm font-medium text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            Total Expenses
          </span>
        </div>
        <p className="text-2xl font-semibold mt-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          ₹{summaryStats.totalExpense.toLocaleString()}
        </p>
        <div className="flex items-center gap-1 mt-1 text-red-400" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          <ArrowDownRight className="h-4 w-4" />
          <span className="text-sm">This Month</span>
        </div>
      </Card>

      <Card className="p-6 transition-all hover:shadow-lg hover:scale-105" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-full">
            <PieChart className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-sm font-medium text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            Net Profit
          </span>
        </div>
        <p className="text-2xl font-semibold mt-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          ₹{summaryStats.netAmount.toLocaleString()}
        </p>
        <div className="flex items-center gap-1 mt-1 text-blue-400" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-sm">This Month</span>
        </div>
      </Card>

      <Card className="p-6 transition-all hover:shadow-lg hover:scale-105" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 rounded-full">
            <CalendarDays className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-sm font-medium text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            Budget Status
          </span>
        </div>
        <p className="text-2xl font-semibold mt-2 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
          {summaryStats.totalExpense > 0 ? 
            Math.round((summaryStats.totalExpense / (summaryStats.totalExpense * 1.2)) * 100) : 0}%
        </p>
        <div className="flex items-center gap-1 mt-1 text-purple-400" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          <span className="text-sm">of monthly budget</span>
        </div>
      </Card>
    </div>
  );
}
