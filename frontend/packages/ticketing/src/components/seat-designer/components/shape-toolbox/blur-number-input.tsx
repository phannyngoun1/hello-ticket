import { useState, useEffect, useCallback } from "react";
import { Input } from "@truths/ui";

/**
 * A number input that only commits its value on blur (or Enter key).
 * This prevents every keystroke from triggering expensive style changes.
 */
export function BlurNumberInput({
  value,
  onCommit,
  min,
  max,
  step,
  fallback,
  className,
  title,
  "aria-label": ariaLabel,
}: {
  value: number;
  onCommit: (value: number) => void;
  min?: string;
  max?: string;
  step?: string;
  fallback: number;
  className?: string;
  title?: string;
  "aria-label"?: string;
}) {
  const [localValue, setLocalValue] = useState<string>(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = useCallback(() => {
    const parsed = parseFloat(localValue);
    const final = isNaN(parsed) ? fallback : parsed;
    onCommit(final);
    setLocalValue(String(final));
  }, [localValue, fallback, onCommit]);

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
      title={title}
      aria-label={ariaLabel}
    />
  );
}
