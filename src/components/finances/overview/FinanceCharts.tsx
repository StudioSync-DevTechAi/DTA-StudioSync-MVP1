
import React from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartPieChart,
  Pie,
  Cell
} from "recharts";

interface FinanceChartsProps {
  revenueData: {
    month: string;
    income: number;
    expense: number;
  }[];
  expenseByCategory: {
    category: string;
    amount: number;
  }[];
}

export function FinanceCharts({ revenueData, expenseByCategory }: FinanceChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mt-8">
      <Card className="p-6 transition-all hover:shadow-lg" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <h3 className="font-semibold mb-6 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Revenue Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              name="Income"
              dataKey="income"
              stroke="#0088FE"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              name="Expense"
              dataKey="expense"
              stroke="#FF8042"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 transition-all hover:shadow-lg" style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f' }}>
        <h3 className="font-semibold mb-6 text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Expenses by Category</h3>
        {expenseByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartPieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </RechartPieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-white/80" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
            No expense data available for this period
          </div>
        )}
      </Card>
    </div>
  );
}
