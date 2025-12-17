import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, Button, cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { Link } from "@tanstack/react-router";
import { ColumnTextHeader } from "./column-text-header";
import type { ColumnTextHeaderProps } from "./column-text-header";
import type { LucideIcon } from "lucide-react";

/**
 * Options for creating a text column
 */
export interface CreateTextColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "username", "email", "name")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 150
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-muted-foreground truncate block text-xs"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Fallback value to display when the cell value is empty/null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable text column definition for data tables
 *
 * Text columns are typically used for regular text fields like username, email, etc.
 * They feature:
 * - Muted text styling for secondary information
 * - Truncation for long values
 * - Consistent sizing
 * - Support for i18n headers
 * - Optional fallback value for empty cells
 *
 * @example
 * // Basic usage with string header
 * const usernameColumn = createTextColumn<User>({
 *   accessorKey: "username",
 *   header: "Username",
 * });
 *
 * @example
 * // With translation
 * const emailColumn = createTextColumn<User>({
 *   accessorKey: "email",
 *   header: () => t("pages.users.email", "Email"),
 *   size: 250,
 * });
 *
 * @example
 * // Custom styling
 * const nameColumn = createTextColumn<Product>({
 *   accessorKey: "name",
 *   header: "Name",
 *   cellClassName: "text-muted-foreground truncate block text-xs font-medium",
 *   size: 200,
 * });
 *
 * @example
 * // Custom cell renderer
 * const statusColumn = createTextColumn<User>({
 *   accessorKey: "status",
 *   header: "Status",
 *   cell: (info) => (
 *     <Badge variant="outline">
 *       {info.getValue() as string}
 *     </Badge>
 *   ),
 * });
 */
export function createTextColumn<TData>(
  options: CreateTextColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 150,
    cellClassName = "text-foreground truncate block",
    headerAlign = "left",
    cell: customCell,
    fallback = "-",
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const value = info.getValue();
    return (
      <span className={cellClassName}>
        {value !== null && value !== undefined && value !== ""
          ? (value as string)
          : fallback}
      </span>
    );
  };

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a number column
 */
export interface CreateNumberColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "quantity", "price", "count")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 120
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-xs font-mono"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "right"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Fallback value to display when the cell value is empty/null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Number of decimal places to display
   * @default 0
   */
  decimals?: number;
  /**
   * Whether to use locale string formatting
   * @default true
   */
  useLocaleString?: boolean;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable number column definition for data tables
 *
 * Number columns are typically used for numeric values like quantities, prices, counts, etc.
 * They feature:
 * - Right-aligned text (numeric alignment)
 * - Monospace font for consistent digit width
 * - Locale-aware number formatting
 * - Configurable decimal places
 *
 * @example
 * // Basic usage
 * const quantityColumn = createNumberColumn<Product>({
 *   accessorKey: "quantity",
 *   header: "Quantity",
 * });
 *
 * @example
 * // With decimal places
 * const priceColumn = createNumberColumn<Product>({
 *   accessorKey: "price",
 *   header: "Price",
 *   decimals: 2,
 * });
 */
export function createNumberColumn<TData>(
  options: CreateNumberColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 120,
    cellClassName = "font-mono",
    headerAlign = "right",
    cell: customCell,
    fallback = "-",
    decimals = 0,
    useLocaleString = true,
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const value = info.getValue();
    if (value === null || value === undefined || value === "") {
      return <span className={cellClassName}>{fallback}</span>;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return <span className={cellClassName}>{fallback}</span>;
    }

    const formatted = useLocaleString
      ? numValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : decimals > 0
        ? numValue.toFixed(decimals)
        : numValue.toString();

    return <span className={cellClassName}>{formatted}</span>;
  };

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a date column
 */
export interface CreateDateColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "createdAt", "birthDate")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 120
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-xs"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Fallback value to display when the cell value is empty/null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Date format options
   * @default { dateStyle: "short" }
   */
  formatOptions?: Intl.DateTimeFormatOptions;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable date column definition for data tables
 *
 * Date columns are used for displaying date values.
 * They feature:
 * - Locale-aware date formatting
 * - Configurable date format options
 * - Consistent styling
 *
 * @example
 * // Basic usage
 * const createdAtColumn = createDateColumn<User>({
 *   accessorKey: "createdAt",
 *   header: "Created",
 * });
 *
 * @example
 * // With custom format
 * const birthDateColumn = createDateColumn<User>({
 *   accessorKey: "birthDate",
 *   header: "Birth Date",
 *   formatOptions: { dateStyle: "long" },
 * });
 */
export function createDateColumn<TData>(
  options: CreateDateColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 120,
    cellClassName = "",
    headerAlign = "left",
    cell: customCell,
    fallback = "-",
    formatOptions = { dateStyle: "short" },
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const value = info.getValue();
    if (value === null || value === undefined || value === "") {
      return <span className={cellClassName}>{fallback}</span>;
    }

    try {
      const date =
        value instanceof Date ? value : new Date(value as string | number);
      if (isNaN(date.getTime())) {
        return <span className={cellClassName}>{fallback}</span>;
      }
      const formatted = date.toLocaleDateString(undefined, formatOptions);
      return <span className={cellClassName}>{formatted}</span>;
    } catch {
      return <span className={cellClassName}>{fallback}</span>;
    }
  };

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a date-time column
 */
export interface CreateDateTimeColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "lastLogin", "updatedAt")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 180
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-xs"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Fallback value to display when the cell value is empty/null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Date-time format options
   * @default { dateStyle: "short", timeStyle: "short" }
   */
  formatOptions?: Intl.DateTimeFormatOptions;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable date-time column definition for data tables
 *
 * Date-time columns are used for displaying both date and time values.
 * They feature:
 * - Locale-aware date and time formatting
 * - Configurable format options
 * - Consistent styling
 *
 * @example
 * // Basic usage
 * const lastLoginColumn = createDateTimeColumn<User>({
 *   accessorKey: "lastLogin",
 *   header: "Last Login",
 * });
 */
export function createDateTimeColumn<TData>(
  options: CreateDateTimeColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 180,
    cellClassName = "",
    headerAlign = "left",
    cell: customCell,
    fallback = "-",
    formatOptions = { dateStyle: "short", timeStyle: "short" },
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const value = info.getValue();
    if (value === null || value === undefined || value === "") {
      return <span className={cellClassName}>{fallback}</span>;
    }

    try {
      const date =
        value instanceof Date ? value : new Date(value as string | number);
      if (isNaN(date.getTime())) {
        return <span className={cellClassName}>{fallback}</span>;
      }
      const formatted = date.toLocaleString(undefined, formatOptions);
      return <span className={cellClassName}>{formatted}</span>;
    } catch {
      return <span className={cellClassName}>{fallback}</span>;
    }
  };

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a percentage column
 */
export interface CreatePercentageColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "discount", "growthRate")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 120
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-xs font-mono"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "right"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Fallback value to display when the cell value is empty/null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Number of decimal places to display
   * @default 1
   */
  decimals?: number;
  /**
   * Whether the value is already a percentage (0-100) or a decimal (0-1)
   * If true, assumes value is 0-100; if false, assumes value is 0-1 and multiplies by 100
   * @default false
   */
  isDecimal?: boolean;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable percentage column definition for data tables
 *
 * Percentage columns are used for displaying percentage values.
 * They feature:
 * - Right-aligned text (numeric alignment)
 * - Automatic percentage symbol
 * - Support for both decimal (0-1) and percentage (0-100) formats
 * - Configurable decimal places
 *
 * @example
 * // Basic usage (assumes decimal 0-1)
 * const discountColumn = createPercentageColumn<Product>({
 *   accessorKey: "discount",
 *   header: "Discount",
 * });
 *
 * @example
 * // With percentage format (0-100)
 * const growthColumn = createPercentageColumn<Metric>({
 *   accessorKey: "growthRate",
 *   header: "Growth",
 *   isDecimal: true,
 *   decimals: 2,
 * });
 */
export function createPercentageColumn<TData>(
  options: CreatePercentageColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 120,
    cellClassName = "font-mono",
    headerAlign = "right",
    cell: customCell,
    fallback = "-",
    decimals = 1,
    isDecimal = false,
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const value = info.getValue();
    if (value === null || value === undefined || value === "") {
      return <span className={cellClassName}>{fallback}</span>;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return <span className={cellClassName}>{fallback}</span>;
    }

    // Convert decimal to percentage if needed
    const percentage = isDecimal ? numValue : numValue * 100;
    const formatted = percentage.toFixed(decimals);

    return <span className={cellClassName}>{formatted}%</span>;
  };

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a currency column
 */
export interface CreateCurrencyColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "price", "amount", "revenue")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 120
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-xs font-mono"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "right"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Fallback value to display when the cell value is empty/null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Currency code (ISO 4217)
   * @default "USD"
   */
  currency?: string;
  /**
   * Number of decimal places to display
   * @default 2
   */
  decimals?: number;
  /**
   * Whether to show currency symbol
   * @default true
   */
  showSymbol?: boolean;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable currency column definition for data tables
 *
 * Currency columns are used for displaying monetary values.
 * They feature:
 * - Right-aligned text (numeric alignment)
 * - Locale-aware currency formatting
 * - Configurable currency code and decimal places
 * - Automatic currency symbol
 *
 * @example
 * // Basic usage
 * const priceColumn = createCurrencyColumn<Product>({
 *   accessorKey: "price",
 *   header: "Price",
 * });
 *
 * @example
 * // With custom currency
 * const revenueColumn = createCurrencyColumn<Sale>({
 *   accessorKey: "revenue",
 *   header: "Revenue",
 *   currency: "EUR",
 *   decimals: 2,
 * });
 */
export function createCurrencyColumn<TData>(
  options: CreateCurrencyColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 120,
    cellClassName = "font-mono",
    headerAlign = "right",
    cell: customCell,
    fallback = "-",
    currency = "USD",
    decimals = 2,
    showSymbol = true,
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const value = info.getValue();
    if (value === null || value === undefined || value === "") {
      return <span className={cellClassName}>{fallback}</span>;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return <span className={cellClassName}>{fallback}</span>;
    }

    const formatted = showSymbol
      ? numValue.toLocaleString(undefined, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : numValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });

    return <span className={cellClassName}>{formatted}</span>;
  };

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a sequence column
 */
export interface CreateSequenceColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "order", "sequence", "index")
   */
  accessorKey?: keyof TData | string;
  /**
   * The header text or translation function
   * @default "#"
   */
  header?: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 60
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "text-xs font-mono text-muted-foreground"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "center"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   * Note: rowIndex is available via row.index
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData; index: number };
    rowIndex: number;
  }) => React.ReactNode;
  /**
   * Starting number for the sequence
   * @default 1
   */
  startFrom?: number;
  /**
   * Whether to use row index (0-based) or accessor value
   * @default true (uses row index)
   */
  useRowIndex?: boolean;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable sequence column definition for data tables
 *
 * Sequence columns are used for displaying row numbers or sequence values.
 * They feature:
 * - Center-aligned text
 * - Monospace font for consistent width
 * - Automatic row numbering
 * - Configurable starting number
 *
 * @example
 * // Basic usage (row numbers)
 * const sequenceColumn = createSequenceColumn<Product>();
 *
 * @example
 * // With custom header
 * const orderColumn = createSequenceColumn<Order>({
 *   header: "Order",
 *   startFrom: 1,
 * });
 *
 * @example
 * // Using accessor value instead of row index
 * const sequenceColumn = createSequenceColumn<Item>({
 *   accessorKey: "sequence",
 *   useRowIndex: false,
 * });
 */
export function createSequenceColumn<TData>(
  options: CreateSequenceColumnOptions<TData> = {}
): ColumnDef<TData> {
  const {
    accessorKey,
    header = "#",
    size = 60,
    cellClassName = "font-mono text-muted-foreground",
    headerAlign = "center",
    cell: customCell,
    startFrom = 1,
    useRowIndex = true,
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData; index: number };
  }) => {
    if (customCell) {
      return customCell({
        getValue: info.getValue,
        row: info.row,
        rowIndex: info.row.index,
      } as any);
    }

    let value: number;
    if (useRowIndex) {
      value = info.row.index + startFrom;
    } else {
      const accessorValue = accessorKey
        ? (info.row.original as any)[accessorKey]
        : null;
      value =
        accessorValue !== null && accessorValue !== undefined
          ? Number(accessorValue)
          : info.row.index + startFrom;
    }

    return <span className={cellClassName}>{value}</span>;
  };

  return {
    ...(accessorKey ? { accessorKey: accessorKey as string } : {}),
    id: (accessorKey as string) || "sequence",
    header: () => headerContent,
    cell: defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating an identifier column
 */
export interface CreateIdentifierColumnOptions<TData> {
  /**
   * The accessor key for the column (e.g., "code", "id", "sku")
   */
  accessorKey: keyof TData | string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 100
   */
  size?: number;
  /**
   * Custom CSS classes for the cell content
   * @default "font-medium truncate block"
   */
  cellClassName?: string;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Custom cell renderer function
   * If provided, this will override the default cell rendering
   */
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable identifier column definition for data tables
 *
 * Identifier columns are typically used for codes, IDs, SKUs, or other
 * short alphanumeric identifiers. They feature:
 * - Compact, medium-weight font styling
 * - Truncation for long values
 * - Consistent sizing
 * - Support for i18n headers
 *
 * @example
 * // Basic usage with string header
 * const codeColumn = createIdentifierColumn<UnitOfMeasure>({
 *   accessorKey: "code",
 *   header: "Code",
 * });
 *
 * @example
 * // With translation
 * const codeColumn = createIdentifierColumn<UnitOfMeasure>({
 *   accessorKey: "code",
 *   header: () => t("pages.settings.inventory.uom.code", "Code"),
 *   size: 120,
 * });
 *
 * @example
 * // Custom styling
 * const skuColumn = createIdentifierColumn<Product>({
 *   accessorKey: "sku",
 *   header: "SKU",
 *   cellClassName: "font-semibold truncate block text-xs text-primary",
 *   size: 150,
 * });
 *
 * @example
 * // Custom cell renderer
 * const idColumn = createIdentifierColumn<User>({
 *   accessorKey: "id",
 *   header: "ID",
 *   cell: (info) => (
 *     <span className="font-mono text-xs">
 *       #{info.getValue() as string}
 *     </span>
 *   ),
 * });
 */
export function createIdentifierColumn<TData>(
  options: CreateIdentifierColumnOptions<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    header,
    size = 100,
    cellClassName = "font-medium truncate block",
    headerAlign = "left",
    cell: customCell,
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default cell renderer
  const defaultCell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => <span className={cellClassName}>{info.getValue() as string}</span>;

  return {
    accessorKey: accessorKey as string,
    header: () => headerContent,
    cell: customCell || defaultCell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating an identified column
 *
 * Identified columns are used for entities that can be clicked to navigate to detail pages.
 * They feature:
 * - Avatar display (with fallback to initials)
 * - Clickable navigation
 * - Optional indicators/icons on the right side
 * - Support for both compact (no avatar) and full (with avatar) modes
 */
export interface CreateIdentifiedColumnOptions<TData> {
  /**
   * Function to get the display name/text for the entity
   */
  getDisplayName: (row: TData) => string;
  /**
   * Function to get the avatar URL (optional)
   */
  getAvatar?: (row: TData) => string | undefined;
  /**
   * Function to get initials for avatar fallback (optional)
   * If not provided, will use first letters of display name
   */
  getInitials?: (row: TData) => string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 250 (with avatar) or 200 (without avatar)
   */
  size?: number;
  /**
   * Whether to show avatar
   * @default true
   */
  showAvatar?: boolean;
  /**
   * Callback when the cell is clicked (for navigation)
   */
  onClick?: (row: TData, event: React.MouseEvent) => void;
  /**
   * Function to render optional indicators/icons on the right side of the text
   * These appear after the name text, before the end of the cell
   */
  renderIndicators?: (row: TData) => React.ReactNode;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable identified column definition for data tables
 *
 * Identified columns are used for entities (users, products, etc.) that:
 * - Can be clicked to navigate to detail pages
 * - Have visual identifiers like avatars
 * - May have status indicators/icons
 *
 * @example
 * // Basic usage with avatar
 * const userColumn = createIdentifiedColumn<User>({
 *   getDisplayName: (user) => `${user.firstName} ${user.lastName}`,
 *   getAvatar: (user) => user.avatar,
 *   getInitials: (user) => `${user.firstName[0]}${user.lastName[0]}`,
 *   header: "User",
 *   onClick: (user) => navigate(`/users/${user.id}`),
 * });
 *
 * @example
 * // With indicators on the right
 * const userColumn = createIdentifiedColumn<User>({
 *   getDisplayName: (user) => `${user.firstName} ${user.lastName}`,
 *   getAvatar: (user) => user.avatar,
 *   header: "User",
 *   onClick: (user) => navigate(`/users/${user.id}`),
 *   renderIndicators: (user) => (
 *     <>
 *       {user.isVerified && <CheckCircle className="h-3 w-3 text-green-500" />}
 *       {user.isLocked && <Lock className="h-3 w-3 text-red-500" />}
 *     </>
 *   ),
 * });
 *
 * @example
 * // Compact mode without avatar
 * const nameColumn = createIdentifiedColumn<Product>({
 *   getDisplayName: (product) => product.name,
 *   header: "Name",
 *   showAvatar: false,
 *   onClick: (product) => navigate(`/products/${product.id}`),
 * });
 */
export function createIdentifiedColumn<TData>(
  options: CreateIdentifiedColumnOptions<TData>
): ColumnDef<TData> {
  const {
    getDisplayName,
    getAvatar,
    getInitials,
    header,
    size,
    showAvatar = true,
    onClick,
    renderIndicators,
    headerAlign = "left",
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Default size based on whether avatar is shown
  const defaultSize = showAvatar ? 250 : 200;

  // Helper to get initials from display name if not provided
  const getInitialsFromName = (displayName: string): string => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || "?";
  };

  // Cell renderer component that uses density styles
  const NameCell = ({
    displayName,
    avatarUrl,
    initials,
    showAvatar,
    onClick: handleClick,
    renderIndicators,
    row,
  }: {
    displayName: string;
    avatarUrl?: string;
    initials: string;
    showAvatar: boolean;
    onClick: (e: React.MouseEvent) => void;
    renderIndicators?: (row: TData) => React.ReactNode;
    row: TData;
  }) => {
    const density = useDensityStyles();

    if (showAvatar) {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-medium">
                {initials}
              </div>
            )}
          </Avatar>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              className="text-left hover:underline flex-1 min-w-0"
              onClick={handleClick}
            >
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "font-medium truncate hover:underline text-primary hover:text-primary",
                    density.textSize
                  )}
                >
                  {displayName}
                </div>
              </div>
            </button>
            {renderIndicators && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {renderIndicators(row)}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        className={cn(
          "group font-medium truncate hover:underline text-left transition-colors group-hover:text-primary flex items-center gap-2 w-full",
          density.textSize
        )}
        onClick={handleClick}
      >
        <span className="flex-1 min-w-0 truncate">{displayName}</span>
        {renderIndicators && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {renderIndicators(row)}
          </div>
        )}
      </button>
    );
  };

  // Cell renderer
  const cell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const row = info.row.original;
    const displayName = getDisplayName(row);
    const avatarUrl = getAvatar?.(row);
    const initials = getInitials
      ? getInitials(row)
      : getInitialsFromName(displayName);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(row, e);
    };

    return (
      <NameCell
        displayName={displayName}
        avatarUrl={avatarUrl}
        initials={initials}
        showAvatar={showAvatar}
        onClick={handleClick}
        renderIndicators={renderIndicators}
        row={row}
      />
    );
  };

  // Generate id from header if it's a string, otherwise use a default
  const id =
    typeof header === "string"
      ? header.toLowerCase().replace(/\s+/g, "-")
      : "identified";

  return {
    id,
    accessorFn: (row) => getDisplayName(row),
    header: () => headerContent,
    cell,
    size: size ?? defaultSize,
    ...additionalOptions,
  };
}

/**
 * Options for creating an identified link column
 *
 * Identified link columns are used for entities that can be clicked to navigate to detail pages.
 * They feature:
 * - Display name (code or truncated ID)
 * - Optional Link component for navigation
 * - Fallback to plain text if no onClick handler is provided
 * - Consistent styling with primary text and hover effects
 */
export interface CreateIdentifiedLinkColumnOptions<TData> {
  /**
   * Function to get the display name/text for the entity (e.g., code or truncated ID)
   */
  getDisplayName: (row: TData) => string;
  /**
   * Function to get the ID for the entity (used for route params)
   */
  getId: (row: TData) => string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Route template for navigation (e.g., "/inventory/goods-receipts/$id")
   * Required if onClick is provided
   */
  routeTemplate?: string;
  /**
   * Callback when the link is clicked (for navigation)
   * If provided, the cell will render as a Link component
   * If not provided, the cell will render as plain text
   */
  onClick?: (row: TData, event: React.MouseEvent) => void;
  /**
   * Column width in pixels
   * @default 150
   */
  size?: number;
  /**
   * Custom CSS classes for the link/span content
   * @default "text-primary hover:underline font-bold" (for links) or empty (for plain text)
   */
  linkClassName?: string;
  /**
   * Custom CSS classes for plain text (when onClick is not provided)
   * @default ""
   */
  textClassName?: string;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable identified link column definition for data tables
 *
 * Identified link columns are used for entities (goods receipts, purchase orders, etc.) that:
 * - Have an identifier (code or ID)
 * - Can be clicked to navigate to detail pages
 * - Should display as a link when clickable, or plain text when not
 *
 * @example
 * // Basic usage with link
 * const codeColumn = createIdentifiedLinkColumn<GoodsReceipt>({
 *   getDisplayName: (gr) => gr.code || truncateId(gr.id),
 *   getId: (gr) => gr.id,
 *   header: "Code",
 *   routeTemplate: "/inventory/goods-receipts/$id",
 *   onClick: (gr, e) => onGoodsReceiptClick(gr),
 * });
 *
 * @example
 * // Without onClick (renders as plain text)
 * const codeColumn = createIdentifiedLinkColumn<GoodsReceipt>({
 *   getDisplayName: (gr) => gr.code || truncateId(gr.id),
 *   getId: (gr) => gr.id,
 *   header: "Code",
 * });
 *
 * @example
 * // With custom styling
 * const codeColumn = createIdentifiedLinkColumn<PurchaseOrder>({
 *   getDisplayName: (po) => po.code || truncateId(po.id),
 *   getId: (po) => po.id,
 *   header: "PO Code",
 *   routeTemplate: "/purchasing/purchase-orders/$id",
 *   onClick: (po, e) => onPurchaseOrderClick(po),
 *   linkClassName: "text-primary hover:underline font-semibold",
 *   size: 200,
 * });
 */
export function createIdentifiedLinkColumn<TData>(
  options: CreateIdentifiedLinkColumnOptions<TData>
): ColumnDef<TData> {
  const {
    getDisplayName,
    getId,
    header,
    routeTemplate,
    onClick,
    size = 150,
    linkClassName = "text-primary hover:underline font-bold",
    textClassName = "",
    headerAlign = "left",
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Cell renderer
  const cell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const row = info.row.original;
    const displayName = getDisplayName(row);
    const id = getId(row);

    if (onClick && routeTemplate) {
      return (
        <Link
          className={linkClassName}
          to={routeTemplate as any}
          params={{ id } as any}
          onClick={(e) => {
            e.stopPropagation();
            onClick(row, e);
          }}
        >
          {displayName}
        </Link>
      );
    }

    return <span className={textClassName}>{displayName}</span>;
  };

  // Generate id from header if it's a string, otherwise use a default
  const id =
    typeof header === "string"
      ? header.toLowerCase().replace(/\s+/g, "-")
      : "identified-link";

  return {
    id,
    accessorFn: (row) => getDisplayName(row),
    header: () => headerContent,
    cell,
    size,
    ...additionalOptions,
  };
}

/**
 * Options for creating a link column
 *
 * Link columns are used for optional relationships (e.g., purchase order, vendor)
 * that may or may not exist. They feature:
 * - Display code (from code field or truncated ID)
 * - Optional Link component for navigation when ID exists
 * - Fallback to "-" when ID is null/undefined
 * - Plain text display when no onClick handler is provided
 */
export interface CreateLinkColumnOptions<TData> {
  /**
   * Function to get the ID for the entity (can return null/undefined)
   */
  getId: (row: TData) => string | null | undefined;
  /**
   * Function to get the display code/text for the entity
   * Typically uses a code field if available, otherwise a truncated ID
   */
  getDisplayCode: (row: TData) => string;
  /**
   * The header text or translation function
   */
  header: string | (() => React.ReactNode);
  /**
   * Route template for navigation (e.g., "/purchasing/purchase-orders/$id")
   * Required if onClick is provided
   */
  routeTemplate?: string;
  /**
   * Callback when the link is clicked (for navigation)
   * If provided and ID exists, the cell will render as a Link component
   * If not provided, the cell will render as plain text
   */
  onClick?: (id: string, event: React.MouseEvent) => void;
  /**
   * Column width in pixels
   * @default 150
   */
  size?: number;
  /**
   * Custom CSS classes for the link content
   * @default "text-primary hover:underline"
   */
  linkClassName?: string;
  /**
   * Custom CSS classes for plain text (when onClick is not provided or ID is null)
   * @default "text-muted-foreground"
   */
  textClassName?: string;
  /**
   * Custom CSS classes for the fallback "-" when ID is null
   * @default "text-muted-foreground"
   */
  fallbackClassName?: string;
  /**
   * Fallback text to display when ID is null/undefined
   * @default "-"
   */
  fallback?: string;
  /**
   * Header alignment
   * @default "left"
   */
  headerAlign?: ColumnTextHeaderProps["align"];
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable link column definition for data tables
 *
 * Link columns are used for optional relationships (purchase orders, vendors, etc.) that:
 * - May or may not have an associated entity (ID can be null)
 * - Have a display code (from code field or truncated ID)
 * - Can be clicked to navigate to detail pages when ID exists
 * - Should display "-" when ID is null
 *
 * @example
 * // Basic usage with link
 * const poColumn = createLinkColumn<GoodsReceipt>({
 *   getId: (gr) => gr.purchase_order_id,
 *   getDisplayCode: (gr) => getDisplayCode(gr.purchase_order_id, gr.po_code),
 *   header: "PO",
 *   routeTemplate: "/purchasing/purchase-orders/$id",
 *   onClick: (id, _e) => onPurchaseOrderClick(id),
 * });
 *
 * @example
 * // Without onClick (renders as plain text)
 * const vendorColumn = createLinkColumn<GoodsReceipt>({
 *   getId: (gr) => gr.vendor_id,
 *   getDisplayCode: (gr) => getDisplayCode(gr.vendor_id, gr.vendor_code),
 *   header: "Vendor",
 * });
 *
 * @example
 * // With custom styling
 * const poColumn = createLinkColumn<GoodsReceipt>({
 *   getId: (gr) => gr.purchase_order_id,
 *   getDisplayCode: (gr) => getDisplayCode(gr.purchase_order_id, gr.po_code),
 *   header: "Purchase Order",
 *   routeTemplate: "/purchasing/purchase-orders/$id",
 *   onClick: (id, _e) => onPurchaseOrderClick(id),
 *   linkClassName: "text-primary hover:underline font-medium",
 *   size: 200,
 * });
 */
export function createLinkColumn<TData>(
  options: CreateLinkColumnOptions<TData>
): ColumnDef<TData> {
  const {
    getId,
    getDisplayCode,
    header,
    routeTemplate,
    onClick,
    size = 150,
    linkClassName = "text-primary hover:underline",
    textClassName = "text-muted-foreground",
    fallbackClassName = "text-muted-foreground",
    fallback = "-",
    headerAlign = "left",
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align={headerAlign}>{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align={headerAlign}>{header()}</ColumnTextHeader>
    );

  // Cell renderer
  const cell = (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => {
    const row = info.row.original;
    const id = getId(row);
    const displayCode = getDisplayCode(row);

    // If no ID, show fallback
    if (!id) {
      return <span className={fallbackClassName}>{fallback}</span>;
    }

    // If onClick and routeTemplate are provided, render as Link
    if (onClick && routeTemplate) {
      return (
        <Link
          className={linkClassName}
          to={routeTemplate as any}
          params={{ id } as any}
          onClick={(e) => {
            e.stopPropagation();
            onClick(id, e);
          }}
        >
          {displayCode}
        </Link>
      );
    }

    // Otherwise render as plain text
    return <span className={textClassName}>{displayCode}</span>;
  };

  // Generate id from header if it's a string, otherwise use a default
  const id =
    typeof header === "string"
      ? header.toLowerCase().replace(/\s+/g, "-")
      : "link";

  return {
    id,
    accessorFn: (row) => getDisplayCode(row),
    header: () => headerContent,
    cell,
    size,
    ...additionalOptions,
  };
}

/**
 * Action definition for actions column
 */
export interface ActionDefinition<TData> {
  /**
   * Icon component to display
   */
  icon: LucideIcon;
  /**
   * Click handler for the action
   */
  onClick: (row: TData, event: React.MouseEvent) => void;
  /**
   * Condition to show this action (optional)
   * If provided, the action will only be shown when this returns true
   */
  showWhen?: (row: TData) => boolean;
  /**
   * Condition to disable this action (optional)
   * If provided, the action will be disabled when this returns true
   */
  disabledWhen?: (row: TData) => boolean;
  /**
   * Tooltip/title text or function that returns tooltip text
   */
  title?: string | ((row: TData) => string);
  /**
   * Button variant
   * @default "ghost"
   */
  variant?:
    | "default"
    | "destructive"
    | "ghost"
    | "outline"
    | "secondary"
    | "link";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Button size
   * @default "sm"
   */
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Options for creating an actions column
 *
 * Actions columns are used for row-level actions like edit, delete, lock, etc.
 * They feature:
 * - Right-aligned header and content
 * - Icon buttons with tooltips
 * - Conditional rendering based on row state
 * - Support for custom actions override
 */
export interface CreateActionsColumnOptions<TData> {
  /**
   * The header text or translation function
   * @default "Actions"
   */
  header?: string | (() => React.ReactNode);
  /**
   * Column width in pixels
   * @default 180
   */
  size?: number;
  /**
   * List of action definitions
   * Each action will be rendered as an icon button
   */
  actions?: ActionDefinition<TData>[];
  /**
   * Custom actions renderer (optional)
   * If provided, this will override the default actions list
   */
  customActions?: (row: TData) => React.ReactNode;
  /**
   * Additional column definition options
   */
  additionalOptions?: Partial<ColumnDef<TData>>;
}

/**
 * Creates a reusable actions column definition for data tables
 *
 * Actions columns provide row-level actions like edit, delete, lock, etc.
 * They support:
 * - Multiple icon buttons with conditional rendering
 * - Custom action renderers
 * - Tooltips and disabled states
 * - Consistent styling and layout
 *
 * @example
 * // Basic usage with actions list
 * const actionsColumn = createActionsColumn<User>({
 *   actions: [
 *     {
 *       icon: Edit,
 *       onClick: (user) => onEdit(user),
 *       title: "Edit",
 *     },
 *     {
 *       icon: Trash2,
 *       onClick: (user) => onDelete(user),
 *       title: "Delete",
 *       variant: "destructive",
 *     },
 *   ],
 * });
 *
 * @example
 * // With conditional actions
 * const actionsColumn = createActionsColumn<User>({
 *   actions: [
 *     {
 *       icon: Lock,
 *       onClick: (user) => onLock(user),
 *       showWhen: (user) => !user.isLocked,
 *       disabledWhen: (user) => user.status !== "active",
 *       title: (user) => user.status !== "active" ? "Cannot lock inactive user" : "Lock",
 *     },
 *     {
 *       icon: Unlock,
 *       onClick: (user) => onUnlock(user),
 *       showWhen: (user) => user.isLocked,
 *       title: "Unlock",
 *     },
 *   ],
 * });
 *
 * @example
 * // With custom actions
 * const actionsColumn = createActionsColumn<User>({
 *   customActions: (user) => (
 *     <>
 *       <Button onClick={() => handleCustom(user)}>Custom</Button>
 *     </>
 *   ),
 * });
 */
export function createActionsColumn<TData>(
  options: CreateActionsColumnOptions<TData> = {}
): ColumnDef<TData> {
  const {
    header = "Actions",
    size = 180,
    actions = [],
    customActions,
    additionalOptions = {},
  } = options;

  // Determine header content
  const headerContent =
    typeof header === "string" ? (
      <ColumnTextHeader align="right">{header}</ColumnTextHeader>
    ) : (
      <ColumnTextHeader align="right">{header()}</ColumnTextHeader>
    );

  // Cell renderer
  const cell = (info: { row: { original: TData } }) => {
    const row = info.row.original;

    // Use custom actions if provided
    if (customActions) {
      return (
        <div className="flex items-center justify-end gap-0.5">
          {customActions(row)}
        </div>
      );
    }

    // Render actions from the actions list
    const visibleActions = actions.filter((action) => {
      if (action.showWhen) {
        return action.showWhen(row);
      }
      return true;
    });

    return (
      <div className="flex items-center justify-end gap-0.5">
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          const isDisabled = action.disabledWhen
            ? action.disabledWhen(row)
            : false;
          const titleText =
            typeof action.title === "function"
              ? action.title(row)
              : action.title || "";
          const variant = action.variant || "ghost";
          const buttonSize = action.size || "sm";

          // Default classes for icon buttons
          const defaultClassName =
            variant === "destructive"
              ? "h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              : "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors";

          return (
            <Button
              key={index}
              variant={variant}
              size={buttonSize}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(row, e);
              }}
              disabled={isDisabled}
              className={action.className || defaultClassName}
              title={titleText}
            >
              <Icon className="h-3 w-3" />
            </Button>
          );
        })}
      </div>
    );
  };

  return {
    id: "actions",
    header: () => headerContent,
    cell,
    size,
    ...additionalOptions,
  };
}
