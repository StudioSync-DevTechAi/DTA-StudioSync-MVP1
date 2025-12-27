import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkInProgressProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "badge" | "banner" | "card";
  text?: string;
}

export function WorkInProgress({ 
  className, 
  size = "md", 
  showText = true, 
  variant = "badge",
  text = "Work in Progress"
}: WorkInProgressProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  if (variant === "banner") {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg",
        className
      )}>
        <img 
          src="/WorkInProgress_WebApp.svg" 
          alt="Work in Progress" 
          className={cn("rounded-md", sizeClasses[size])}
        />
        {showText && (
          <span className={cn("font-medium text-amber-800", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn(
        "flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-sm",
        className
      )}>
        <img 
          src="/WorkInProgress_WebApp.svg" 
          alt="Work in Progress" 
          className={cn("rounded-md h-5 w-5")}
        />
        <div>
          <h3 className={cn("font-semibold text-amber-900 text-xs")}>
            {text}
          </h3>
          <p className="text-[10px] text-amber-700">
            This feature is currently under development
          </p>
        </div>
      </div>
    );
  }

  // Default badge variant
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
        className
      )}
    >
      <img 
        src="/WorkInProgress_WebApp.svg" 
        alt="Work in Progress" 
        className={cn("rounded-sm", sizeClasses[size])}
      />
      {showText && (
        <span className={cn("font-medium", textSizes[size])}>
          {text}
        </span>
      )}
    </Badge>
  );
}
