/**
 * AI detect-markers API: suggest section regions from a floor plan image.
 */

import { api } from "@truths/api";

const AI_BASE = "/api/v1/ai";

export interface SuggestedShape {
  type: "rectangle" | "ellipse" | "polygon";
  x: number;
  y: number;
  width: number;
  height: number;
  points?: number[];
}

export interface SuggestedSection {
  name: string;
  shape: SuggestedShape;
}

export interface DetectMarkersResponse {
  sections: SuggestedSection[];
}

export async function detectMarkers(imageFile: File): Promise<DetectMarkersResponse> {
  const formData = new FormData();
  formData.append("file", imageFile);
  return api.postForm<DetectMarkersResponse>(`${AI_BASE}/detect-markers`, formData, {
    requiresAuth: true,
  });
}
