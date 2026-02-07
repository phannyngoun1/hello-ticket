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
        className={cn(
          "group transition-all duration-200 ease-out",
          "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
          "active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isIconOnly
            ? "size-8 shrink-0 rounded-full hover:scale-105 active:scale-95 disabled:hover:scale-100"
            : "gap-2"
        )}
        aria-label={isIconOnly ? "Improve with AI" : undefined}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary transition-transform duration-200 ease-out group-hover:rotate-12 group-hover:scale-110" />
        )}
        {!isIconOnly && (loading ? "Improving…" : label)}
      </Button>
      {error && (
        <p
          className="text-xs text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
