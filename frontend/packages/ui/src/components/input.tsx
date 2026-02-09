import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

// Helper hook to safely use density styles
function useDensityStylesSafe() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let densityStyles: any = null;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const utilsModule = require("@truths/utils");
    if (utilsModule && utilsModule.useDensityStyles) {
      densityStyles = utilsModule.useDensityStyles();
    }
  } catch {
    // @truths/utils not available, will use defaults
  }
  
  return densityStyles;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const densityStyles = useDensityStylesSafe();
    const defaultHeight = "h-10";
    const defaultTextSize = "text-sm";
    const height = densityStyles?.inputHeight || defaultHeight;
    const textSize = densityStyles?.textSize || defaultTextSize;
    
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground placeholder:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          height,
          textSize,
          "file:text-sm", // Keep file input text size consistent
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
