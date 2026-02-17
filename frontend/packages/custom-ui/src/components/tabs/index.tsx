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
  /** Tab items configuration - DEPRECATED: Use children instead for better reusability */
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
  /** Children - preferred way to define tabs for reusability */
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

// Button-based tabs component for simple use cases
export interface ButtonTabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface ButtonTabsProps {
  /** Array of tab items */
  tabs: ButtonTabItem[];
  /** Default active tab value */
  defaultValue?: string;
  /** Controlled active tab value */
  value?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Compact styling - smaller padding, text, and gaps */
  compact?: boolean;
  /** Additional className for root */
  className?: string;
  /** Additional className for tab button */
  tabClassName?: string;
  /** Additional className for content container */
  contentClassName?: string;
  /** Children to render based on active tab */
  children?: (activeTab: string) => React.ReactNode;
}

/**
 * Simple button-based tabs component
 *
 * A lightweight alternative to the full CustomTabs component.
 * Uses buttons with underline styling for active states.
 */
export function ButtonTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  compact = false,
  className,
  tabClassName,
  contentClassName,
  children,
}: ButtonTabsProps) {
  const [activeTab, setActiveTab] = React.useState<string>(
    value || defaultValue || tabs[0]?.value || ""
  );

  const currentValue = value !== undefined ? value : activeTab;

  const handleTabChange = (tabValue: string) => {
    if (value === undefined) {
      setActiveTab(tabValue);
    }
    onValueChange?.(tabValue);
  };

  React.useEffect(() => {
    if (value !== undefined && value !== activeTab) {
      setActiveTab(value);
    }
  }, [value, activeTab]);

  return (
    <div className={cn("", className)}>
      {/* Tab Bar */}
      <div className={cn("border-b", compact ? "mb-2" : "mb-4")}>
        <div className={cn("flex", compact ? "gap-1.5" : "gap-4")}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentValue === tab.value;

            return (
              <button
                key={tab.value}
                className={cn(
                  "border-b-2 font-medium transition-colors",
                  compact
                    ? "px-2 py-1 text-xs"
                    : "px-4 py-2 text-sm",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                  tab.disabled && "pointer-events-none opacity-50",
                  tabClassName
                )}
                onClick={() => !tab.disabled && handleTabChange(tab.value)}
                disabled={tab.disabled}
              >
                <span
                  className={cn("flex items-center", compact ? "gap-1" : "gap-2")}
                >
                  {Icon && (
                    <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
                  )}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={cn("mt-0", contentClassName)}>
        {children?.(currentValue)}
      </div>
    </div>
  );
}

// Export individual components for advanced usage
export { CustomTabsList, CustomTabsTrigger, CustomTabsContent };
