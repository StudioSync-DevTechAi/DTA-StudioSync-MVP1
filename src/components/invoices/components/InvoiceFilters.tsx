
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
}

export function InvoiceFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}: InvoiceFiltersProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
        <Input
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-white placeholder:text-gray-400"
          style={{ backgroundColor: 'rgba(45, 27, 78, 0.95)', borderColor: '#3d2a5f', color: '#ffffff' }}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
            style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
          >
            <Filter className="h-4 w-4" />
            {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All Status"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#2d1b4e] border-[#3d2a5f]">
          <DropdownMenuItem 
            onClick={() => setStatusFilter(null)}
            className="text-white hover:bg-white/10"
          >
            All Status
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setStatusFilter("paid")}
            className="text-white hover:bg-white/10"
          >
            Paid
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setStatusFilter("partial")}
            className="text-white hover:bg-white/10"
          >
            Partial
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setStatusFilter("pending")}
            className="text-white hover:bg-white/10"
          >
            Pending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
