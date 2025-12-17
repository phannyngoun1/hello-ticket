/**
 * UoM List Component
 *
 * Displays a list of units of measure using DataTable from custom-ui package
 *
 * @author Phanny
 */

import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  createIdentifierColumn,
  createTextColumn,
  createActionsColumn,
} from "@truths/custom-ui";
import { Edit, Trash2 } from "lucide-react";
import type { UnitOfMeasure } from "../types";

export interface UoMListProps {
  data?: UnitOfMeasure[];
  loading?: boolean;
  onCreate?: () => void;
  onEdit?: (uom: UnitOfMeasure) => void;
  onDelete?: (uom: UnitOfMeasure) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function UoMList({
  data = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onSearch,
  className,
}: UoMListProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<UnitOfMeasure>[] = [
    createIdentifierColumn<UnitOfMeasure>({
      accessorKey: "code",
      header: () => t("pages.settings.inventory.uom.code", "Code"),
      size: 100,
    }),
    createTextColumn<UnitOfMeasure>({
      accessorKey: "name",
      header: () => t("pages.settings.inventory.uom.name", "Name"),
      size: 150,
    }),
    createTextColumn<UnitOfMeasure>({
      accessorKey: "base_uom",
      header: () => t("pages.settings.inventory.uom.baseUom", "Base UOM"),
      size: 120,
      fallback: "-",
    }),
    createTextColumn<UnitOfMeasure>({
      accessorKey: "conversion_factor",
      header: () =>
        t("pages.settings.inventory.uom.conversionFactor", "Conversion Factor"),
      size: 150,
      cell: (info) => (
        <span className="text-xs font-mono">{info.getValue() as number}</span>
      ),
    }),
    createActionsColumn<UnitOfMeasure>({
      header: () => t("common.actions", "Actions"),
      size: 180,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (uom: UnitOfMeasure) => onEdit(uom),
                title: "Edit",
                // Default className from createActionsColumn is applied automatically
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: (uom: UnitOfMeasure) => onDelete(uom),
                title: "Delete",
                // Use ghost variant like edit button, with subtle destructive hover effect
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
      <DataTable<UnitOfMeasure>
        data={data}
        columns={columns}
        title={t("pages.settings.inventory.uom.title", "Units of Measure")}
        description={t("pages.settings.inventory.uom.list", "UOM List")}
        loading={loading}
        onCreate={onCreate}
        onSearch={onSearch}
        manualFiltering={!!onSearch}
        useDefaultColumns={false}
      />
    </div>
  );
}
