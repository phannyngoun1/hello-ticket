/**
 * "Suggest with AI" button: calls form-suggest and applies suggested values via onSuggest.
 */

import { useAIAssistForm, type FormType } from "./use-ai-assist-form";
import { Button } from "@truths/ui";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";

export interface AIAssistFormButtonProps {
  formType: FormType;
  currentValues: Record<string, string>;
  fieldHints?: Record<string, string>;
  onSuggest: (suggestedValues: Record<string, string>) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function AIAssistFormButton({
  formType,
  currentValues,
  fieldHints,
  onSuggest,
  disabled = false,
  className,
  label = "Suggest with AI",
}: AIAssistFormButtonProps) {
  const { suggest, loading, error } = useAIAssistForm({
    formType,
    currentValues,
    fieldHints,
  });

  const handleClick = async () => {
    const values = await suggest();
    if (Object.keys(values).length > 0) {
      onSuggest(values);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={handleClick}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "Suggesting…" : label}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
