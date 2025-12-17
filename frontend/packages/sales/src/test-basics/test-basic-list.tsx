/**
 * TestBasic List Component
 *
 * Displays a list of test-basics using DataTable from custom-ui package
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
import type {TestBasic} from "./types";

export interface TestBasicListProps {
  data?: TestBasic[];
  loading?: boolean;
  onCreate?: () => void;
  onEdit?: (tb: TestBasic) => void;
  onDelete?: (tb: TestBasic) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function TestBasicList({
  data = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onSearch,
  className,
}: TestBasicListProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<TestBasic>[] = [

    createIdentifierColumn<TestBasic>({
      accessorKey: "code",
      header: () => t("pages.settings.sales.tb.code", "Code"),
      size: 100,
    }),

    createTextColumn<TestBasic>({
      accessorKey: "name",
      header: () => t("pages.settings.sales.tb.name", "Name"),
      size: 150,
    }),

    createActionsColumn<TestBasic>({
      header: () => t("common.actions", "Actions"),
      size: 180,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: (tb: TestBasic) => onEdit(tb),
                title: "Edit",
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: (tb: TestBasic) => onDelete(tb),
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
      <DataTable<TestBasic>
        data={data}
        columns={columns}
        title={t("pages.settings.sales.tb.title", "TestBasics")}
        description={t("pages.settings.sales.tb.list", "TestBasic List")}
        loading={loading}
        onCreate={onCreate}
        onSearch={onSearch}
        manualFiltering={!!onSearch}
        useDefaultColumns={false}
      />
    </div>
  );
}
