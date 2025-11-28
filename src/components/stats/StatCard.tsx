
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
        "relative overflow-hidden transition-all hover:shadow-lg",
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <h3 className={cn(
              "text-xl sm:text-2xl font-semibold mt-1 sm:mt-2 break-words",
              onClick && "text-blue-600 font-bold"
            )}>{value}</h3>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {trend.value >= 0 ? "+" : "-"}{Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </div>
    </Card>
  );
});
