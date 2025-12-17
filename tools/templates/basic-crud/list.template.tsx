/**
 * {{EntityName}} List Component
 *
 * Displays a list of {{entity-plural}} using DataTable from custom-ui package
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
import type { {{EntityName}} } from "./types";

export interface {{EntityName}}ListProps {
  data?: {{EntityName}}[];
  loading?: boolean;
  onCreate?: () => void;
  onEdit?: ({{entityVar}}: {{EntityName}}) => void;
  onDelete?: ({{entityVar}}: {{EntityName}}) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function {{EntityName}}List({
  data = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onSearch,
  className,
}: {{EntityName}}ListProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<{{EntityName}}>[] = [
    {{#fields}}
    {{#if isIdentifier}}
    createIdentifierColumn<{{EntityName}}>({
      accessorKey: "{{name}}",
      header: () => t("pages.settings.{{packageName}}.{{entityVar}}.{{name}}", "{{label}}"),
      size: 100,
    }),
    {{else}}
    {{#if isDate}}
    createDateTimeColumn<{{EntityName}}>({
      accessorKey: "{{name}}",
      header: () => t("pages.settings.{{packageName}}.{{entityVar}}.{{name}}", "{{label}}"),
      size: 150,
    }),
    {{else}}
    createTextColumn<{{EntityName}}>({
      accessorKey: "{{name}}",
      header: () => t("pages.settings.{{packageName}}.{{entityVar}}.{{name}}", "{{label}}"),
      size: 150,
    }),
    {{/if}}
    {{/if}}
    {{/fields}}
    createActionsColumn<{{EntityName}}>({
      header: () => t("common.actions", "Actions"),
      size: 180,
      actions: [
        ...(onEdit
          ? [
              {
                icon: Edit,
                onClick: ({{entityVar}}: {{EntityName}}) => onEdit({{entityVar}}),
                title: "Edit",
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                icon: Trash2,
                onClick: ({{entityVar}}: {{EntityName}}) => onDelete({{entityVar}}),
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
      <DataTable<{{EntityName}}>
        data={data}
        columns={columns}
        title={t("pages.settings.{{packageName}}.{{entityVar}}.title", "{{EntityPlural}}")}
        description={t("pages.settings.{{packageName}}.{{entityVar}}.list", "{{EntityName}} List")}
        loading={loading}
        onCreate={onCreate}
        onSearch={onSearch}
        manualFiltering={!!onSearch}
        useDefaultColumns={false}
      />
    </div>
  );
}

