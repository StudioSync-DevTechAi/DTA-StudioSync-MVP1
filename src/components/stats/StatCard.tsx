
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
        "relative overflow-hidden transition-all hover:shadow-lg hover:scale-105 animated-inner-box w-full",
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
      <div className="p-3 xs:p-4 sm:p-5 md:p-6 w-full">
        <div className="flex items-center justify-between gap-1.5 xs:gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] xs:text-xs sm:text-sm font-medium truncate -mt-0.5 xs:-mt-1" style={{ color: '#ffffff', textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>{title}</p>
            <h3 
              className={cn(
                "text-lg xs:text-xl sm:text-2xl font-semibold mt-0.5 xs:mt-1 sm:mt-2 break-words",
                onClick && "font-bold"
              )}
              style={{ color: '#ffffff', textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 2px' }}
            >
              {value}
            </h3>
            {trend && (
              <p className="text-[10px] xs:text-xs mt-0.5 xs:mt-1 truncate" style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 2px' }}>
                {trend.value >= 0 ? "+" : "-"}{Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" style={{ color: '#ffffff' }} />
          </div>
        </div>
      </div>
    </Card>
  );
});
