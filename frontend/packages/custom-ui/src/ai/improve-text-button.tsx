/**
 * Button that calls AI improve-text and passes result to parent via onImproved.
 */

import { useImproveText } from "./use-improve-text";
import { Button } from "@truths/ui";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import type { ImproveTextMode } from "./ai-service";

export interface ImproveTextButtonProps {
  value: string;
  onImproved: (improvedText: string) => void;
  mode?: ImproveTextMode;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Use "icon" for a compact icon-only button (e.g. next to labels) */
  size?: "sm" | "icon";
}

export function ImproveTextButton({
  value,
  onImproved,
  mode = "default",
  disabled = false,
  className,
  label = "Improve with AI",
  size = "sm",
}: ImproveTextButtonProps) {
  const { improve, loading, error } = useImproveText();
  const isIconOnly = size === "icon";

  const handleClick = async () => {
    const result = await improve(value, mode);
    if (result != null) {
      onImproved(result);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isIconOnly && "w-fit items-end",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size={isIconOnly ? "icon" : "sm"}
        disabled={disabled || loading || !value?.trim()}
        onClick={handleClick}
        className={isIconOnly ? "size-8 shrink-0 rounded-full" : "gap-2"}
        aria-label={isIconOnly ? "Improve with AI" : undefined}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : (
          <Sparkles className="h-4 w-4 text-blue-500" />
        )}
        {!isIconOnly && (loading ? "Improving…" : label)}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
