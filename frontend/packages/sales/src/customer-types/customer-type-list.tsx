/**
 * CustomerType List Component
 *
 * Displays a list of customer-types using DataTable from custom-ui package
 *
 * @author Phanny
 */

import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  createIdentifierColumn,
  createTextColumn,
  createDateTimeColumn,
  createActionsColumn,
} from "@truths/custom-ui";
import { Edit, Trash2 } from "lucide-react";
import type {CustomerType} from "./types";

export interface CustomerTypeListProps {
  data?: CustomerType[];
  loading?: boolean;
  onCreate?: () => void;
  onEdit?: (ct: CustomerType) => void;
  onDelete?: (ct: CustomerType) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function CustomerTypeList({
  data = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onSearch,
  className,
}: CustomerTypeListProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<CustomerType>[] = [

    createIdentifierColumn<CustomerType>({
      accessorKey: "code",
      header: () => t("pages.settings.sales.ct.code", "Code"),
      size: 100,
    }),

    createTextColumn<CustomerType>({
      accessorKey: "name",
      header: () => t("pages.settings.sales.ct.name", "Name"),
      size: 150,
    }),

    createActionsColumn<CustomerType>({
      header: () => t("common.actions", "Actions"),
      size: 180,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (ct: CustomerType) => onEdit(ct),
                title: "Edit",
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: (ct: CustomerType) => onDelete(ct),
                title: "Delete",
                className:
                  "h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              },
            ]
          : []),
      ],
    }),
  ];

  return (
    <div className={className}>
      <DataTable<CustomerType>
        data={data}
        columns={columns}
        title={t("pages.settings.sales.ct.title", "CustomerTypes")}
        description={t("pages.settings.sales.ct.list", "CustomerType List")}
        loading={loading}
        onCreate={onCreate}
        onSearch={onSearch}
        manualFiltering={!!onSearch}
        useDefaultColumns={false}
      />
    </div>
  );
}
