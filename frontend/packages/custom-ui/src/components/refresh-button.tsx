import { Button, cn } from "@truths/ui";
import { RefreshCw } from "lucide-react";

export interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  isRefetching?: boolean;
  disabled?: boolean;
  size?: "sm" | "default" | "icon";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  title?: string;
}

/**
 * Button to manually refresh/invalidate query cache.
 * Shows spinning icon while refetching.
 */
export function RefreshButton({
  onRefresh,
  isRefetching = false,
  disabled = false,
  size = "sm",
  variant = "outline",
  className,
  title = "Refresh",
}: RefreshButtonProps) {
  return (
    <Button
      variant={variant}
      size={size === "icon" ? "icon" : size}
      className={cn(
        size === "icon" && "h-8 w-8",
        size === "sm" && "h-8 px-2 text-xs",
        className
      )}
      onClick={() => onRefresh()}
      disabled={disabled || isRefetching}
      title={title}
    >
      <RefreshCw
        className={cn(
          "h-3 w-3",
          size !== "icon" && "mr-1",
          isRefetching && "animate-spin"
        )}
      />
      {size !== "icon" && <span>Refresh</span>}
    </Button>
  );
}
