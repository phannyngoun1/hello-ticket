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
}

export function ImproveTextButton({
  value,
  onImproved,
  mode = "default",
  disabled = false,
  className,
  label = "Improve with AI",
}: ImproveTextButtonProps) {
  const { improve, loading, error } = useImproveText();

  const handleClick = async () => {
    const result = await improve(value, mode);
    if (result != null) {
      onImproved(result);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading || !value?.trim()}
        onClick={handleClick}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "Improving…" : label}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
