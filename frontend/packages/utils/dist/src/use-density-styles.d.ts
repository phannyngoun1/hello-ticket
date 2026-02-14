/**
 * Hook to get density-based CSS classes for components
 *
 * This hook provides a centralized way to get consistent sizing
 * based on the UI density preference (compact or normal).
 */
export interface DensityStyles {
    textSize: string;
    textSizeSmall: string;
    textSizeLabel: string;
    textSizeCardTitle: string;
    textSizeCardDescription: string;
    inputHeight: string;
    searchInputHeight: string;
    buttonHeight: string;
    buttonHeightSmall: string;
    paddingContainer: string;
    paddingForm: string;
    paddingCell: string;
    paddingRow: string;
    paddingCard: string;
    paddingCardHeader: string;
    paddingCardContent: string;
    paddingCardFooter: string;
    gapForm: string;
    gapFormItem: string;
    gapButtonGroup: string;
    gapCard: string;
    spacingFormSection: string;
    spacingFormItem: string;
    spacingCard: string;
    iconSize: string;
    iconSizeSmall: string;
}
/**
 * Get density-based styles for components
 */
export declare function useDensityStyles(): DensityStyles;
/**
 * Get boolean indicating if compact mode is active
 */
export declare function useIsCompact(): boolean;
//# sourceMappingURL=use-density-styles.d.ts.map