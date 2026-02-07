/**
 * "Suggest with AI" button: opens a dialog for optional user instructions,
 * then calls form-suggest and applies suggested values via onSuggest.
 */

import { useState, useRef, useEffect } from "react";
import { useAIAssistForm, type FormType } from "./use-ai-assist-form";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@truths/ui";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggest, loading, error } = useAIAssistForm({
    formType,
    currentValues,
    fieldHints,
  });

  const handleOpen = () => setOpen(true);
  const handleOpenChange = (next: boolean) => {
    if (!loading) {
      setOpen(next);
      if (!next) setUserPrompt("");
    }
  };

  const handleGetSuggestions = async () => {
    const values = await suggest(userPrompt);
    if (Object.keys(values).length > 0) {
      onSuggest(values);
      setOpen(false);
      setUserPrompt("");
    }
  };

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 80), 280)}px`;
  };

  useEffect(() => {
    if (open) adjustTextareaHeight();
  }, [open, userPrompt]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleOpen}
          className={cn(
            "group w-full gap-2 transition-all duration-200 ease-out",
            "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
            "active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <Sparkles className="h-4 w-4 transition-transform duration-200 ease-out group-hover:rotate-12 group-hover:scale-110" />
          {label}
        </Button>
        <DialogContent
          className="sm:max-w-xl duration-300"
          onPointerDownOutside={(e) => loading && e.preventDefault()}
          onEscapeKeyDown={(e) => loading && e.preventDefault()}
        >
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="tracking-tight">{label}</DialogTitle>
            <DialogDescription className="text-muted-foreground/90">
              Add optional instructions to guide the suggestions (e.g. tone,
              focus, or style). Leave blank for general suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div
              className={cn(
                "flex flex-col rounded-xl border border-input bg-muted/30 p-4",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:bg-background",
                "transition-all duration-200 ease-out"
              )}
            >
              <Textarea
                ref={textareaRef}
                id="suggest-ai-prompt"
                placeholder="Describe what you want... (e.g. 'Keep it professional, focus on accessibility')"
                className={cn(
                  "min-h-[80px] max-h-[280px] w-full resize-none overflow-y-auto rounded-lg border-0 bg-transparent py-0 pl-0 pr-0",
                  "text-base text-foreground placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "transition-[height] duration-150 ease-out"
                )}
                value={userPrompt}
                onChange={(e) => {
                  setUserPrompt(e.target.value);
                  requestAnimationFrame(adjustTextareaHeight);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGetSuggestions();
                  }
                }}
                disabled={loading}
              />
              <div className="flex justify-end pt-3">
                <Button
                  type="button"
                  size="icon"
                  className={cn(
                    "group size-8 rounded-full bg-primary text-primary-foreground shrink-0",
                    "transition-all duration-200 ease-out",
                    "hover:bg-primary/90 hover:scale-105 hover:shadow-md",
                    "active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  )}
                  onClick={handleGetSuggestions}
                  disabled={loading || !userPrompt.trim()}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
