/**
 * Form Schemas for Seat Designer
 */

import * as z from "zod";
import { SeatType } from "../types";

/**
 * Section Form Schema
 */
export const sectionFormSchema = z.object({
  name: z.string().min(1, "Section name is required"),
});

export type SectionFormData = z.infer<typeof sectionFormSchema>;

/**
 * Seat Form Schema (for placement and editing)
 */
export const seatFormSchema = z.object({
  section: z.string().min(1, "Section is required"),
  sectionId: z.string().optional(),
  row: z.string().min(1, "Row is required"),
  seatNumber: z.string().min(1, "Seat number is required"),
  seatType: z.nativeEnum(SeatType, {
    errorMap: () => ({ message: "Seat type is required" }),
  }),
});

export type SeatFormData = z.infer<typeof seatFormSchema>;

