import * as React from "react";
import { CommandEmpty } from "@truths/ui";
import { WifiOff } from "lucide-react";
import { DataTypeConfig, BaseDataItem } from "../types";

interface EmptyStateProps {
  isOnline: boolean;
  dataTypes: DataTypeConfig<BaseDataItem>[];
}

/**
 * Empty state component for command palette
 */
export function EmptyState({ isOnline, dataTypes }: EmptyStateProps) {
  return (
    <CommandEmpty>
      <div className="py-6 text-center text-sm">
        {!isOnline ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <WifiOff className="h-5 w-5 text-red-500" />
              <p className="text-red-600 font-medium">You're offline</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Check your internet connection to search for data
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">No results found.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Try using scope modifiers like{" "}
              <code className="text-primary">nav:</code>,{" "}
              <code className="text-primary">action:</code>,{" "}
              {dataTypes.slice(0, 3).map((dataType, index) => (
                <React.Fragment key={dataType.key}>
                  <code className="text-primary">{dataType.key}:</code>
                  {index < Math.min(2, dataTypes.length - 1) && ", "}
                </React.Fragment>
              ))}
              {dataTypes.length > 3 && ", or more..."}
            </p>
          </>
        )}
      </div>
    </CommandEmpty>
  );
}
