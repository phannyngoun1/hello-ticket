import type { BaseDataItem, DataTypeConfig, NavigationItem, QuickAction } from "@truths/custom-ui";

export interface AppCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataTypes: DataTypeConfig<BaseDataItem>[];
  navigationItems?: NavigationItem[];
  quickActions?: QuickAction[];
  userId?: string;
}

