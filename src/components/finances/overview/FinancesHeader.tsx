
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 xs:gap-4">
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-semibold tracking-tight text-white">Finances</h1>
        <p className="text-xs xs:text-sm sm:text-base text-white/80 mt-1 xs:mt-1.5 sm:mt-2">
          Manage your business finances and track revenue
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4 w-full sm:w-auto">
        <Select 
          defaultValue={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger 
            className="w-full xs:w-[100px] sm:w-[120px] text-xs xs:text-sm text-white placeholder:text-gray-400 h-9 xs:h-10"
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
          className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-9 xs:h-10 px-3 xs:px-4 flex-1 sm:flex-initial"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        >
          <Link to="/finances/categories">
            <Tags className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline">Manage Categories</span>
            <span className="xs:hidden">Categories</span>
          </Link>
        </Button>
        
        <Button 
          onClick={handleNewTransaction}
          className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] text-xs xs:text-sm h-9 xs:h-10 px-3 xs:px-4 flex-1 sm:flex-initial"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
        >
          <Receipt className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
          <span className="hidden xs:inline">New Transaction</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}
