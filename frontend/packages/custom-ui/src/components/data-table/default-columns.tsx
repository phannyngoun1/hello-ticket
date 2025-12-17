import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@truths/ui";
import {
  createIdentifierColumn,
  createTextColumn,
} from "./column-helpers";
import type { DataRow } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultColumns: ColumnDef<DataRow, any>[] = [
  createIdentifierColumn<DataRow>({
    accessorKey: "id",
    header: "ID",
    size: 80,
    cellClassName: "font-mono",
  }),
  createTextColumn<DataRow>({
    accessorKey: "name",
    header: "Name",
    size: 150,
    cellClassName: "font-medium truncate block",
  }),
  createTextColumn<DataRow>({
    accessorKey: "email",
    header: "Email",
    size: 200,
  }),
  createTextColumn<DataRow>({
    accessorKey: "department",
    header: "Department",
    size: 120,
    cellClassName: "truncate block",
  }),
  createTextColumn<DataRow>({
    accessorKey: "status",
    header: "Status",
    size: 100,
    cell: (info) => {
      const status = info.getValue() as "active" | "inactive" | "pending";
      const variants: Record<
        typeof status,
        "default" | "secondary" | "outline"
      > = {
        active: "default",
        inactive: "secondary",
        pending: "outline",
      };
      return (
        <Badge variant={variants[status]} className="text-xs">
          {status}
        </Badge>
      );
    },
    additionalOptions: {
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
  }),
  createTextColumn<DataRow>({
    accessorKey: "revenue",
    header: "Revenue",
    size: 120,
    cell: (info) => (
      <span className="font-mono">
        ${(info.getValue() as number).toLocaleString()}
      </span>
    ),
  }),
  createTextColumn<DataRow>({
    accessorKey: "createdAt",
    header: "Created",
    size: 100,
    cell: (info) => (
      <span>
        {new Date(info.getValue() as string).toLocaleDateString()}
      </span>
    ),
  }),
  createTextColumn<DataRow>({
    accessorKey: "lastLogin",
    header: "Last Login",
    size: 100,
    cell: (info) => (
      <span>
        {new Date(info.getValue() as string).toLocaleDateString()}
      </span>
    ),
  }),
];
