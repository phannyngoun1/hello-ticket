/**
 * Seed Data Configuration
 *
 * Default/initialization data for various inventory objects.
 * This can be extended for other objects (items, warehouses, etc.)
 */

import type { CreateUnitOfMeasureInput } from "../types";

/**
 * Default base units of measure to initialize when no UOMs exist
 * These are common base units that can be used as reference points
 */
export const DEFAULT_BASE_UOMS: CreateUnitOfMeasureInput[] = [
    {
        code: "EA",
        name: "Each",
        base_uom: "EA",
        conversion_factor: 1,
    },
    {
        code: "KG",
        name: "Kilogram",
        base_uom: "KG",
        conversion_factor: 1,
    },
    {
        code: "M",
        name: "Meter",
        base_uom: "M",
        conversion_factor: 1,
    },
    {
        code: "L",
        name: "Liter",
        base_uom: "L",
        conversion_factor: 1,
    },
];

/**
 * Configuration for seed data initialization
 */
export interface SeedDataConfig {
    /**
     * Object type identifier (e.g., "uom", "warehouse", "item")
     */
    objectType: string;

    /**
     * Display name for the object type
     */
    displayName: string;

    /**
     * Default seed data for this object type
     */
    defaultData: unknown[];

    /**
     * Whether to show initialization option when no data exists
     */
    showInitialization?: boolean;
}

/**
 * Registry of seed data configurations for different object types
 */
export const SEED_DATA_REGISTRY: Record<string, SeedDataConfig> = {
    uom: {
        objectType: "uom",
        displayName: "Units of Measure",
        defaultData: DEFAULT_BASE_UOMS,
        showInitialization: true,
    },
    // Add more object types here as needed
    // warehouse: {
    //   objectType: "warehouse",
    //   displayName: "Warehouses",
    //   defaultData: DEFAULT_WAREHOUSES,
    //   showInitialization: true,
    // },
};

/**
 * Get seed data configuration for a specific object type
 */
export function getSeedDataConfig(objectType: string): SeedDataConfig | undefined {
    return SEED_DATA_REGISTRY[objectType];
}

/**
 * Get default base UOMs
 */
export function getDefaultBaseUOMs(): CreateUnitOfMeasureInput[] {
    return DEFAULT_BASE_UOMS;
}

