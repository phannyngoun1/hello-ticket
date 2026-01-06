/**
 * Data Description Components
 *
 * Reusable components for displaying structured data in a grid layout.
 * Includes DescriptionList for sections and DescriptionItem for individual fields.
 *
 * @author Phanny
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@truths/ui";

export interface DataDescriptionField {
  /** Label for the field */
  label: string;
  /** Value to display. Can be a primitive value, React component, or null/undefined. If null/undefined/empty, the field won't be rendered */
  value?: string | number | Date | React.ReactNode | null;
  /** Custom render function for the value */
  render?: (value: unknown) => React.ReactNode;
  /** Whether to preserve whitespace (e.g., for multi-line text) */
  preserveWhitespace?: boolean;
  /** Type of link to create (email, tel, or none). Only applies to string values. */
  linkType?: "email" | "tel" | "none";
  /** Custom className for the dd element */
  className?: string;
}

export interface DataDescriptionSection {
  /** Title of the section */
  title: string;
  /** Optional icon to display next to the title */
  icon?: LucideIcon;
  /** Fields to display in this section */
  fields: DataDescriptionField[];
  /** Custom className for the section container */
  className?: string;
}

export interface DataDescriptionProps {
  /** Array of sections to display */
  sections: DataDescriptionSection[];
  /** Number of columns in the grid (default: 3) */
  columns?: 1 | 2 | 3 | 4;
  /** Custom className for the root container */
  className?: string;
  /** Custom className for the grid container */
  gridClassName?: string;
  /** Function to format field values (default: simple string conversion) */
  formatValue?: (value: unknown) => string;
}

/**
 * Default value formatter
 */
function defaultFormatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "N/A";
    const potentialDate = new Date(trimmed);
    if (!Number.isNaN(potentialDate.getTime())) {
      return potentialDate.toLocaleString();
    }
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * DataDescription - A reusable component for displaying structured data in sections
 *
 * @example
 * ```tsx
 * <DataDescription
 *   sections={[
 *     {
 *       title: "Basic Information",
 *       fields: [
 *         { label: "Name", value: "John Doe" },
 *         { label: "Email", value: "john@example.com", linkType: "email" },
 *         { label: "Status", value: <Badge>Active</Badge> },
 *       ],
 *     },
 *     {
 *       title: "Contact",
 *       icon: Phone,
 *       fields: [
 *         { label: "Phone", value: "+1234567890", linkType: "tel" },
 *       ],
 *     },
 *   ]}
 * />
 * ```
 */
export function DataDescription({
  sections,
  columns = 3,
  className,
  gridClassName,
  formatValue = defaultFormatValue,
}: DataDescriptionProps) {
  const gridColsClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns];

  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn("grid gap-6", gridColsClass, gridClassName)}>
        {sections.map((section, sectionIndex) => {
          const Icon = section.icon;
          const visibleFields = section.fields.filter((field) => {
            if (field.value === null || field.value === undefined) {
              return false;
            }
            // React components are always considered visible
            if (React.isValidElement(field.value)) {
              return true;
            }
            if (typeof field.value === "string") {
              return field.value.trim() !== "";
            }
            return true;
          });

          if (visibleFields.length === 0) {
            return null;
          }

          return (
            <div key={sectionIndex} className={section.className}>
              <h3
                className={cn(
                  "mb-4 text-sm font-medium text-muted-foreground",
                  Icon && "flex items-center gap-2"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {section.title}
              </h3>
              <dl className="space-y-3">
                {visibleFields.map((field, fieldIndex) => {
                  // If value is a React component, use it directly (or render function if provided)
                  const isReactComponent = React.isValidElement(field.value);

                  let displayValue: React.ReactNode;
                  if (field.render) {
                    displayValue = field.render(field.value);
                  } else if (isReactComponent) {
                    // field.value is already validated as a React element
                    displayValue = field.value as React.ReactNode;
                  } else {
                    // formatValue always returns a string, which is a valid ReactNode
                    displayValue = formatValue(field.value);
                  }

                  const linkType = field.linkType ?? "none";
                  const isLink =
                    linkType !== "none" &&
                    !isReactComponent &&
                    typeof field.value === "string" &&
                    field.value.trim() !== "";

                  const linkHref =
                    linkType === "email"
                      ? `mailto:${field.value}`
                      : linkType === "tel"
                        ? `tel:${field.value}`
                        : undefined;

                  return (
                    <div key={fieldIndex}>
                      <dt className="text-sm font-medium">{field.label}</dt>
                      <dd
                        className={cn(
                          "mt-1 text-sm",
                          isLink
                            ? "text-primary hover:underline"
                            : !isReactComponent && "text-muted-foreground",
                          field.preserveWhitespace && "whitespace-pre-wrap",
                          field.className
                        )}
                      >
                        {isLink ? (
                          <a href={linkHref}>{displayValue}</a>
                        ) : (
                          displayValue
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * DescriptionSection - A nested section within a DescriptionList
 */
export interface DescriptionSectionProps {
  /** Title of the subsection */
  title: string;
  /** Custom className for the section container */
  className?: string;
  /** Children (DescriptionItem components) */
  children: React.ReactNode;
  /** Whether to show a border separator above this section */
  showBorder?: boolean;
}

/**
 * DescriptionSection - A subsection within DescriptionList for grouping related items
 *
 * @example
 * ```tsx
 * <DescriptionList title="Preferences">
 *   <DescriptionItem label="Language" value="English" />
 *   <DescriptionSection title="Emergency Contact" showBorder>
 *     <DescriptionItem label="Name" value="John Doe" />
 *     <DescriptionItem label="Phone" value="+1234567890" linkType="tel" />
 *   </DescriptionSection>
 * </DescriptionList>
 * ```
 */
export function DescriptionSection({
  title,
  className,
  children,
  showBorder = false,
}: DescriptionSectionProps) {
  return (
    <div className={cn(showBorder && "pt-2 border-t", className)}>
      <h4 className="text-sm font-medium mb-3">{title}</h4>
      {children}
    </div>
  );
}

/**
 * DescriptionItem - Individual label/value pair component
 */
export interface DescriptionItemProps {
  /** Label text */
  label: string;
  /** Value to display. Can be string, number, Date, React component, or null/undefined */
  value?: string | number | Date | React.ReactNode | null;
  /** Custom render function for the value */
  render?: (value: unknown) => React.ReactNode;
  /** Whether to preserve whitespace (e.g., for multi-line text) */
  preserveWhitespace?: boolean;
  /** Type of link to create (email, tel, external, or none). Only applies to string values. */
  linkType?: "email" | "tel" | "external" | "none";
  /** Custom className for the dd element */
  className?: string;
  /** Custom className for the dt element */
  labelClassName?: string;
  /** Custom className for the value text (applied to dd content) */
  valueClassName?: string;
  /** Icon to display next to the label */
  icon?: LucideIcon;
  /** Grid column span classes (e.g., "md:col-span-2 lg:col-span-3") */
  span?: string;
  /** Whether to hide this item if value is falsy (default: true) */
  hideIfEmpty?: boolean;
}

/**
 * DescriptionItem - A single label/value pair in a description list
 *
 * @example
 * ```tsx
 * <DescriptionItem
 *   label="Email"
 *   value="user@example.com"
 *   linkType="email"
 * />
 * ```
 */
export function DescriptionItem({
  label,
  value,
  render,
  preserveWhitespace = false,
  linkType = "none",
  className,
  labelClassName,
  valueClassName,
  icon: Icon,
  span,
  hideIfEmpty = true,
}: DescriptionItemProps) {
  // Don't render if value is null, undefined, or empty string (unless hideIfEmpty is false)
  if (hideIfEmpty && (value === null || value === undefined)) {
    return null;
  }
  if (hideIfEmpty && typeof value === "string" && value.trim() === "") {
    return null;
  }

  // If value is a React component, use it directly (or render function if provided)
  const isReactComponent = React.isValidElement(value);

  let displayValue: React.ReactNode;
  if (render) {
    displayValue = render(value);
  } else if (isReactComponent) {
    displayValue = value as React.ReactNode;
  } else {
    displayValue = defaultFormatValue(value);
  }

  const isLink =
    linkType !== "none" &&
    !isReactComponent &&
    typeof value === "string" &&
    value.trim() !== "";

  const linkHref =
    linkType === "email"
      ? `mailto:${value}`
      : linkType === "tel"
        ? `tel:${value}`
        : linkType === "external"
          ? (value as string)
          : undefined;

  const linkProps =
    linkType === "external"
      ? {
          target: "_blank",
          rel: "noopener noreferrer",
        }
      : {};

  return (
    <div className={span}>
      <dt
        className={cn(
          "text-sm font-medium flex items-center gap-1",
          labelClassName
        )}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm",
          isLink
            ? "text-primary hover:underline"
            : !isReactComponent && "text-muted-foreground",
          preserveWhitespace && "whitespace-pre-wrap",
          valueClassName,
          className
        )}
      >
        {isLink ? (
          <a href={linkHref} {...linkProps}>
            {displayValue}
          </a>
        ) : (
          displayValue
        )}
      </dd>
    </div>
  );
}

/**
 * DescriptionList - A section container for description items
 */
export interface DescriptionListProps {
  /** Title of the section */
  title?: string;
  /** Icon to display next to the title */
  icon?: LucideIcon;
  /** Number of columns in the grid (default: 3) */
  columns?: 2 | 3 | 4;
  /** Custom className for the section container */
  className?: string;
  /** Custom className for the grid container */
  gridClassName?: string;
  /** Children (DescriptionItem and DescriptionSection components) */
  children: React.ReactNode;
  /** Whether this section should only render if it has visible children */
  conditional?: boolean;
}

/**
 * DescriptionList - A section container for description items
 *
 * @example
 * ```tsx
 * <DescriptionList title="Contact Information" columns={3}>
 *   <DescriptionItem label="Name" value="John Doe" />
 *   <DescriptionItem label="Email" value="john@example.com" linkType="email" />
 *   <DescriptionItem label="Phone" value="+1234567890" linkType="tel" />
 * </DescriptionList>
 * ```
 */
export function DescriptionList({
  title,
  icon: Icon,
  columns = 3,
  className,
  gridClassName,
  children,
  conditional = true,
}: DescriptionListProps) {
  // Filter out null children (DescriptionItem returns null when value is empty)
  const visibleChildren = React.Children.toArray(children).filter(
    (child) => child !== null && child !== undefined
  );

  // If conditional and no visible children, don't render
  if (conditional && visibleChildren.length === 0) {
    return null;
  }

  const gridColsClass = {
    2: "grid gap-4 md:grid-cols-2",
    3: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
    4: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={className}>
      {title && (
        <h3
          className={cn(
            "mb-4 text-sm font-semibold text-foreground",
            Icon && "flex items-center gap-2"
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </h3>
      )}
      <div className={cn(gridColsClass, gridClassName)}>{children}</div>
    </div>
  );
}
