
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
          <SelectTrigger 
            className="w-[120px] text-white placeholder:text-gray-400"
            style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
          >
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d1b4e] border-[#3d2a5f]">
            <SelectItem value="2024" className="text-white hover:bg-white/10">2024</SelectItem>
            <SelectItem value="2023" className="text-white hover:bg-white/10">2023</SelectItem>
            <SelectItem value="2022" className="text-white hover:bg-white/10">2022</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          asChild
          className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        >
          <Link to="/finances/categories">
            <Tags className="mr-2 h-4 w-4" />
            Manage Categories
          </Link>
        </Button>
        
        <Button 
          onClick={handleNewTransaction}
          className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        >
          <Receipt className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>
    </div>
  );
}
