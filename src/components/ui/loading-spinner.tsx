import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  text = "Loading...",
  fullScreen = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16", 
    lg: "h-24 w-24"
  };

  const containerClasses = fullScreen 
    ? "flex min-h-screen items-center justify-center"
    : "flex items-center justify-center";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <img 
          src="/images/camera_png.png" 
          alt="Loading" 
          className={cn(
            "animate-spin mx-auto",
            sizeClasses[size],
            className
          )}
          style={{ animationDuration: '2s' }}
        />
        {text && (
          <p className="mt-4 text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

// Inline loading spinner for buttons and small components
export function InlineLoadingSpinner({ 
  className, 
  size = "sm"
}: { 
  className?: string; 
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <img 
      src="/images/camera_png.png" 
      alt="Loading" 
      className={cn(
        "animate-spin inline-block",
        sizeClasses[size],
        className
      )}
      style={{ animationDuration: '2s' }}
    />
  );
}