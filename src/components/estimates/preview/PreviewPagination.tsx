
import { Button } from "@/components/ui/button";

interface PreviewPaginationProps {
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
}

export function PreviewPagination({ 
  currentPageIndex, 
  setCurrentPageIndex 
}: PreviewPaginationProps) {
  return (
    <div className="flex justify-between items-center">
      <Button
        onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
        disabled={currentPageIndex === 0}
        variant="outline"
        className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] disabled:opacity-50"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        Previous
      </Button>
      <div className="flex space-x-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Button
            key={index}
            variant={currentPageIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPageIndex(index)}
            className={`px-3 py-1 ${
              currentPageIndex === index 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "text-white border-[#3d2a5f] hover:bg-[#1a0f3d]"
            }`}
            style={currentPageIndex === index 
              ? {} 
              : { backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }
            }
          >
            {index === 0 ? "Intro" : 
             index === 1 ? "Services" : 
             index === 2 ? "Estimate" : 
             index === 3 ? "Portfolio" : "Template"}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => setCurrentPageIndex(Math.min(4, currentPageIndex + 1))}
        disabled={currentPageIndex === 4}
        variant="outline"
        className="text-white border-[#3d2a5f] hover:bg-[#1a0f3d] disabled:opacity-50"
        style={{ backgroundColor: '#2d1b4e', borderColor: '#3d2a5f', color: '#ffffff' }}
      >
        Next
      </Button>
    </div>
  );
}
