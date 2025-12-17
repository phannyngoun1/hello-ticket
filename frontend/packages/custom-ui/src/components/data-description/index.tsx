/**
 * Data Description Component
 *
 * A reusable component for displaying structured data in a grid layout with sections.
 * Each section contains a title (with optional icon) and a list of description fields.
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
