/**
 * UI Builder API - Stub implementations
 * These will be implemented when the backend UI builder endpoints are ready.
 */
export interface UISchema {
    id: string;
    name: string;
    schema_data: Record<string, unknown>;
    version?: number;
}
export interface UIPage {
    id: string;
    schema_id: string;
    route: string;
    name?: string;
}
export interface UIPageCreate {
    schema_id: string;
    route: string;
    name?: string;
}
export declare const uiBuilderQueryKeys: {
    schema: (id: string) => readonly ["ui-schema", string];
    pages: () => readonly ["ui-pages"];
};
export declare function getUISchema(schemaId: string): Promise<UISchema>;
export declare function updateUISchema(schemaId: string, data: {
    schema_data: Record<string, unknown>;
}): Promise<UISchema>;
export declare function publishUISchema(schemaId: string): Promise<UISchema>;
export declare function deleteUISchema(schemaId: string): Promise<void>;
export declare function createUIPage(data: UIPageCreate): Promise<UIPage>;
export declare function deleteUIPage(pageId: string): Promise<void>;
export declare function listUIPages(): Promise<UIPage[]>;
//# sourceMappingURL=ui-builder.d.ts.map