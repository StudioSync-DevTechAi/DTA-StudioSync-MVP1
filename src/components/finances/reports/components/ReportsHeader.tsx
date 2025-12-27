
import React from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon, RefreshCw } from "lucide-react";

interface ReportsHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReportsHeader({ isLoading, onRefresh }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white" style={{ textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}>Financial Reports</h2>
        <p className="text-white/80 mt-1" style={{ textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
          Analyze your financial data and trends
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button 
          variant="outline"
          className="text-white border-[#5a4a7a] hover:bg-[#1a0f3d]"
          style={{ backgroundColor: '#2d1b4e', borderColor: '#5a4a7a', color: '#ffffff', borderWidth: '1.5px', borderStyle: 'solid' }}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Reports
        </Button>
      </div>
    </div>
  );
}
