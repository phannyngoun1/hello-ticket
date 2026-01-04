/**
 * Section Service
 * 
 * Service for managing sections via API calls
 */
import { api } from "@truths/api";
import type { Section, CreateSectionInput, UpdateSectionInput } from "./types";

interface SectionDTO {
    id: string;
    tenant_id: string;
    layout_id: string;
    name: string;
    x_coordinate?: number | null;
    y_coordinate?: number | null;
    file_id?: string | null;
    image_url?: string | null;
    shape?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

function transformSection(dto: SectionDTO): Section {
    // Preserve shape as string (JSON) - don't convert null to undefined if it's explicitly null
    // But convert empty string to undefined
    const shapeValue = dto.shape === null || dto.shape === undefined || dto.shape === '' 
        ? undefined 
        : dto.shape;
    
    console.log("transformSection - DTO shape:", dto.shape, "Transformed shape:", shapeValue, "Type:", typeof shapeValue);
    
    return {
        id: dto.id,
        tenant_id: dto.tenant_id,
        layout_id: dto.layout_id,
        name: dto.name,
        x_coordinate: dto.x_coordinate ?? undefined,
        y_coordinate: dto.y_coordinate ?? undefined,
        file_id: dto.file_id ?? undefined,
        image_url: dto.image_url ?? undefined,
        shape: shapeValue,
        is_active: dto.is_active,
        created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    };
}

const BASE_ENDPOINT = "/api/v1/ticketing/sections";

export const sectionService = {
    /**
     * Get all sections for a layout
     */
    async getByLayout(layoutId: string): Promise<Section[]> {
        const response = await api.get<{ items: SectionDTO[] }>(
            `${BASE_ENDPOINT}/layout/${layoutId}`,
            { requiresAuth: true }
        );
        console.log("SectionService.getByLayout - Raw API response:", response);
        const sections = (response.items || []).map(transformSection);
        console.log("SectionService.getByLayout - Transformed sections:", sections.map(s => ({ id: s.id, name: s.name, shape: s.shape, shapeType: typeof s.shape })));
        return sections;
    },

    /**
     * Get a section by ID
     */
    async getById(sectionId: string): Promise<Section> {
        const dto = await api.get<SectionDTO>(`${BASE_ENDPOINT}/${sectionId}`, { requiresAuth: true });
        return transformSection(dto);
    },

    /**
     * Create a new section
     */
    async create(input: CreateSectionInput): Promise<Section> {
        const dto = await api.post<SectionDTO>(BASE_ENDPOINT, input, { requiresAuth: true });
        return transformSection(dto);
    },

    /**
     * Update a section
     */
    async update(sectionId: string, input: UpdateSectionInput): Promise<Section> {
        const dto = await api.put<SectionDTO>(`${BASE_ENDPOINT}/${sectionId}`, input, { requiresAuth: true });
        return transformSection(dto);
    },

    /**
     * Delete a section
     */
    async delete(sectionId: string): Promise<void> {
        return api.delete(`${BASE_ENDPOINT}/${sectionId}`, { requiresAuth: true });
    },
};

