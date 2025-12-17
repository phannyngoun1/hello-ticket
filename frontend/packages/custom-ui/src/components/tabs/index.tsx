/**
 * Custom Tabs Component
 *
 * Custom tabs component with multiple variants and icon support
 * Features:
 * - Multiple visual variants (default, underline)
 * - Icon support in tabs
 * - Flexible styling options
 * - Accessibility built-in via Radix UI
 */

import * as React from "react";
import {
  Tabs as RadixTabs,
  TabsList as RadixTabsList,
  TabsTrigger as RadixTabsTrigger,
  TabsContent as RadixTabsContent,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface CustomTabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface CustomTabsProps {
  /** Default active tab value */
  defaultValue?: string;
  /** Controlled active tab value */
  value?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Tab items configuration */
  items?: CustomTabItem[];
  /** Visual variant */
  variant?: "default" | "underline";
  /** Additional className for root */
  className?: string;
  /** Additional className for tabs list */
  listClassName?: string;
  /** Additional className for tab trigger */
  triggerClassName?: string;
  /** Additional className for tab content */
  contentClassName?: string;
  /** Children - can be used instead of items prop for more control */
  children?: React.ReactNode;
}

export interface CustomTabsListProps {
  className?: string;
  variant?: "default" | "underline";
  children: React.ReactNode;
}

export interface CustomTabsTriggerProps {
  value: string;
  className?: string;
  variant?: "default" | "underline";
  icon?: LucideIcon;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface CustomTabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const CustomTabsList = React.forwardRef<
  React.ElementRef<typeof RadixTabsList>,
  CustomTabsListProps
>(({ className, variant = "default", children, ...props }, ref) => {
  return (
    <RadixTabsList
      ref={ref}
      className={cn(
        variant === "underline"
          ? "inline-flex h-auto items-center gap-4 border-b border-border mb-4 bg-transparent p-0"
          : "inline-flex h-auto gap-1 bg-muted/30 p-1 mb-2 rounded-lg border",
        className
      )}
      {...props}
    >
      {children}
    </RadixTabsList>
  );
});
CustomTabsList.displayName = "CustomTabsList";

const CustomTabsTrigger = React.forwardRef<
  React.ElementRef<typeof RadixTabsTrigger>,
  CustomTabsTriggerProps
>(({ className, variant = "default", icon: Icon, children, ...props }, ref) => {
  const content = (
    <span className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </span>
  );

  if (variant === "underline") {
    return (
      <RadixTabsTrigger
        ref={ref}
        className={cn(
          "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
          "border-transparent text-muted-foreground hover:text-foreground",
          "data-[state=active]:border-primary data-[state=active]:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {content}
      </RadixTabsTrigger>
    );
  }

  return (
    <RadixTabsTrigger
      ref={ref}
      className={cn(
        "h-7 px-3 text-xs font-medium rounded-md bg-transparent text-muted-foreground transition-all",
        "hover:text-foreground hover:bg-muted/50",
        "data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {content}
    </RadixTabsTrigger>
  );
});
CustomTabsTrigger.displayName = "CustomTabsTrigger";

const CustomTabsContent = React.forwardRef<
  React.ElementRef<typeof RadixTabsContent>,
  CustomTabsContentProps
>(({ className, children, ...props }, ref) => {
  return (
    <RadixTabsContent
      ref={ref}
      className={cn(
        "mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </RadixTabsContent>
  );
});
CustomTabsContent.displayName = "CustomTabsContent";

/**
 * Custom Tabs component with multiple variants
 */
export function CustomTabs({
  defaultValue,
  value,
  onValueChange,
  items,
  variant = "default",
  className,
  listClassName,
  triggerClassName,
  contentClassName,
  children,
}: CustomTabsProps) {
  // Radix UI requires either controlled (value + onValueChange) or uncontrolled (defaultValue)
  // Never pass both value and defaultValue simultaneously
  const tabsProps =
    value !== undefined
      ? { value, onValueChange, className }
      : { defaultValue, onValueChange, className };

  const tabsRoot = (
    <RadixTabs {...tabsProps}>
      {items ? (
        <>
          <CustomTabsList variant={variant} className={listClassName}>
            {items.map((item) => (
              <CustomTabsTrigger
                key={item.value}
                value={item.value}
                variant={variant}
                icon={item.icon}
                disabled={item.disabled}
                className={triggerClassName}
              >
                {item.label}
              </CustomTabsTrigger>
            ))}
          </CustomTabsList>
          {items.map((item) => (
            <CustomTabsContent
              key={item.value}
              value={item.value}
              className={contentClassName}
            >
              {item.content}
            </CustomTabsContent>
          ))}
        </>
      ) : (
        children
      )}
    </RadixTabs>
  );

  return tabsRoot;
}

// Export individual components for advanced usage
export { CustomTabsList, CustomTabsTrigger, CustomTabsContent };
