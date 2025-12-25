import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onInput, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        textareaRef.current = node;
      },
      [ref]
    );

    const handleAutoResize = React.useCallback((e: React.FormEvent<HTMLTextAreaElement> | Event) => {
      const target = e.target as HTMLTextAreaElement;
      if (target) {
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }
      if (onInput) {
        onInput(e as React.FormEvent<HTMLTextAreaElement>);
      }
    }, [onInput]);

    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Set initial height
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        
        // Add input event listener for auto-resize
        textarea.addEventListener('input', handleAutoResize);
        
        return () => {
          textarea.removeEventListener('input', handleAutoResize);
        };
      }
    }, [handleAutoResize, props.value]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full min-w-0 max-w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
          className
        )}
        ref={combinedRef}
        onInput={handleAutoResize}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
