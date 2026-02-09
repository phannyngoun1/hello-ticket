import * as React from "react";
import { cn } from "../lib/utils";

// Helper to safely get density styles
// This ensures hooks are always called unconditionally
function useDensityStylesSafe() {
  // Try to import and use the hook if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let densityStyles: any = null;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const utilsModule = require("@truths/utils");
    if (utilsModule && typeof utilsModule.useDensityStyles === "function") {
      // Always call the hook - React requires unconditional hook calls
      densityStyles = utilsModule.useDensityStyles();
    }
  } catch {
    // @truths/utils not available, will use defaults
  }
  
  return densityStyles;
}

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const densityStyles = useDensityStylesSafe();
  const defaultPadding = "p-6";
  const padding = densityStyles?.paddingCardHeader || defaultPadding;
  
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", padding, className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const densityStyles = useDensityStylesSafe();
  const defaultSize = "text-2xl";
  const textSize = densityStyles?.textSizeCardTitle || defaultSize;
  
  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        textSize,
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const densityStyles = useDensityStylesSafe();
  const defaultSize = "text-sm";
  const textSize = densityStyles?.textSizeCardDescription || defaultSize;
  
  return (
    <p
      ref={ref}
      className={cn("text-muted-foreground", textSize, className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const densityStyles = useDensityStylesSafe();
  const defaultPadding = "p-6 pt-0";
  const padding = densityStyles?.paddingCardContent || defaultPadding;
  
  return (
    <div ref={ref} className={cn(padding, className)} {...props} />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const densityStyles = useDensityStylesSafe();
  const defaultPadding = "p-6 pt-0";
  const padding = densityStyles?.paddingCardFooter || defaultPadding;
  
  return (
    <div
      ref={ref}
      className={cn("flex items-center", padding, className)}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
