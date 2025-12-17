/**
 * {{EntityName}} Module
 * 
 * Exports for {{entity-name}} management
 */

import { api } from "@truths/api";
import {{{ EntityName }}Service } from "./{{entity-name}}-service";

// Initialize service with default configuration
export const {{ entityName }}Service = new {{ EntityName }}Service({
    apiClient: api,
    endpoints: {
    {{ entityPlural }}: "{{endpoint}}",
  },
});

// Export components
export * from "./{{entity-name}}-management";
export * from "./{{entity-name}}-list-container";
export * from "./{{entity-name}}-tree";
export * from "./{{entity-name}}-detail";
export * from "./create-{{entity-name}}-dialog";
export * from "./edit-{{entity-name}}-dialog";
export * from "./{{entity-name}}-provider";

// Export hooks
export * from "./use-{{entity-plural}}";

// Export types
export * from "./types";
