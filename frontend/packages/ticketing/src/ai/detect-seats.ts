/**
 * AI detect-seats API: suggest individual seat positions from a floor plan or section image.
 */

import { api } from "@truths/api";

const AI_BASE = "/api/v1/ai";

export interface SuggestedSeat {
  row: string;
  seat_number: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectSeatsResponse {
  seats: SuggestedSeat[];
}

export async function detectSeats(
  imageFile: File,
  sectionName?: string | null
): Promise<DetectSeatsResponse> {
  const formData = new FormData();
  formData.append("file", imageFile);
  if (sectionName != null && sectionName !== "") {
    formData.append("section_name", sectionName);
  }
  return api.postForm<DetectSeatsResponse>(`${AI_BASE}/detect-seats`, formData, {
    requiresAuth: true,
  });
}
