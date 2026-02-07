/**
 * @truths/custom-ui
 * 
 * Custom UI components for the Truths platform.
 * This package contains specialized components that extend the base UI library
 * with enterprise-grade features and custom functionality.
 */

// Export all components
export * from './components';

// AI (improve text, form suggest)
export * from './ai';

// Re-export density hooks from utils package
export { useDensity, useDensityStyles, useIsCompact } from '@truths/utils';
export type { DensityStyles } from '@truths/utils';

// Re-export commonly used types
export type { DataRow } from './components/data-table';
export type { DataListProps, DataListItem, StatConfig, BadgeConfig } from './components/data-list';
export type { FormField } from './components/custom-form';
export type { ActivityItem } from './components/dashboard-widgets';

