import * as React from "react";
import { cn } from "../lib/utils";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
  }
>(({ className, children, orientation, ...props }, ref) => {
  // Check if any child is a textarea to determine layout, or use explicit orientation
  const isVertical = orientation === "vertical" || React.Children.toArray(children).some((child) => {
    if (React.isValidElement(child)) {
      const childType = child.type;
      const childDisplayName = typeof childType === 'object' && childType !== null ? (childType as any)?.displayName : null;
      return childDisplayName === 'InputGroupTextarea' ||
             (child.props?.children && React.isValidElement(child.props.children) && 
              child.props.children.type === 'textarea');
    }
    return false;
  });

  return (
    <div
      ref={ref}
      className={cn(
        "flex border rounded-md overflow-hidden",
        isVertical ? "flex-col" : "items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
InputGroup.displayName = "InputGroup";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 flex-1 border-0 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "inline-start" | "inline-end" | "block-end";
  }
>(({ className, align = "start", ...props }, ref) => {
  const isBlockEnd = align === "block-end";
  const isEnd = align === "end" || align === "inline-end";
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center px-3 py-2 text-sm text-muted-foreground bg-muted/50",
        isBlockEnd 
          ? "border-t w-full" 
          : isEnd 
            ? "border-l" 
            : "border-r",
        className
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = "InputGroupAddon";

/**
 * InputGroupText - Text content for InputGroup addons
 */
const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
InputGroupText.displayName = "InputGroupText";

/**
 * InputGroupTextarea - Textarea component that works within InputGroup
 */
const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full flex-1 border-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      className
    )}
    {...props}
  />
));
InputGroupTextarea.displayName = "InputGroupTextarea";

export { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText, InputGroupTextarea };
