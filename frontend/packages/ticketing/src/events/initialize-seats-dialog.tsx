/**
 * Initialize Seats Dialog Component
 *
 * Full-screen dialog for initializing event seats with price and ticket options
 * Supports section-based pricing and section inclusion/exclusion
 */

import { useMemo, useState, useEffect, useCallback } from "react";
import { Input, Label, Card, Badge, Button } from "@truths/ui";
import { FullScreenDialog } from "@truths/custom-ui";
import { useForm, useFieldArray } from "react-hook-form";
import type { Seat } from "../seats";
import type { Section } from "../layouts";
import type { EventSeat } from "./types";
import {
  DollarSign,
  Ticket,
  Info,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Settings2,
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

export interface InitializeSeatsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InitializeSeatsData) => Promise<void>;
  layoutSeats: Seat[];
  sections: Section[];
  existingEventSeats?: EventSeat[];
  loading?: boolean;
  designMode?: "seat-level" | "section-level";
  selectedSectionId?: string | null;
}

export interface InitializeSeatsData {
  defaultPrice: number;
  generateTicketCodes: boolean;
  pricingMode: "same" | "per_section";
  sectionPricing?: Array<{ section_id: string; price: number }>;
  seatPricing?: Array<{ seat_id: string; price: number }>; // Individual seat price overrides
  includedSectionIds?: string[];
  excludedSectionIds?: string[];
}

interface InitializeSeatsFormData {
  defaultPrice: string;
  generateTicketCodes: boolean;
  pricingMode: "same" | "per_section";
  sectionPricing: Array<{ section_id: string; price: string }>;
  seatPricing: Array<{ seat_id: string; price: string }>; // Individual seat overrides
  sectionSelection: "all" | "include" | "exclude";
  selectedSectionIds: string[];
}

export function InitializeSeatsDialog({
  open,
  onClose,
  onSubmit,
  layoutSeats,
  sections,
  existingEventSeats = [],
  loading = false,
  designMode = "seat-level",
  selectedSectionId,
}: InitializeSeatsDialogProps) {
  const [sectionSelectionMode, setSectionSelectionMode] = useState<
    "all" | "include" | "exclude"
  >("all");
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set()
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  // Search and pagination for seat list
  const [seatSearchQuery, setSeatSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    new Set()
  );
  const seatsPerPage = 50; // Show 50 seats per page

  // Default to per_section pricing for section-level layouts
  const defaultPricingMode =
    designMode === "section-level" ? "per_section" : "same";

  const {
    register,
    handleSubmit,
    watch,
    control,
    getValues,
    setValue,
    formState: { errors },
    reset,
  } = useForm<InitializeSeatsFormData>({
    defaultValues: {
      defaultPrice: "0",
      generateTicketCodes: false,
      pricingMode: defaultPricingMode,
      sectionPricing: [],
      seatPricing: [],
      sectionSelection: "all",
      selectedSectionIds: [],
    },
  });

  const {
    fields: sectionPricingFields,
    append: appendSection,
    remove: removeSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sectionPricing",
  });

  const {
    fields: seatPricingFields,
    append: appendSeat,
    remove: removeSeat,
    update: updateSeat,
  } = useFieldArray({
    control,
    name: "seatPricing",
  });

  const defaultPrice = watch("defaultPrice");
  const generateTicketCodes = watch("generateTicketCodes");
  const pricingMode = watch("pricingMode");

  // Filter sections to only selected section when in drill-down mode (section-level with selectedSectionId)
  const filteredSections = useMemo(() => {
    if (
      designMode === "section-level" &&
      selectedSectionId &&
      sections.some((s) => s.id === selectedSectionId)
    ) {
      // Only show the selected section when drilling down
      return sections.filter((s) => s.id === selectedSectionId);
    }
    return sections;
  }, [sections, designMode, selectedSectionId]);

  // Create section name map for display
  const sectionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredSections.forEach((section) => {
      map.set(section.id, section.name);
    });
    return map;
  }, [filteredSections]);

  // Create maps for existing event seats for quick lookup
  const existingSeatIds = useMemo(() => {
    const seatIdSet = new Set<string>();
    const locationSet = new Set<string>();

    existingEventSeats.forEach((eventSeat) => {
      if (eventSeat.seat_id) {
        seatIdSet.add(eventSeat.seat_id);
      }
      if (
        eventSeat.section_name &&
        eventSeat.row_name &&
        eventSeat.seat_number
      ) {
        const key = `${eventSeat.section_name}|${eventSeat.row_name}|${eventSeat.seat_number}`;
        locationSet.add(key);
      }
    });

    return { seatIdSet, locationSet };
  }, [existingEventSeats]);

  // Filter layout seats to selected section when in drill-down mode
  const filteredLayoutSeats = useMemo(() => {
    if (
      designMode === "section-level" &&
      selectedSectionId &&
      layoutSeats.some((seat) => seat.section_id === selectedSectionId)
    ) {
      // Only show seats from the selected section when drilling down
      return layoutSeats.filter((seat) => seat.section_id === selectedSectionId);
    }
    return layoutSeats;
  }, [layoutSeats, designMode, selectedSectionId]);

  // Get all available seats (seats that can be added) WITHOUT section selection filters
  // This is used for the stable section selection UI
  const availableSeats = useMemo(() => {
    return filteredLayoutSeats.filter((layoutSeat) => {
      // Check if seat already exists
      if (layoutSeat.id && existingSeatIds.seatIdSet.has(layoutSeat.id)) {
        return false;
      }
      const sectionName = sectionNameMap.get(layoutSeat.section_id);
      if (sectionName && layoutSeat.row && layoutSeat.seat_number) {
        const locationKey = `${sectionName}|${layoutSeat.row}|${layoutSeat.seat_number}`;
        if (existingSeatIds.locationSet.has(locationKey)) {
          return false;
        }
      }
      return true;
    });
  }, [filteredLayoutSeats, existingSeatIds, sectionNameMap]);

  // Filter out seats that already have event seats assigned AND apply section selection filters
  const missingSeats = useMemo(() => {
    return availableSeats.filter((layoutSeat) => {
      // Apply section selection filters
      if (sectionSelectionMode === "include" && selectedSections.size > 0) {
        // Only include seats from selected sections
        if (!selectedSections.has(layoutSeat.section_id)) {
          return false;
        }
      } else if (
        sectionSelectionMode === "exclude" &&
        selectedSections.size > 0
      ) {
        // Exclude seats from selected sections
        if (selectedSections.has(layoutSeat.section_id)) {
          return false;
        }
      }

      return true;
    });
  }, [availableSeats, sectionSelectionMode, selectedSections]);

  // Get sections that have seats in the layout (for section selection UI)
  const sectionsWithSeats = useMemo(() => {
    const sectionIds = new Set<string>();
    layoutSeats.forEach((seat) => {
      sectionIds.add(seat.section_id);
    });
    return filteredSections.filter((s) => sectionIds.has(s.id));
  }, [layoutSeats, filteredSections]);

  // Get sections with available seats to add (stable list for section selection UI)
  // This list doesn't change when checkboxes are toggled
  const availableSeatsBySection = useMemo(() => {
    const grouped = new Map<string, { id: string; count: number }>();
    availableSeats.forEach((seat) => {
      const existing = grouped.get(seat.section_id);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(seat.section_id, { id: seat.section_id, count: 1 });
      }
    });
    return Array.from(grouped.entries())
      .map(([sectionId, data]) => ({
        sectionId,
        sectionName: sectionNameMap.get(sectionId) || "Unknown",
        count: data.count,
      }))
      .sort((a, b) => a.sectionName.localeCompare(b.sectionName));
  }, [availableSeats, sectionNameMap]);

  // Get seat count by section for missing seats (after filters applied)
  const missingSeatsBySection = useMemo(() => {
    const grouped = new Map<string, { id: string; count: number }>();
    missingSeats.forEach((seat) => {
      const existing = grouped.get(seat.section_id);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(seat.section_id, { id: seat.section_id, count: 1 });
      }
    });
    return Array.from(grouped.entries())
      .map(([sectionId, data]) => ({
        sectionId,
        sectionName: sectionNameMap.get(sectionId) || "Unknown",
        count: data.count,
      }))
      .sort((a, b) => a.sectionName.localeCompare(b.sectionName));
  }, [missingSeats, sectionNameMap]);

  const totalSeats = filteredLayoutSeats.length;
  const missingSeatsCount = missingSeats.length;
  const existingSeatsCount = totalSeats - missingSeatsCount;
  const hasMissingSeats = missingSeatsCount > 0;

  // Filter seats by search query
  const filterSeatsBySearch = useCallback(
    (seats: Seat[]) => {
      if (!seatSearchQuery.trim()) return seats;
      const query = seatSearchQuery.toLowerCase().trim();
      return seats.filter((seat) => {
        const row = seat.row?.toLowerCase() || "";
        const seatNumber = seat.seat_number?.toLowerCase() || "";
        const sectionName =
          sectionNameMap.get(seat.section_id)?.toLowerCase() || "";
        const searchText = `${row} ${seatNumber} ${sectionName}`;
        return searchText.includes(query);
      });
    },
    [seatSearchQuery, sectionNameMap]
  );

  // Paginate seats
  const paginateSeats = useCallback(
    (seats: Seat[]) => {
      const startIndex = (currentPage - 1) * seatsPerPage;
      const endIndex = startIndex + seatsPerPage;
      return seats.slice(startIndex, endIndex);
    },
    [currentPage, seatsPerPage]
  );

  // Get seats grouped by section for display (only non-excluded sections)
  const seatsBySection = useMemo(() => {
    const grouped = new Map<string, Seat[]>();
    missingSeats.forEach((seat) => {
      const existing = grouped.get(seat.section_id) || [];
      existing.push(seat);
      grouped.set(seat.section_id, existing);
    });
    return grouped;
  }, [missingSeats]);

  // Reset form and set default pricing mode when dialog opens
  useEffect(() => {
    if (open) {
      const defaultPricingMode =
        designMode === "section-level" ? "per_section" : "same";
      
      // If in drill-down mode with selectedSectionId, auto-select that section
      const isDrillDownMode =
        designMode === "section-level" && selectedSectionId;
      const initialSectionSelection = isDrillDownMode ? "include" : "all";
      const initialSelectedSections = isDrillDownMode && selectedSectionId
        ? new Set([selectedSectionId])
        : new Set();

      reset({
        defaultPrice: "0",
        generateTicketCodes: false,
        pricingMode: defaultPricingMode,
        sectionPricing: [],
        seatPricing: [],
        sectionSelection: initialSectionSelection,
        selectedSectionIds: isDrillDownMode && selectedSectionId
          ? [selectedSectionId]
          : [],
      });
      setSectionSelectionMode(initialSectionSelection);
      setSelectedSections(initialSelectedSections);
      setExpandedSections(new Set());
      // Reset search and pagination
      setSeatSearchQuery("");
      setCurrentPage(1);
      setSelectedSeatIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, designMode, selectedSectionId]);

  // Initialize section pricing for section-level layouts when pricing mode is per_section
  useEffect(() => {
    if (
      open &&
      designMode === "section-level" &&
      pricingMode === "per_section" &&
      sectionPricingFields.length === 0
    ) {
      // Initialize with all sections that have seats
      missingSeatsBySection.forEach((section) => {
        appendSection({
          section_id: section.sectionId,
          price: defaultPrice || "0",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, designMode, pricingMode, missingSeatsBySection]);

  // Remove excluded sections from pricing configuration when they're excluded
  useEffect(() => {
    if (
      sectionSelectionMode === "exclude" &&
      pricingMode === "per_section" &&
      selectedSections.size > 0
    ) {
      // Remove pricing fields for excluded sections
      const fieldsToRemove: number[] = [];
      sectionPricingFields.forEach((field, index) => {
        if (selectedSections.has(field.section_id)) {
          fieldsToRemove.push(index);
        }
      });
      // Remove in reverse order to maintain indices
      fieldsToRemove.reverse().forEach((index) => {
        removeSection(index);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionSelectionMode, selectedSections, pricingMode]);

  // Initialize section pricing fields when switching to per-section mode
  const handlePricingModeChange = (mode: "same" | "per_section") => {
    if (mode === "per_section" && sectionPricingFields.length === 0) {
      // Initialize with all sections that have seats (already filtered by section selection)
      missingSeatsBySection.forEach((section) => {
        appendSection({
          section_id: section.sectionId,
          price: defaultPrice || "0",
        });
      });
    }
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setExpandedSections(newSet);
  };

  const getSeatPrice = (seat: Seat): string => {
    // Check if seat has individual price override
    const seatPricing = seatPricingFields.find((sp) => sp.seat_id === seat.id);
    if (seatPricing) {
      return seatPricing.price;
    }
    // Check section price
    if (pricingMode === "per_section") {
      const sectionPricing = sectionPricingFields.find(
        (sp) => sp.section_id === seat.section_id
      );
      if (sectionPricing) {
        return sectionPricing.price;
      }
    }
    return defaultPrice || "0";
  };

  const setSeatPrice = (seatId: string, price: string) => {
    const existingIndex = seatPricingFields.findIndex(
      (sp) => sp.seat_id === seatId
    );
    if (existingIndex >= 0) {
      // Update existing using setValue to ensure form state is updated
      setValue(`seatPricing.${existingIndex}.price`, price, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      // Add new - appendSeat will add to the form array with the price value
      appendSeat({ seat_id: seatId, price });
    }
  };

  const removeSeatPrice = (seatId: string) => {
    const existingIndex = seatPricingFields.findIndex(
      (sp) => sp.seat_id === seatId
    );
    if (existingIndex >= 0) {
      removeSeat(existingIndex);
    }
  };

  const handleFormSubmit = async (data: InitializeSeatsFormData) => {
    const submitData: InitializeSeatsData = {
      defaultPrice: parseFloat(data.defaultPrice) || 0,
      generateTicketCodes: data.generateTicketCodes,
      pricingMode: data.pricingMode,
      sectionPricing:
        data.pricingMode === "per_section"
          ? data.sectionPricing.map((sp) => ({
              section_id: sp.section_id,
              price: parseFloat(sp.price) || 0,
            }))
          : undefined,
      seatPricing:
        data.seatPricing.length > 0
          ? data.seatPricing.map((sp) => ({
              seat_id: sp.seat_id,
              price: parseFloat(sp.price) || 0,
            }))
          : undefined,
      includedSectionIds:
        sectionSelectionMode === "include" && selectedSections.size > 0
          ? Array.from(selectedSections)
          : undefined,
      excludedSectionIds:
        sectionSelectionMode === "exclude" && selectedSections.size > 0
          ? Array.from(selectedSections)
          : undefined,
    };
    await onSubmit(submitData);
  };

  const toggleSectionSelection = (sectionId: string) => {
    const newSet = new Set(selectedSections);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
      // If excluding and removing from exclusion, add back to pricing if needed
      if (sectionSelectionMode === "exclude" && pricingMode === "per_section") {
        // Check if section should be in pricing (it's not excluded anymore)
        const sectionInMissingSeats = missingSeatsBySection.find(
          (s) => s.sectionId === sectionId
        );
        if (sectionInMissingSeats) {
          const existingIndex = sectionPricingFields.findIndex(
            (f) => f.section_id === sectionId
          );
          if (existingIndex < 0) {
            appendSection({
              section_id: sectionId,
              price: defaultPrice || "0",
            });
          }
        }
      }
    } else {
      newSet.add(sectionId);
      // If excluding and adding to exclusion, remove from pricing
      if (sectionSelectionMode === "exclude" && pricingMode === "per_section") {
        const existingIndex = sectionPricingFields.findIndex(
          (f) => f.section_id === sectionId
        );
        if (existingIndex >= 0) {
          removeSection(existingIndex);
        }
      }
    }
    setSelectedSections(newSet);
  };

  const calculateTotalValue = () => {
    let total = 0;
    missingSeats.forEach((seat) => {
      const price = getSeatPrice(seat);
      total += parseFloat(price || "0");
    });
    return total;
  };

  return (
    <FullScreenDialog
      open={open}
      onClose={onClose}
      title={
        hasMissingSeats
          ? `Add ${missingSeatsCount} Missing Seats`
          : "Initialize Event Seats"
      }
      loading={loading}
      onSubmit={handleSubmit(handleFormSubmit)}
      showCancelButton={true}
      showSubmitButton={true}
      showClearButton={false}
      maxWidth="1200px"
    >
      <div className="space-y-6">
        {/* Information Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                {hasMissingSeats
                  ? "Add Seats to Event"
                  : "Initialize Seats from Layout"}
              </h3>
              <p className="text-sm text-blue-800">
                {hasMissingSeats ? (
                  <>
                    There {missingSeatsCount === 1 ? "is" : "are"}{" "}
                    {missingSeatsCount} seat{missingSeatsCount !== 1 ? "s" : ""}{" "}
                    in the layout that{" "}
                    {missingSeatsCount === 1 ? "hasn't" : "haven't"} been added
                    to this event yet.
                    {existingSeatsCount > 0 && (
                      <>
                        {" "}
                        {existingSeatsCount} seat
                        {existingSeatsCount !== 1 ? "s are" : " is"} already
                        assigned.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    This will create {totalSeats} event seat
                    {totalSeats !== 1 ? "s" : ""} from the layout seats. You can
                    set pricing per section and configure ticket generation.
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Seat Summary */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Seat Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Layout Seats:</span>
              <span className="font-medium">{totalSeats}</span>
            </div>
            {hasMissingSeats && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Already Assigned:
                  </span>
                  <Badge variant="outline">{existingSeatsCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Seats to Add:
                  </span>
                  <Badge className="bg-green-600 text-white">
                    {missingSeatsCount}
                  </Badge>
                </div>
              </>
            )}
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-2">
                {hasMissingSeats
                  ? "Missing Seats by Section:"
                  : "Seats by Section:"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {missingSeatsBySection.map(
                  ({ sectionId, sectionName, count }) => (
                    <div
                      key={sectionId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {sectionName}:
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Only show section selection if not in drill-down mode */}
          {!(designMode === "section-level" && selectedSectionId) && (
            <Card className="p-4">
              <h3 className="font-medium mb-4">Section Selection</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Sections</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sectionSelection"
                      value="all"
                      checked={sectionSelectionMode === "all"}
                      onChange={() => {
                        setSectionSelectionMode("all");
                        setSelectedSections(new Set());
                        // Re-initialize pricing if in per-section mode
                        if (pricingMode === "per_section") {
                          // Clear and re-add all sections
                          sectionPricingFields.forEach((_, index) => {
                            removeSection(0); // Remove from start each time
                          });
                          // Re-add all sections that should be included
                          missingSeatsBySection.forEach((section) => {
                            appendSection({
                              section_id: section.sectionId,
                              price: defaultPrice || "0",
                            });
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">All Sections</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sectionSelection"
                      value="include"
                      checked={sectionSelectionMode === "include"}
                      onChange={() => {
                        setSectionSelectionMode("include");
                        // Clear pricing and let user re-select
                        if (pricingMode === "per_section") {
                          sectionPricingFields.forEach((_, index) => {
                            removeSection(0);
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Include Specific Sections</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sectionSelection"
                      value="exclude"
                      checked={sectionSelectionMode === "exclude"}
                      onChange={() => {
                        setSectionSelectionMode("exclude");
                        // Remove excluded sections from pricing if any are already selected
                        if (
                          pricingMode === "per_section" &&
                          selectedSections.size > 0
                        ) {
                          selectedSections.forEach((sectionId) => {
                            const index = sectionPricingFields.findIndex(
                              (f) => f.section_id === sectionId
                            );
                            if (index >= 0) {
                              removeSection(index);
                            }
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Exclude Specific Sections</span>
                  </label>
                </div>
              </div>

              {(sectionSelectionMode === "include" ||
                sectionSelectionMode === "exclude") && (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {availableSeatsBySection.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {/* Show only sections that have seats available to add (stable list, doesn't change when checkboxes are toggled) */}
                        {availableSeatsBySection.map(
                          ({ sectionId, sectionName, count }) => {
                            const isExcluded =
                              sectionSelectionMode === "exclude" &&
                              selectedSections.has(sectionId);
                            const isIncluded =
                              sectionSelectionMode === "include" &&
                              selectedSections.has(sectionId);

                            return (
                              <label
                                key={sectionId}
                                className={`flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted ${
                                  isExcluded ? "opacity-50" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSections.has(sectionId)}
                                  onChange={() =>
                                    toggleSectionSelection(sectionId)
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">
                                  {sectionName} ({count} seats)
                                </span>
                              </label>
                            );
                          }
                        )}
                      </div>
                      {sectionSelectionMode === "exclude" &&
                        selectedSections.size > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {selectedSections.size} section
                            {selectedSections.size !== 1 ? "s" : ""} will be
                            excluded from initialization
                          </p>
                        )}
                      {sectionSelectionMode === "include" &&
                        selectedSections.size > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Only {selectedSections.size} selected section
                            {selectedSections.size !== 1 ? "s" : ""} will be
                            included
                          </p>
                        )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All seats have already been initialized. No sections
                      available for selection.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Show info message when in drill-down mode */}
          {designMode === "section-level" && selectedSectionId && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-1">
                    Initializing Seats for Selected Section
                  </h3>
                  <p className="text-sm text-blue-800">
                    You are initializing seats for the selected section only. Only
                    seats from this section will be added to the event.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-medium mb-4">Pricing Configuration</h3>
            <div className="space-y-4">
              {/* Pricing Mode */}
              <div className="space-y-2">
                <Label>Pricing Mode</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("pricingMode")}
                      value="same"
                      onChange={(e) => {
                        register("pricingMode").onChange(e);
                        handlePricingModeChange("same");
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Same Price for All Sections</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("pricingMode")}
                      value="per_section"
                      onChange={(e) => {
                        register("pricingMode").onChange(e);
                        handlePricingModeChange("per_section");
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Different Price per Section</span>
                  </label>
                </div>
              </div>

              {/* Default Price (for same mode or fallback) */}
              {pricingMode === "same" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="defaultPrice"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Price (per seat)
                  </Label>
                  <Input
                    id="defaultPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("defaultPrice", {
                      required: "Price is required",
                      min: { value: 0, message: "Price must be 0 or greater" },
                      valueAsNumber: false,
                    })}
                  />
                  {errors.defaultPrice && (
                    <p className="text-sm text-destructive">
                      {errors.defaultPrice.message}
                    </p>
                  )}
                </div>
              )}

              {/* Per-Section Pricing */}
              {pricingMode === "per_section" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Section Prices</Label>
                    <p className="text-xs text-muted-foreground">
                      Set prices per section. Expand sections to set individual
                      seat prices.
                    </p>
                  </div>
                  <div className="space-y-2 border rounded-lg p-3">
                    {missingSeatsBySection.map((section) => {
                      const sectionFieldIndex = sectionPricingFields.findIndex(
                        (f) => f.section_id === section.sectionId
                      );
                      const sectionSeats =
                        seatsBySection.get(section.sectionId) || [];
                      const isExpanded = expandedSections.has(
                        section.sectionId
                      );
                      const hasSeatOverrides = seatPricingFields.some((sp) =>
                        sectionSeats.some((s) => s.id === sp.seat_id)
                      );

                      return (
                        <div
                          key={section.sectionId}
                          className="border rounded-lg p-3 space-y-3"
                        >
                          {/* Section Header */}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSectionExpansion(section.sectionId)
                              }
                              className="flex items-center gap-2 hover:bg-muted p-1 rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                {section.sectionName}
                                {hasSeatOverrides && (
                                  <Badge variant="outline" className="text-xs">
                                    Custom Prices
                                  </Badge>
                                )}
                              </Label>
                              {sectionFieldIndex >= 0 ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="mt-1"
                                  {...register(
                                    `sectionPricing.${sectionFieldIndex}.price` as const,
                                    {
                                      required: "Price is required",
                                      min: {
                                        value: 0,
                                        message: "Price must be 0 or greater",
                                      },
                                      valueAsNumber: false,
                                    }
                                  )}
                                />
                              ) : (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="mt-1"
                                  value={defaultPrice || "0"}
                                  onChange={(e) => {
                                    if (sectionFieldIndex < 0) {
                                      appendSection({
                                        section_id: section.sectionId,
                                        price: e.target.value,
                                      });
                                    }
                                  }}
                                />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {section.count} seats
                            </div>
                          </div>

                          {/* Expanded Seat List */}
                          {isExpanded && sectionSeats.length > 0 && (
                            <div className="ml-8 space-y-2 border-t pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs text-muted-foreground">
                                  Individual Seat Prices (optional overrides)
                                  {sectionSeats.length > 50 && (
                                    <span className="ml-2 text-muted-foreground">
                                      ({sectionSeats.length} seats)
                                    </span>
                                  )}
                                </Label>
                                <div className="flex items-center gap-2">
                                  {sectionSeats.length > 50 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => {
                                        const selectedSeats = sectionSeats.filter(
                                          (s) => selectedSeatIds.has(s.id)
                                        );
                                        if (selectedSeats.length === 0) {
                                          // If no seats selected, select all visible
                                          const filtered = filterSeatsBySearch(
                                            sectionSeats
                                          );
                                          setSelectedSeatIds(
                                            new Set(filtered.map((s) => s.id))
                                          );
                                        } else {
                                          // Apply price to selected seats
                                          let sectionPrice = defaultPrice || "0";
                                          if (sectionFieldIndex >= 0) {
                                            const currentSectionPrice = getValues(
                                              `sectionPricing.${sectionFieldIndex}.price`
                                            );
                                            sectionPrice =
                                              currentSectionPrice ||
                                              sectionPricingFields[
                                                sectionFieldIndex
                                              ]?.price ||
                                              defaultPrice ||
                                              "0";
                                          }
                                          selectedSeats.forEach((seat) => {
                                            setSeatPrice(seat.id, sectionPrice);
                                          });
                                          setSelectedSeatIds(new Set());
                                        }
                                      }}
                                    >
                                      {selectedSeatIds.size > 0
                                        ? `Apply to ${selectedSeatIds.size} Selected`
                                        : "Select All Visible"}
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      // Get current section price from form values
                                      let sectionPrice = defaultPrice || "0";
                                      if (sectionFieldIndex >= 0) {
                                        const currentSectionPrice = getValues(
                                          `sectionPricing.${sectionFieldIndex}.price`
                                        );
                                        sectionPrice =
                                          currentSectionPrice ||
                                          sectionPricingFields[sectionFieldIndex]
                                            ?.price ||
                                          defaultPrice ||
                                          "0";
                                      }

                                      // Apply section price to all seats in section
                                      sectionSeats.forEach((seat) => {
                                        setSeatPrice(seat.id, sectionPrice);
                                      });
                                    }}
                                  >
                                    Apply Section Price to All
                                  </Button>
                                </div>
                              </div>

                              {/* Search for large seat lists */}
                              {sectionSeats.length > 50 && (
                                <div className="relative mb-2">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder="Search by row, seat number, or section..."
                                    value={seatSearchQuery}
                                    onChange={(e) => {
                                      setSeatSearchQuery(e.target.value);
                                      setCurrentPage(1); // Reset to first page on search
                                    }}
                                    className="pl-8 h-8 text-xs"
                                  />
                                </div>
                              )}

                              {/* Filtered and paginated seats */}
                              {(() => {
                                const filteredSeats = filterSeatsBySearch(
                                  sectionSeats
                                );
                                const paginatedSeats =
                                  sectionSeats.length > 50
                                    ? paginateSeats(filteredSeats)
                                    : filteredSeats;
                                const totalPages = Math.ceil(
                                  filteredSeats.length / seatsPerPage
                                );

                                return (
                                  <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                                      {paginatedSeats.map((seat) => {
                                  const seatPriceIndex =
                                    seatPricingFields.findIndex(
                                      (sp) => sp.seat_id === seat.id
                                    );
                                  const currentPrice = getSeatPrice(seat);
                                  const hasOverride = seatPriceIndex >= 0;

                                        const isSelected = selectedSeatIds.has(
                                          seat.id
                                        );

                                        return (
                                          <div
                                            key={seat.id}
                                            className={`flex items-center gap-1.5 p-1.5 rounded border ${
                                              hasOverride
                                                ? "bg-blue-50 border-blue-200"
                                                : ""
                                            } ${
                                              isSelected
                                                ? "ring-2 ring-blue-500 border-blue-500"
                                                : ""
                                            }`}
                                          >
                                            {sectionSeats.length > 50 && (
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const newSelected = new Set(
                                                    selectedSeatIds
                                                  );
                                                  if (e.target.checked) {
                                                    newSelected.add(seat.id);
                                                  } else {
                                                    newSelected.delete(seat.id);
                                                  }
                                                  setSelectedSeatIds(newSelected);
                                                }}
                                                className="h-3 w-3 flex-shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <Label className="text-xs text-muted-foreground truncate mb-0.5 block">
                                                {seat.row}-{seat.seat_number}
                                              </Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder={currentPrice}
                                          className="h-7 text-xs py-1 px-2"
                                          value={
                                            seatPriceIndex >= 0
                                              ? (watch(
                                                  `seatPricing.${seatPriceIndex}.price`
                                                ) as string | undefined) ||
                                                seatPricingFields[
                                                  seatPriceIndex
                                                ]?.price ||
                                                ""
                                              : ""
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value && value !== "") {
                                              // Set or update the seat price
                                              if (seatPriceIndex >= 0) {
                                                setValue(
                                                  `seatPricing.${seatPriceIndex}.price`,
                                                  value,
                                                  {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                  }
                                                );
                                              } else {
                                                setSeatPrice(seat.id, value);
                                              }
                                            } else if (seatPriceIndex >= 0) {
                                              // If cleared and field exists, remove the override
                                              removeSeatPrice(seat.id);
                                            }
                                          }}
                                              />
                                            </div>
                                            {hasOverride && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 flex-shrink-0"
                                                onClick={() =>
                                                  removeSeatPrice(seat.id)
                                                }
                                                title="Remove override (use section price)"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Pagination for large lists */}
                                    {sectionSeats.length > 50 &&
                                      filteredSeats.length > seatsPerPage && (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                          <div className="text-xs text-muted-foreground">
                                            Showing{" "}
                                            {(currentPage - 1) * seatsPerPage +
                                              1}
                                            -
                                            {Math.min(
                                              currentPage * seatsPerPage,
                                              filteredSeats.length
                                            )}{" "}
                                            of {filteredSeats.length} seats
                                            {seatSearchQuery && (
                                              <span className="ml-1">
                                                (filtered from {sectionSeats.length})
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-7 px-2 text-xs"
                                              onClick={() =>
                                                setCurrentPage((p) =>
                                                  Math.max(1, p - 1)
                                                )
                                              }
                                              disabled={currentPage === 1}
                                            >
                                              <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs text-muted-foreground px-2">
                                              Page {currentPage} of {totalPages}
                                            </span>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-7 px-2 text-xs"
                                              onClick={() =>
                                                setCurrentPage((p) =>
                                                  Math.min(totalPages, p + 1)
                                                )
                                              }
                                              disabled={currentPage === totalPages}
                                            >
                                              <ChevronRightIcon className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                    {/* Empty search results */}
                                    {seatSearchQuery &&
                                      filteredSeats.length === 0 && (
                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                          No seats found matching "{seatSearchQuery}"
                                        </div>
                                      )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {missingSeatsBySection.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No sections available. All seats may already be assigned.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Ticket Code Options */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Ticket Options</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generateTicketCodes"
                  {...register("generateTicketCodes")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="generateTicketCodes"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Ticket className="h-4 w-4" />
                  Generate Tickets
                </Label>
              </div>

              {generateTicketCodes && (
                <p className="text-xs text-muted-foreground pl-6">
                  Tickets will be created for all seats with AVAILABLE status,
                  ready for sale. Ticket numbers will be generated
                  automatically.
                </p>
              )}

              {!generateTicketCodes && (
                <p className="text-xs text-muted-foreground pl-6">
                  Seats will be created without tickets. Tickets can be created
                  later from the seat list.
                </p>
              )}
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium mb-3">Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Seats to {hasMissingSeats ? "add" : "create"}:
                </span>
                <span className="font-medium">{missingSeatsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pricing Mode:</span>
                <span className="font-medium">
                  {pricingMode === "same" ? "Same Price" : "Per Section"}
                </span>
              </div>
              {pricingMode === "same" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    ${parseFloat(defaultPrice || "0").toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generate Tickets:</span>
                <span className="font-medium">
                  {generateTicketCodes ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total value:</span>
                <span>${calculateTotalValue().toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </FullScreenDialog>
  );
}
