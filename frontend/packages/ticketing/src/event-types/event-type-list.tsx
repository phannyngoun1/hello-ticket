/**
 * EventType List Component
 *
 * Displays a list of event-types using DataTable from custom-ui package
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
import type {EventType} from "./types";

export interface EventTypeListProps {
  data?: EventType[];
  loading?: boolean;
  onCreate?: () => void;
  onEdit?: (et: EventType) => void;
  onDelete?: (et: EventType) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function EventTypeList({
  data = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onSearch,
  className,
}: EventTypeListProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<EventType>[] = [

    createIdentifierColumn<EventType>({
      accessorKey: "code",
      header: () => t("pages.settings.ticketing.et.code", "Code"),
      size: 100,
    }),

    createTextColumn<EventType>({
      accessorKey: "name",
      header: () => t("pages.settings.ticketing.et.name", "Name"),
      size: 150,
    }),

    createActionsColumn<EventType>({
      header: () => t("common.actions", "Actions"),
      size: 180,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (et: EventType) => onEdit(et),
                title: "Edit",
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: (et: EventType) => onDelete(et),
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
      <DataTable<EventType>
        data={data}
        columns={columns}
        title={t("pages.settings.ticketing.et.title", "EventTypes")}
        description={t("pages.settings.ticketing.et.list", "EventType List")}
        loading={loading}
        onCreate={onCreate}
        onSearch={onSearch}
        manualFiltering={!!onSearch}
        useDefaultColumns={false}
      />
    </div>
  );
}
