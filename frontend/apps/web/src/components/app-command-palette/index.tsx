import { CommandPalette } from "@truths/custom-ui";
import type { AppCommandPaletteProps } from "./types";

/**
 * Pure component that renders the command palette.
 * All data must be provided via props - no service dependencies.
 * Use the useAppCommandPalette hook to fetch data and pass it as props.
 */
export function AppCommandPalette({
  open,
  onOpenChange,
  dataTypes,
  navigationItems,
  quickActions,
  userId,
}: AppCommandPaletteProps) {
  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      dataTypes={dataTypes}
      userId={userId}
      navigationItems={navigationItems}
      quickActions={quickActions}
    />
  );
}
