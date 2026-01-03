/**
 * VenueType List Component
 *
 * Displays a list of venue-types using DataTable from custom-ui package
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
import type {VenueType} from "./types";

export interface VenueTypeListProps {
  data?: VenueType[];
  loading?: boolean;
  onCreate?: () => void;
  onEdit?: (vt: VenueType) => void;
  onDelete?: (vt: VenueType) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function VenueTypeList({
  data = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onSearch,
  className,
}: VenueTypeListProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<VenueType>[] = [

    createIdentifierColumn<VenueType>({
      accessorKey: "code",
      header: () => t("pages.settings.ticketing.vt.code", "Code"),
      size: 100,
    }),

    createTextColumn<VenueType>({
      accessorKey: "name",
      header: () => t("pages.settings.ticketing.vt.name", "Name"),
      size: 150,
    }),

    createActionsColumn<VenueType>({
      header: () => t("common.actions", "Actions"),
      size: 180,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (vt: VenueType) => onEdit(vt),
                title: "Edit",
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: (vt: VenueType) => onDelete(vt),
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
      <DataTable<VenueType>
        data={data}
        columns={columns}
        title={t("pages.settings.ticketing.vt.title", "VenueTypes")}
        description={t("pages.settings.ticketing.vt.list", "VenueType List")}
        loading={loading}
        onCreate={onCreate}
        onSearch={onSearch}
        manualFiltering={!!onSearch}
        useDefaultColumns={false}
      />
    </div>
  );
}
