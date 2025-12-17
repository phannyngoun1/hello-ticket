import { CommandItem, Badge } from "@truths/ui";
import type { LucideIcon } from "lucide-react";

interface DefaultAppCommandPaletteItemProps {
  icon: LucideIcon;
  displayName: string;
  subtitle?: string | null;
  badge?: string | null;
  searchValue: string;
  itemKey: string;
  itemId: string | number;
  onSelect: () => void;
}

export function DefaultAppCommandPaletteItem({
  icon: Icon,
  displayName,
  subtitle,
  badge,
  searchValue,
  itemKey,
  itemId,
  onSelect,
}: DefaultAppCommandPaletteItemProps) {
  return (
    <CommandItem
      key={`${itemKey}-${itemId}`}
      value={searchValue}
      onSelect={onSelect}
    >
      <Icon className="mr-2 h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-sm">{displayName}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
      {badge && (
        <Badge variant="outline" className="ml-auto text-[10px]">
          {badge}
        </Badge>
      )}
    </CommandItem>
  );
}

