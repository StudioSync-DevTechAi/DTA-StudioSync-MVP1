
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg hover:scale-105 animated-inner-box",
        onClick && "cursor-pointer",
        className
      )}
      style={{ 
        backgroundColor: 'transparent',
        borderColor: '#ffffff',
        color: '#ffffff'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(26, 8, 61, 0.3)';
        e.currentTarget.style.borderColor = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = '#ffffff';
      }}
      onClick={onClick}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate -mt-1" style={{ color: '#ffffff' }}>{title}</p>
            <h3 
              className={cn(
                "text-xl sm:text-2xl font-semibold mt-1 sm:mt-2 break-words",
                onClick && "font-bold"
              )}
              style={{ color: '#ffffff' }}
            >
              {value}
            </h3>
            {trend && (
              <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {trend.value >= 0 ? "+" : "-"}{Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#ffffff' }} />
          </div>
        </div>
      </div>
    </Card>
  );
});
