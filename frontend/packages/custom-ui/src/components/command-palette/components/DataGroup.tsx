import { CommandGroup, CommandItem } from "@truths/ui";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { DataTypeConfig, BaseDataItem } from "../types";

interface DataGroupProps {
  dataType: DataTypeConfig<BaseDataItem> & {
    data: any[];
    isLoading: boolean;
    error: any;
    isError: boolean;
  };
  scope: string;
  onSelect: (callback: () => void) => void;
  dataQueries: Record<string, any>;
}

/**
 * Generic data group renderer component
 */
export function DataGroup({
  dataType,
  scope,
  onSelect,
  dataQueries,
}: DataGroupProps) {
  const navigate = useNavigate();
  if (dataType.data.length === 0 && !dataType.isLoading && !dataType.isError)
    return null;

  return (
    <CommandGroup
      key={dataType.key}
      heading={`${dataType.name} ${scope === dataType.scope ? "(scoped)" : ""}`}
    >
      {dataType.isError ? (
        <CommandItem disabled className="flex flex-col items-start gap-2 p-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xs">!</span>
            </div>
            <span className="text-sm text-red-600 font-medium">
              Failed to load {dataType.name.toLowerCase()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            {dataType.error instanceof Error
              ? dataType.error.message
              : "Network error or server unavailable"}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Retry the query
              const query = dataQueries[dataType.key];
              if (query?.refetch) {
                query.refetch();
              }
            }}
            className="ml-6 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </CommandItem>
      ) : dataType.isLoading ? (
        <CommandItem disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Searching {dataType.name.toLowerCase()}...
          </span>
        </CommandItem>
      ) : (
        dataType.data.map((item: any) =>
          dataType.renderItem(item, () =>
            onSelect(() => {
              if (dataType.navigateTo) {
                const id = String(item?.id ?? "");
                let to = dataType.navigateTo;
                // Replace common id tokens
                if (to.includes("$id") || to.includes(":id")) {
                  to = to.replace(/\$id|:id/g, id);
                } else if (id) {
                  // Fallback: append id when no token provided
                  to = to.endsWith("/") ? `${to}${id}` : `${to}/${id}`;
                }
                navigate({ to });
              }
            })
          )
        )
      )}
    </CommandGroup>
  );
}
