
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchTransactions, getTransactionStats } from "@/hooks/finances/api/financeApi";
import { ReportsHeader } from "./components/ReportsHeader";
import { MonthlyTrendsTab } from "./tabs/MonthlyTrendsTab";
import { CategoryBreakdownTab } from "./tabs/CategoryBreakdownTab";
import { CashFlowTab } from "./tabs/CashFlowTab";

interface FinancialReportsProps {
  year: string;
}

export function FinancialReports({ year }: FinancialReportsProps) {
  const [activeReport, setActiveReport] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any>({
    income: [],
    expense: []
  });

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  const fetchMonthlyData = async () => {
    try {
      setIsLoading(true);
      
      const monthlyStats = [];
      
      for (let month = 0; month < 12; month++) {
        const date = new Date();
        date.setFullYear(parseInt(year));
        date.setMonth(month);
        
        const startDate = format(new Date(parseInt(year), month, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(parseInt(year), month + 1, 0), 'yyyy-MM-dd');
        
        const stats = await getTransactionStats(startDate, endDate);
        
        monthlyStats.push({
          month: format(date, 'MMM'),
          income: stats.totalIncome,
          expense: stats.totalExpense,
          profit: stats.netAmount
        });
      }
      
      setMonthlyData(monthlyStats);
      
      updateCategoryData(parseInt(selectedMonth));
      
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      toast.error("Failed to load financial reports");
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateCategoryData = async (monthIndex: number) => {
    try {
      const startDate = format(new Date(parseInt(year), monthIndex, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(parseInt(year), monthIndex + 1, 0), 'yyyy-MM-dd');
      
      const stats = await getTransactionStats(startDate, endDate);
      
      setCategoryData({
        income: stats.incomeByCategory.map(item => ({
          name: item.category,
          value: item.amount
        })),
        expense: stats.expenseByCategory.map(item => ({
          name: item.category,
          value: item.amount
        }))
      });
      
    } catch (error) {
      console.error("Error updating category data:", error);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [year]);
  
  useEffect(() => {
    updateCategoryData(parseInt(selectedMonth));
  }, [selectedMonth, year]);

  return (
    <div className="space-y-6">
      <ReportsHeader isLoading={isLoading} onRefresh={fetchMonthlyData} />

      <Tabs defaultValue="monthly" value={activeReport} onValueChange={setActiveReport}>
        <TabsList 
          className="grid w-full grid-cols-3 bg-white/10 border-white/20"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <TabsTrigger 
            value="monthly"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
          >
            Monthly Trends
          </TabsTrigger>
          <TabsTrigger 
            value="categories"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
          >
            Category Breakdown
          </TabsTrigger>
          <TabsTrigger 
            value="cashflow"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
          >
            Cash Flow Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="mt-6">
          <MonthlyTrendsTab 
            isLoading={isLoading} 
            monthlyData={monthlyData} 
            year={year}
          />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <CategoryBreakdownTab 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            categoryData={categoryData}
            months={months}
            year={year}
            COLORS={COLORS}
          />
        </TabsContent>
        
        <TabsContent value="cashflow" className="mt-6">
          <CashFlowTab 
            isLoading={isLoading} 
            monthlyData={monthlyData} 
            year={year}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
