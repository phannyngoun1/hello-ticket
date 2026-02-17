/**
 * Utility functions for Seat Designer
 */

import type { SectionMarker, SeatMarker } from "./types";
import type { Section } from "../../sections/types";

/**
 * Get unique sections from existing seats and API data
 */
export function getUniqueSections(
  seats: SeatMarker[],
  sectionsData?: Section[] | Array<{ id: string; name: string; [key: string]: any }>,
  sectionMarkers?: SectionMarker[],
  designMode?: "seat-level" | "section-level"
): string[] {
  const sections = new Set<string>();

  // Add sections from existing seats
  seats.forEach((seat) => {
    if (seat.seat.section) {
      sections.add(seat.seat.section);
    }
  });

  // Add sections from API (for both modes - needed for seat editing)
  // Accepts both full Section[] and partial section data (from /with-seats)
  if (sectionsData) {
    sectionsData.forEach((section) => {
      sections.add(section.name);
    });
  }

  // Add sections from sectionMarkers (for both modes - needed for newly created sections)
  if (sectionMarkers) {
    sectionMarkers.forEach((section) => {
      sections.add(section.name);
    });
  }

  return Array.from(sections).sort();
}

/**
 * Find section ID from section name
 */
export function findSectionId(
  sectionName: string,
  sectionsData?: Section[] | Array<{ id: string; name: string; [key: string]: any }>,
  sectionMarkers?: SectionMarker[]
): string | undefined {
  // Try sectionsData first (API data)
  // Accepts both full Section[] and partial section data (from /with-seats)
  if (sectionsData) {
    const section = sectionsData.find((s) => s.name === sectionName);
    if (section) return section.id;
  }

  // Try sectionMarkers
  if (sectionMarkers) {
    const section = sectionMarkers.find((s) => s.name === sectionName);
    if (section) return section.id;
  }

  return undefined;
}

