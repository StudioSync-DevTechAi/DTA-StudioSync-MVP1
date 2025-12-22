
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tags, Receipt } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinancesHeaderProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  handleNewTransaction: () => void;
}

export function FinancesHeader({ selectedYear, setSelectedYear, handleNewTransaction }: FinancesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Finances</h1>
        <p className="text-white/80 mt-2">
          Manage your business finances and track revenue
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Select 
          defaultValue={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" asChild>
          <Link to="/finances/categories">
            <Tags className="mr-2 h-4 w-4" />
            Manage Categories
          </Link>
        </Button>
        
        <Button onClick={handleNewTransaction}>
          <Receipt className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>
    </div>
  );
}
