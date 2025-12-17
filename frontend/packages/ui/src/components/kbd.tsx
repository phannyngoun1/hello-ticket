import * as React from "react";
import { cn } from "../lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Additional className */
  className?: string;
}

/**
 * Keyboard key badge component (shadcn/ui style)
 * 
 * Displays keyboard keys in a styled badge format
 */
const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd };

