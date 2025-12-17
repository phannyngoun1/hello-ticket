/**
 * Hook to get density-based CSS classes for components
 * 
 * This hook provides a centralized way to get consistent sizing
 * based on the UI density preference (compact or normal).
 */

import { useDensity } from "./use-density";

export interface DensityStyles {
  // Text sizes
  textSize: string;
  textSizeSmall: string;
  textSizeLabel: string;

  // Input/Button heights
  inputHeight: string;
  searchInputHeight: string; // Search boxes respect density preference
  buttonHeight: string;
  buttonHeightSmall: string;

  // Padding
  paddingContainer: string;
  paddingForm: string;
  paddingCell: string;
  paddingRow: string;

  // Gaps
  gapForm: string;
  gapFormItem: string;
  gapButtonGroup: string;

  // Spacing
  spacingFormSection: string;
  spacingFormItem: string;

  // Icon sizes
  iconSize: string;
  iconSizeSmall: string;
}

/**
 * Get density-based styles for components
 */
export function useDensityStyles(): DensityStyles {
  const { isCompact } = useDensity();

  return {
    // Text sizes
    textSize: isCompact ? "text-xs" : "text-sm",
    textSizeSmall: isCompact ? "text-xs" : "text-sm",
    textSizeLabel: isCompact ? "text-xs" : "text-sm",

    // Input/Button heights
    inputHeight: isCompact ? "h-7" : "h-10",
    // Search inputs respect density preference
    searchInputHeight: isCompact ? "h-7" : "h-10",
    // Buttons respect density preference
    buttonHeight: isCompact ? "h-7" : "h-10",
    buttonHeightSmall: isCompact ? "h-7" : "h-9",

    // Padding
    paddingContainer: isCompact ? "p-4" : "p-6",
    paddingForm: isCompact ? "p-4" : "p-6",
    paddingCell: isCompact ? "px-2" : "px-3",
    paddingRow: isCompact ? "py-1" : "py-2",

    // Gaps
    gapForm: isCompact ? "gap-4" : "gap-6",
    gapFormItem: isCompact ? "gap-1.5" : "gap-2",
    gapButtonGroup: isCompact ? "gap-2" : "gap-3",

    // Spacing
    spacingFormSection: isCompact ? "space-y-4" : "space-y-6",
    spacingFormItem: isCompact ? "space-y-1.5" : "space-y-2",

    // Icon sizes
    iconSize: isCompact ? "h-3 w-3" : "h-4 w-4",
    iconSizeSmall: isCompact ? "h-3 w-3" : "h-3.5 w-3.5",
  };
}

/**
 * Get boolean indicating if compact mode is active
 */
export function useIsCompact(): boolean {
  const { isCompact } = useDensity();
  return isCompact;
}

