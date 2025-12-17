/**
 * Search Input Component
 *
 * Reusable search input with search icon
 */

import { Input } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Search } from "lucide-react";
import { InputHTMLAttributes } from "react";

export interface SearchInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export function SearchInput({
  placeholder = "Search...",
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className={cn("pl-10", className)}
        {...props}
      />
    </div>
  );
}

