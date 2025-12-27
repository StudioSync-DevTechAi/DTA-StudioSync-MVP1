
import React from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

interface MonthlyTrendsTabProps {
  isLoading: boolean;
  monthlyData: MonthlyData[];
  year: string;
}

export function MonthlyTrendsTab({ isLoading, monthlyData, year }: MonthlyTrendsTabProps) {
  return (
    <Card 
      className="p-6"
      style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}
    >
      <h3 className="text-lg font-semibold mb-4 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
        Monthly Income & Expense Trends ({year})
      </h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#5a4a7a" />
            <XAxis dataKey="month" tick={{ fill: '#ffffff' }} />
            <YAxis tick={{ fill: '#ffffff' }} />
            <Tooltip 
              formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
              contentStyle={{ 
                backgroundColor: '#2d1b4e', 
                borderColor: '#5a4a7a', 
                color: '#ffffff',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend 
              wrapperStyle={{ color: '#ffffff' }}
            />
            <Bar dataKey="income" name="Income" fill="#0088FE" />
            <Bar dataKey="expense" name="Expense" fill="#FF8042" />
            <Bar dataKey="profit" name="Profit" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-[400px] text-white/70" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          No data available for {year}
        </div>
      )}
      
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Monthly Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="p-4"
            style={{ backgroundColor: 'rgba(0, 136, 254, 0.2)', borderColor: '#0088FE' }}
          >
            <p className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Total Income</p>
            <p className="text-2xl font-bold text-white mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              ₹{monthlyData.reduce((sum, month) => sum + month.income, 0).toLocaleString()}
            </p>
          </Card>
          <Card 
            className="p-4"
            style={{ backgroundColor: 'rgba(255, 128, 66, 0.2)', borderColor: '#FF8042' }}
          >
            <p className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Total Expenses</p>
            <p className="text-2xl font-bold text-white mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              ₹{monthlyData.reduce((sum, month) => sum + month.expense, 0).toLocaleString()}
            </p>
          </Card>
          <Card 
            className="p-4"
            style={{ backgroundColor: 'rgba(0, 196, 159, 0.2)', borderColor: '#00C49F' }}
          >
            <p className="text-sm font-medium text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Net Profit</p>
            <p className="text-2xl font-bold text-white mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>
              ₹{monthlyData.reduce((sum, month) => sum + month.profit, 0).toLocaleString()}
            </p>
          </Card>
        </div>
      </div>
    </Card>
  );
}
