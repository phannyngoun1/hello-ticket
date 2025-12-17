import React from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

export interface ColumnTextHeaderProps {
  /**
   * The header text content
   */
  children: React.ReactNode;
  /**
   * Alignment of the header text
   * @default "left"
   */
  align?: "left" | "right" | "center";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable column text header component for DataTable columns
 *
 * Provides consistent styling and alignment for table column headers.
 * Supports density modes for responsive text sizing.
 *
 * @example
 * // Left-aligned header (default)
 * header: () => <ColumnTextHeader>Name</ColumnTextHeader>
 *
 * @example
 * // Right-aligned header (for actions column)
 * header: () => <ColumnTextHeader align="right">Actions</ColumnTextHeader>
 *
 * @example
 * // With translation
 * header: () => <ColumnTextHeader>{t("common.name", "Name")}</ColumnTextHeader>
 */
export function ColumnTextHeader({
  children,
  align = "left",
  className,
}: ColumnTextHeaderProps) {
  const density = useDensityStyles();

  const alignmentClasses = {
    left: "text-left",
    right: "text-right w-full",
    center: "text-center",
  };

  return (
    <div
      className={cn(alignmentClasses[align], density.textSizeLabel, className)}
    >
      {children}
    </div>
  );
}
