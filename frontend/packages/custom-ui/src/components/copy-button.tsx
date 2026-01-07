import React, { useState } from "react";
import { Button, ButtonProps } from "@truths/ui";
import { CheckCircle2, Copy } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";

export interface CopyButtonProps extends ButtonProps {
  value: string;
  iconClassName?: string;
  copyMessage?: string;
}

export function CopyButton({
  value,
  className,
  iconClassName,
  onClick,
  title = "Copy to clipboard",
  copyMessage = "Copied!",
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }

    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleCopy}
      title={title}
      {...props}
    >
      {hasCopied ? (
        <CheckCircle2 className={cn("h-3 w-3 text-green-600", iconClassName)} />
      ) : (
        <Copy className={cn("h-3 w-3", iconClassName)} />
      )}
    </Button>
  );
}
