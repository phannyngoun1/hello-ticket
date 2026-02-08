/**
 * Seat Designer Component
 *
 * Interactive component for designing seat layouts by uploading a venue image
 * and placing seats by clicking on the image.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { Card } from "@truths/ui";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seatService } from "../seat-service";
import { sectionService } from "../../sections/section-service";
import { SeatType } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@truths/api";
import { uploadService } from "@truths/shared";
import { ConfirmationDialog } from "@truths/custom-ui";
import { detectMarkers } from "../../ai/detect-markers";
import { detectSeats } from "../../ai/detect-seats";
import { toast } from "@truths/ui";
import { LayoutCanvas } from "./layout-canvas";
import Konva from "konva";
import { getUniqueSections as getUniqueSectionsUtil } from "./utils";
import {
  sectionFormSchema,
  seatFormSchema,
  type SectionFormData,
  type SeatFormData,
} from "./form-schemas";
import {
  ZoomControls,
  ImageUploadCard,
  InstructionsPanel,
  SectionFormSheet,
  SeatEditSheet,
  SeatEditControls,
  SectionDetailView,
  DatasheetView,
  SelectedSectionSheet,
  ManageSectionsSheet,
  SeatDesignToolbar,
  SeatDesignCanvas,
  ShapeToolbox,
  SectionCreationToolbar,
  DesignerHeader,
} from "./components";

// Import types from the seat-designer folder
import type {
  SeatDesignerProps,
  SectionMarker,
  SeatInfo,
  SeatMarker,
} from "./types";
import { PlacementShapeType, type PlacementShape } from "./types";
export type { SeatDesignerProps, SectionMarker, SeatInfo, SeatMarker };

export function SeatDesigner({
  venueId,
  layoutId,
  layoutName,
  imageUrl: initialImageUrl,
  designMode = "seat-level", // Design mode from layout (defaults to seat-level for backward compatibility)
  readOnly = false,
  initialSeats,
  initialSections,
  onImageUpload,
  className,
  fileId: initialFileId,
}: SeatDesignerProps & { fileId?: string }) {
  // Keep old venueType for backward compatibility (can be removed later)
  const venueType: "small" | "large" =
    designMode === "seat-level" ? "small" : "large";

  // Main floor plan image (for both types)
  const [mainImageUrl, setMainImageUrl] = useState<string | undefined>(
    initialImageUrl
  );
  // Store file_id for the main image
  const [mainImageFileId, setMainImageFileId] = useState<string | undefined>(
    initialFileId
  );

  // Update image URL when prop changes (e.g., when layout loads asynchronously)
  useEffect(() => {
    // Always update when initialImageUrl changes, even if it's undefined (to clear)
    setMainImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  // Large venue: sections placed on main floor plan
  const [sectionMarkers, setSectionMarkers] = useState<SectionMarker[]>([]);
  const [selectedSectionMarker, setSelectedSectionMarker] =
    useState<SectionMarker | null>(null);
  const [isSelectedSectionSheetOpen, setIsSelectedSectionSheetOpen] =
    useState(false);
  // Always in placement mode - simplified
  const isPlacingSections = true;
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  const [isDetectingSections, setIsDetectingSections] = useState(false);
  const [isDetectingSeats, setIsDetectingSeats] = useState(false);
  // Store coordinates when clicking to place a section (pending section creation)
  const [pendingSectionCoordinates, setPendingSectionCoordinates] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Section Form
  const sectionForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "Section A",
    },
  });

  // Section detail view (when clicking a section in large venue mode)
  const [viewingSection, setViewingSection] = useState<SectionMarker | null>(
    null
  );

  // Seats (for small venue: all seats, for large venue: seats in viewingSection)
  const [seats, setSeats] = useState<SeatMarker[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatMarker | null>(null);
  /** Multi-selection: all selected seat ids (for highlight + Delete key). */
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  /** Multi-selection: all selected section ids (for highlight + Delete key). */
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  // Always in placement mode - simplified
  const isPlacingSeats = true;

  // Seat Placement Form (for placing new seats)
  const seatPlacementForm = useForm<SeatFormData>({
    resolver: zodResolver(seatFormSchema),
    defaultValues: {
      section: "Section A",
      sectionId: undefined,
      row: "Row 1",
      seatNumber: "1",
      seatType: SeatType.STANDARD,
    },
  });

  const [sectionSelectValue, setSectionSelectValue] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDatasheetOpen, setIsDatasheetOpen] = useState(false);
  const [viewingSeat, setViewingSeat] = useState<SeatMarker | null>(null);
  /** Inline seat edit in toolbox (similar to section designer) */
  const [isEditingSeat, setIsEditingSeat] = useState(false);

  // Copy/paste state
  const [copiedSeat, setCopiedSeat] = useState<SeatMarker | null>(null);
  const [copiedSection, setCopiedSection] = useState<SectionMarker | null>(
    null
  );

  // Seat Edit Form (for editing existing seats)
  const seatEditForm = useForm<SeatFormData>({
    resolver: zodResolver(seatFormSchema),
    defaultValues: {
      section: "",
      sectionId: undefined,
      row: "",
      seatNumber: "",
      seatType: SeatType.STANDARD,
    },
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  const [isSectionCreationPending, setIsSectionCreationPending] =
    useState(false);

  // Debounce timers for shape updates to prevent rate limiting
  const seatShapeUpdateTimersRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  // Shape state for placement marks
  const [placementShape, setPlacementShape] = useState<PlacementShape>({
    type: PlacementShapeType.CIRCLE,
    radius: 1.2,
  });

  // Selected shape tool from toolbox
  const [selectedShapeTool, setSelectedShapeTool] =
    useState<PlacementShapeType | null>(null);

  // Shape overlays for making areas clickable
  const [shapeOverlays, setShapeOverlays] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      shape: PlacementShape;
      onClick?: () => void;
      onHover?: () => void;
      label?: string;
      isSelected?: boolean;
      isPlacement?: boolean;
    }>
  >([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );

  // Combine existing overlays with pending section creation shape
  const displayedShapeOverlays = useMemo(() => {
    if (isSectionCreationPending && pendingSectionCoordinates) {
      return [
        ...shapeOverlays,
        {
          id: "pending-section-creation",
          x: pendingSectionCoordinates.x,
          y: pendingSectionCoordinates.y,
          shape: placementShape,
          isSelected: true, // Make it look selected/active
          isPlacement: true, // Use dashed style for placement
        },
      ];
    }
    return shapeOverlays;
  }, [
    shapeOverlays,
    isSectionCreationPending,
    pendingSectionCoordinates,
    placementShape,
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const deleteSeatRef = useRef<(seat: SeatMarker) => void>(() => {});
  const deleteSectionRef = useRef<
    (section: { id: string; isNew?: boolean }) => void
  >(() => {});
  const queryClient = useQueryClient();
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [dimensionsReady, setDimensionsReady] = useState(false);

  // Fetch existing seats only if initialSeats not provided (for backward compatibility)
  const {
    data: existingSeats,
    isLoading,
    error: seatsError,
  } = useQuery({
    queryKey: ["seats", layoutId],
    queryFn: () => seatService.getByLayout(layoutId),
    enabled: !!layoutId && !initialSeats, // Only fetch if initialSeats not provided
    retry: false, // Don't retry if column doesn't exist
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false,
  });

  // Fetch sections for the layout (needed for seat-level mode select box and seat editing)
  const { data: sectionsData } = useQuery({
    queryKey: ["sections", "layout", layoutId],
    queryFn: () => sectionService.getByLayout(layoutId),
    enabled: !!layoutId, // Enable for both modes since we need it for seat editing
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Ensure a default section exists in UI for section-level (large) mode
  // Only create temporary marker if no sections from API and no initialSections
  useEffect(() => {
    if (
      designMode === "section-level" &&
      sectionMarkers.length === 0 &&
      !isLoading &&
      !initialSections &&
      (!sectionsData || sectionsData.length === 0)
    ) {
      const defaultSection: SectionMarker = {
        id: `section-default`,
        name: "Section A",
        x: 50,
        y: 50,
        isNew: true,
      };
      setSectionMarkers([defaultSection]);
      // Don't auto-select the section to avoid opening the Selected Section sheet immediately
      // setSelectedSectionMarker(defaultSection);
      sectionForm.setValue("name", defaultSection.name);
    }
  }, [
    designMode,
    isLoading,
    sectionMarkers.length,
    initialSections,
    sectionsData,
  ]);

  // Validate venueId and layoutId after hooks
  if (!venueId) {
    return <div className="p-4 text-destructive">Venue ID is required</div>;
  }

  if (!layoutId) {
    return <div className="p-4 text-destructive">Layout ID is required</div>;
  }

  // Initial synchronous measurement to avoid first-render resizing
  useLayoutEffect(() => {
    if (dimensionsReady) return;
    const measure = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect && rect.width > 0 ? Math.floor(rect.width) : 800;
      const height = rect && rect.height > 0 ? Math.floor(rect.height) : 600;
      setContainerDimensions({ width, height });
      setDimensionsReady(true);
    };
    measure();
    // Fallback in case layout/paint not ready on first pass
    const timeoutId = setTimeout(measure, 50);
    return () => clearTimeout(timeoutId);
  }, [dimensionsReady]);

  // Track container dimensions for Konva canvas after initial measure
  useEffect(() => {
    if (!containerRef.current || !dimensionsReady) return;

    let timeoutId: NodeJS.Timeout;
    let rafId: number;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.floor(rect.width) || 800;
      const height = Math.floor(rect.height) || 600;

      setContainerDimensions((prev) => {
        const widthDiff = Math.abs(prev.width - width);
        const heightDiff = Math.abs(prev.height - height);
        if (widthDiff <= 2 && heightDiff <= 2) {
          return prev;
        }
        return { width, height };
      });
    };

    const scheduleUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateDimensions, 150);
      });
    };

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", scheduleUpdate);

    // Prevent wheel events from scrolling the page (macOS trackpad)
    const container = containerRef.current;
    const preventWheelScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    container.addEventListener("wheel", preventWheelScroll, { passive: false });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      container.removeEventListener("wheel", preventWheelScroll);
    };
  }, [dimensionsReady]);

  // Load existing sections when initialSections provided
  useEffect(() => {
    if (initialSections && designMode === "section-level") {
      console.log("Loading sections from initialSections:", initialSections);
      const markers: SectionMarker[] = initialSections.map((section) => {
        console.log(
          "Processing initialSection:",
          section.id,
          "shape value:",
          section.shape,
          "type:",
          typeof section.shape,
          "has shape prop:",
          "shape" in section
        );
        let shape: PlacementShape | undefined;
        if ("shape" in section && section.shape) {
          try {
            const parsed = JSON.parse(section.shape);
            console.log("Parsed shape JSON from initialSections:", parsed);
            // Normalize the type to ensure it matches the enum
            if (parsed && typeof parsed === "object" && parsed.type) {
              const normalized: PlacementShape = {
                ...parsed,
                type: parsed.type as PlacementShapeType,
              };
              shape = normalized;
              console.log(
                "Normalized shape from initialSections:",
                normalized,
                "Type:",
                normalized.type
              );
            } else {
              console.warn(
                "Parsed shape is invalid from initialSections:",
                parsed
              );
            }
          } catch (e) {
            console.error(
              "Failed to parse section shape from initialSections:",
              e,
              "Raw shape string:",
              section.shape
            );
          }
        } else {
          console.log(
            "Section from initialSections has no shape or shape is falsy:",
            {
              id: section.id,
              name: section.name,
              shape: section.shape,
              hasShapeProp: "shape" in section,
            }
          );
        }
        return {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          shape,
          isNew: false,
        };
      });
      console.log(
        "Section markers created from initialSections:",
        markers.map((m) => ({
          id: m.id,
          name: m.name,
          hasShape: !!m.shape,
          shapeType: m.shape?.type,
          shape: m.shape,
        }))
      );
      setSectionMarkers(markers);
      // Don't auto-select the first section to avoid opening the Selected Section sheet immediately
      // if (markers.length > 0) {
      //   setSelectedSectionMarker((prev) => prev || markers[0]);
      //   sectionForm.setValue("name", markers[0].name);
      // }
    }
  }, [initialSections, designMode]);

  // Load existing sections from API query when initialSections not provided
  // This ensures sections created by the backend (like default section) are loaded
  useEffect(() => {
    if (
      !initialSections &&
      sectionsData !== undefined && // sectionsData has been loaded (could be empty array)
      designMode === "section-level"
    ) {
      // Always sync sectionsData to sectionMarkers, even if empty
      // This replaces any temporary "section-default" markers with real sections
      console.log("sectionsData received:", sectionsData);
      const markers: SectionMarker[] = sectionsData.map((section) => {
        console.log(
          "Processing section:",
          section.id,
          "shape value:",
          section.shape,
          "type:",
          typeof section.shape,
          "isTruthy:",
          !!section.shape
        );
        let shape: PlacementShape | undefined;
        if (section.shape) {
          try {
            const parsed = JSON.parse(section.shape);
            console.log("Parsed shape JSON:", parsed);
            // Normalize the type to ensure it matches the enum
            if (parsed && typeof parsed === "object" && parsed.type) {
              const normalized: PlacementShape = {
                ...parsed,
                type: parsed.type as PlacementShapeType,
              };
              shape = normalized;
              console.log(
                "Normalized shape:",
                normalized,
                "Type:",
                normalized.type
              );
            } else {
              console.warn("Parsed shape is invalid:", parsed);
            }
          } catch (e) {
            console.error(
              "Failed to parse section shape:",
              e,
              "Raw shape string:",
              section.shape
            );
          }
        } else {
          console.log(
            "Section has no shape property or shape is falsy. Section:",
            { id: section.id, name: section.name, shape: section.shape }
          );
        }
        return {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          shape,
          isNew: false,
        };
      });
      console.log(
        "Section markers created from sectionsData:",
        markers.map((m) => ({
          id: m.id,
          name: m.name,
          hasShape: !!m.shape,
          shapeType: m.shape?.type,
          shape: m.shape,
        }))
      );
      setSectionMarkers(markers);
    }
  }, [sectionsData, initialSections, designMode]);

  // Track the last loaded data to prevent unnecessary reloads
  const lastInitialSeatsRef = useRef<typeof initialSeats>();
  const lastExistingSeatsRef = useRef<typeof existingSeats>();

  // Load existing seats when fetched or when initialSeats provided
  useEffect(() => {
    // Only reload if the data source actually changed
    const initialSeatsChanged = initialSeats !== lastInitialSeatsRef.current;
    const existingSeatsChanged = existingSeats !== lastExistingSeatsRef.current;

    if (
      !initialSeatsChanged &&
      !existingSeatsChanged &&
      lastInitialSeatsRef.current !== undefined
    ) {
      // Data hasn't changed, don't reload (preserves newly created seats)
      return;
    }

    // If initialSeats is provided, use it directly (from combined endpoint)
    if (initialSeats) {
      lastInitialSeatsRef.current = initialSeats;
      if (initialSeats.length > 0) {
        console.log("Loading seats from initialSeats:", initialSeats);
        const markers: SeatMarker[] = initialSeats.map((seat) => {
          console.log(
            "Processing initialSeat:",
            seat.id,
            "shape value:",
            seat.shape,
            "type:",
            typeof seat.shape,
            "has shape prop:",
            "shape" in seat
          );
          // Parse shape from JSON string if available
          let shape: PlacementShape | undefined;
          if ("shape" in seat && seat.shape) {
            try {
              const parsed = JSON.parse(seat.shape);
              console.log("Parsed seat shape JSON from initialSeats:", parsed);
              // Normalize the type to ensure it matches the enum
              if (parsed && typeof parsed === "object" && parsed.type) {
                const normalized: PlacementShape = {
                  ...parsed,
                  type: parsed.type as PlacementShapeType,
                };
                shape = normalized;
                console.log(
                  "Normalized seat shape from initialSeats:",
                  normalized,
                  "Type:",
                  normalized.type
                );
              } else {
                console.warn(
                  "Parsed seat shape is invalid from initialSeats:",
                  parsed
                );
              }
            } catch (e) {
              console.error(
                "Failed to parse seat shape from initialSeats:",
                e,
                "Raw shape string:",
                seat.shape
              );
            }
          } else {
            console.log(
              "Seat from initialSeats has no shape or shape is falsy:",
              { id: seat.id, shape: seat.shape, hasShapeProp: "shape" in seat }
            );
          }

          return {
            id: seat.id,
            x: seat.x_coordinate || 0,
            y: seat.y_coordinate || 0,
            seat: {
              section: seat.section_name || seat.section_id || "Unknown",
              sectionId: seat.section_id,
              row: seat.row,
              seatNumber: seat.seat_number,
              seatType: seat.seat_type as SeatType,
            },
            shape,
          };
        });
        console.log(
          "Seat markers created from initialSeats:",
          markers.map((m) => ({
            id: m.id,
            hasShape: !!m.shape,
            shapeType: m.shape?.type,
            shape: m.shape,
          }))
        );
        setSeats(markers);
      } else {
        // Layout exists but has no seats yet - start with empty array
        setSeats([]);
      }
    } else if (existingSeats) {
      // Fallback to query result if initialSeats not provided
      lastExistingSeatsRef.current = existingSeats;
      console.log("Loading seats from existingSeats:", existingSeats);
      if (existingSeats.items && existingSeats.items.length > 0) {
        const markers: SeatMarker[] = existingSeats.items.map((seat) => {
          console.log(
            "Processing existingSeat:",
            seat.id,
            "shape value:",
            seat.shape,
            "type:",
            typeof seat.shape
          );
          // Parse shape from JSON string if available
          let shape: PlacementShape | undefined;
          if (seat.shape) {
            try {
              const parsed = JSON.parse(seat.shape);
              console.log("Parsed seat shape JSON from existingSeats:", parsed);
              // Normalize the type to ensure it matches the enum
              if (parsed && typeof parsed === "object" && parsed.type) {
                const normalized: PlacementShape = {
                  ...parsed,
                  type: parsed.type as PlacementShapeType,
                };
                shape = normalized;
                console.log(
                  "Normalized seat shape from existingSeats:",
                  normalized,
                  "Type:",
                  normalized.type
                );
              } else {
                console.warn(
                  "Parsed seat shape is invalid from existingSeats:",
                  parsed
                );
              }
            } catch (e) {
              console.error(
                "Failed to parse seat shape from existingSeats:",
                e,
                "Raw shape string:",
                seat.shape
              );
            }
          } else {
            console.log(
              "Seat from existingSeats has no shape or shape is falsy:",
              { id: seat.id, shape: seat.shape }
            );
          }

          return {
            id: seat.id,
            x: seat.x_coordinate || 0,
            y: seat.y_coordinate || 0,
            seat: {
              section: seat.section_name || seat.section_id || "Unknown",
              sectionId: seat.section_id,
              row: seat.row,
              seatNumber: seat.seat_number,
              seatType: seat.seat_type,
            },
            shape,
          };
        });
        console.log(
          "Seat markers created from existingSeats:",
          markers.map((m) => ({
            id: m.id,
            hasShape: !!m.shape,
            shapeType: m.shape?.type,
            shape: m.shape,
          }))
        );
        setSeats(markers);
      } else if (
        lastInitialSeatsRef.current === undefined &&
        lastExistingSeatsRef.current === undefined
      ) {
        // Only reset on first load when no data exists
        setSeats([]);
      }
    } else if (
      !isLoading &&
      !seatsError &&
      !initialSeats &&
      lastInitialSeatsRef.current === undefined &&
      lastExistingSeatsRef.current === undefined
    ) {
      // Query completed but no data - reset seats only on first load
      setSeats([]);
    }
  }, [existingSeats, initialSeats, isLoading, seatsError]);

  // Get seats for current context
  const displayedSeats =
    venueType === "small"
      ? seats
      : viewingSection
        ? seats.filter((s) => s.seat.section === viewingSection.name)
        : [];

  // Handle main image upload
  const handleMainImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);
        const response = await uploadService.uploadImage(file);
        setMainImageUrl(response.url);
        setMainImageFileId(response.id); // Store file_id
        if (onImageUpload) {
          onImageUpload(response.url);
        }

        // Force container dimension re-measurement after image upload
        setTimeout(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const width = Math.floor(rect.width) || 800;
            const height = Math.floor(rect.height) || 600;
            setContainerDimensions({ width, height });
          }
        }, 100);
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Handle section image upload (for large venue mode)
  const handleSectionImageSelect = async (
    sectionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);
        const response = await uploadService.uploadImage(file);

        // Update local state immediately for UI feedback
        setSectionMarkers((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, imageUrl: response.url } : s
          )
        );
        // Update viewingSection if it's the same section being viewed
        if (viewingSection?.id === sectionId) {
          setViewingSection((prev) =>
            prev ? { ...prev, imageUrl: response.url } : null
          );
        }

        // Save file_id to the section in the database
        // Try to get section from sectionsData first (saved in DB), otherwise use sectionMarkers
        const sectionFromData = sectionsData?.find((s) => s.id === sectionId);
        const sectionFromMarkers = sectionMarkers.find(
          (s) => s.id === sectionId
        );

        if (sectionFromData || sectionFromMarkers) {
          const section = sectionFromData || sectionFromMarkers;
          if (!section) {
            throw new Error("Section not found");
          }
          const isNewSection = sectionFromMarkers?.isNew === true;

          if (isNewSection && sectionFromMarkers) {
            // Section marker not yet saved: create it in DB with file_id
            const created = await sectionService.create({
              layout_id: layoutId,
              name: sectionFromMarkers.name,
              x_coordinate: sectionFromMarkers.x,
              y_coordinate: sectionFromMarkers.y,
              file_id: response.id,
              shape: sectionFromMarkers.shape
                ? JSON.stringify(sectionFromMarkers.shape)
                : undefined,
            });
            // Replace temp id with real section id and mark as saved
            const oldId = sectionId;
            setSectionMarkers((prev) =>
              prev.map((s) =>
                s.id === oldId
                  ? {
                      ...s,
                      id: created.id,
                      imageUrl: response.url,
                      isNew: false,
                    }
                  : s
              )
            );
            if (selectedSectionMarker?.id === oldId) {
              setSelectedSectionMarker((prev) =>
                prev
                  ? {
                      ...prev,
                      id: created.id,
                      imageUrl: response.url,
                      isNew: false,
                    }
                  : null
              );
            }
            if (viewingSection?.id === oldId) {
              setViewingSection((prev) =>
                prev
                  ? {
                      ...prev,
                      id: created.id,
                      imageUrl: response.url,
                      isNew: false,
                    }
                  : null
              );
            }
          } else {
            // Section already in DB: update with file_id
            await sectionService.update(sectionId, {
              name: section.name,
              x_coordinate: sectionFromData
                ? (sectionFromData.x_coordinate ?? undefined)
                : sectionFromMarkers?.x,
              y_coordinate: sectionFromData
                ? (sectionFromData.y_coordinate ?? undefined)
                : sectionFromMarkers?.y,
              file_id: response.id,
            });
          }

          // Invalidate sections query to refresh data
          queryClient.invalidateQueries({
            queryKey: ["sections", "layout", layoutId],
          });
        }

        // Force container dimension re-measurement after image upload
        setTimeout(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const width = Math.floor(rect.width) || 800;
            const height = Math.floor(rect.height) || 600;
            setContainerDimensions({ width, height });
          }
        }, 100);
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Clear all placements
  const handleClearAllPlacements = () => {
    if (venueType === "small") {
      // Clear all seats for small venue
      setSeats([]);
    } else {
      // Clear all sections and their seats for large venue
      setSectionMarkers([]);
      setSeats([]);
    }
    setSelectedSeat(null);
  };

  // Detect sections from floor plan image via AI
  const handleDetectSections = useCallback(async () => {
    if (!mainImageUrl) return;
    setIsDetectingSections(true);
    try {
      const url = mainImageUrl.startsWith("http")
        ? mainImageUrl
        : `${window.location.origin}${mainImageUrl}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load image");
      const blob = await res.blob();
      const file = new File([blob], "floor-plan.png", {
        type: blob.type || "image/png",
      });
      const data = await detectMarkers(file);
      const newMarkers: SectionMarker[] = (data.sections || []).map((s, i) => {
        const shapeType =
          s.shape.type === "ellipse"
            ? PlacementShapeType.ELLIPSE
            : s.shape.type === "polygon"
              ? PlacementShapeType.POLYGON
              : PlacementShapeType.RECTANGLE;
        const shape: PlacementShape = {
          type: shapeType,
          width: s.shape.width,
          height: s.shape.height,
        };
        return {
          id: `detected-${Date.now()}-${i}`,
          name: s.name,
          x: s.shape.x,
          y: s.shape.y,
          isNew: true,
          shape,
        };
      });
      if (newMarkers.length > 0) {
        setSectionMarkers((prev) => [...prev, ...newMarkers]);
        toast({
          title: `Added ${newMarkers.length} suggested section(s). You can move or edit them.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No sections detected. Try a clearer floor plan image.",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("Detect sections failed:", err);
      if (err instanceof ApiError && err.status === 503) {
        toast({
          title: "AI section detection is not available",
          description:
            "The server is not configured for AI features. Please contact your administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title:
            err instanceof Error ? err.message : "Failed to detect sections",
          variant: "destructive",
        });
      }
    } finally {
      setIsDetectingSections(false);
    }
  }, [mainImageUrl]);

  // Detect seats from floor plan or section image via AI (seat-level)
  const handleDetectSeats = useCallback(async () => {
    const imageUrl = viewingSection?.imageUrl ?? mainImageUrl;
    if (!imageUrl) return;
    setIsDetectingSeats(true);
    try {
      const url = imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${imageUrl}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load image");
      const blob = await res.blob();
      const file = new File([blob], "floor-plan.png", {
        type: blob.type || "image/png",
      });
      const sectionName = viewingSection?.name ?? undefined;
      const data = await detectSeats(file, sectionName);
      const seatValues = seatPlacementForm.getValues();
      const sectionForNewSeats = viewingSection?.name ?? seatValues.section;
      const sectionIdForNewSeats = viewingSection?.id ?? seatValues.sectionId;
      const newSeats: SeatMarker[] = (data.seats || []).map((s, i) => ({
        id: `detected-${Date.now()}-${i}`,
        x: s.x,
        y: s.y,
        seat: {
          section: sectionForNewSeats,
          sectionId: sectionIdForNewSeats,
          row: s.row,
          seatNumber: s.seat_number,
          seatType: SeatType.STANDARD,
        },
        shape: {
          type: PlacementShapeType.RECTANGLE,
          width: s.width,
          height: s.height,
        },
        isNew: true,
      }));
      if (newSeats.length > 0) {
        setSeats((prev) => [...prev, ...newSeats]);
        toast({
          title: `Added ${newSeats.length} suggested seat(s). You can move or edit them.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No seats detected. Try a clearer image of the seating area.",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("Detect seats failed:", err);
      if (err instanceof ApiError && err.status === 503) {
        toast({
          title: "AI seat detection is not available",
          description:
            "The server is not configured for AI features. Please contact your administrato  r.",
          variant: "destructive",
        });
      } else {
        toast({
          title: err instanceof Error ? err.message : "Failed to detect seats",
          variant: "destructive",
        });
      }
    } finally {
      setIsDetectingSeats(false);
    }
  }, [mainImageUrl, viewingSection, seatPlacementForm]);

  // Clear seats in current section (for section detail view)
  const handleClearSectionSeats = () => {
    if (viewingSection) {
      setSeats((prev) =>
        prev.filter((s) => s.seat.section !== viewingSection.name)
      );
      setSelectedSeat(null);
    }
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // Max zoom 3x
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle shape drawing from canvas - creates section (section-level) or seat (seat-level)
  const handleShapeDraw = useCallback(
    (
      shape: PlacementShape,
      x: number,
      y: number,
      width?: number,
      height?: number
    ) => {
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      const finalShape: PlacementShape = {
        ...shape,
        ...(width && { width }),
        ...(height && { height }),
      };

      // When shape tool is selected, create section (section-level) or seat (seat-level)
      if (selectedShapeTool) {
        // Section-level layout: create section when shape tool is selected on main floor
        if (
          designMode === "section-level" &&
          venueType === "large" &&
          isPlacingSections &&
          !viewingSection
        ) {
          // Store coordinates and start inline creation
          setPendingSectionCoordinates({ x: clampedX, y: clampedY });
          // Store shape to apply after section is created
          setPlacementShape(finalShape);
          setIsSectionCreationPending(true);
          setEditingSectionId(null);
          // sectionForm.reset({ name: "" }); // Not used for inline creation
          return; // Exit early when creating section from shape tool
        }

        // Seat-level layout or section detail view: create seat markers
        const seatValues = seatPlacementForm.getValues();
        const newSeat: SeatMarker = {
          id: `temp-${Date.now()}`,
          x: clampedX,
          y: clampedY,
          seat: {
            section: viewingSection?.name || seatValues.section,
            sectionId: viewingSection?.id || seatValues.sectionId,
            row: seatValues.row,
            seatNumber: seatValues.seatNumber,
            seatType: seatValues.seatType,
          },
          shape: finalShape,
          isNew: true,
        };
        setSeats((prev) => [...prev, newSeat]);
        // Increment seat number for next placement
        const nextSeatNumber = String(parseInt(seatValues.seatNumber) + 1);
        seatPlacementForm.setValue("seatNumber", nextSeatNumber);
        return; // Exit early when creating seat from shape tool
      }

      // Section-level layout: create section (only for large venues on main floor, when no shape tool)
      if (
        designMode === "section-level" &&
        venueType === "large" &&
        isPlacingSections &&
        !viewingSection
      ) {
        // Store coordinates and open section form
        setPendingSectionCoordinates({ x: clampedX, y: clampedY });
        // Store shape to apply after section is created
        setPlacementShape(finalShape);
        setIsSectionCreationPending(true); // Switch to inline creation
        setEditingSectionId(null);
        // sectionForm.reset({ name: "" });
        return; // Don't create seat when creating section
      }

      // Create seat marker with shape (for normal seat placement mode)
      if (isPlacingSeats) {
        const seatValues = seatPlacementForm.getValues();
        const newSeat: SeatMarker = {
          id: `temp-${Date.now()}`,
          x: clampedX,
          y: clampedY,
          seat: {
            section: viewingSection?.name || seatValues.section,
            sectionId: viewingSection?.id || seatValues.sectionId,
            row: seatValues.row,
            seatNumber: seatValues.seatNumber,
            seatType: seatValues.seatType,
          },
          shape: finalShape,
          isNew: true,
        };
        setSeats((prev) => [...prev, newSeat]);
        // Increment seat number for next placement
        const nextSeatNumber = String(parseInt(seatValues.seatNumber) + 1);
        seatPlacementForm.setValue("seatNumber", nextSeatNumber);
      }
    },
    [
      designMode,
      venueType,
      viewingSection,
      isPlacingSeats,
      isPlacingSections,
      seatPlacementForm,
      sectionForm,
      selectedShapeTool,
    ]
  );

  // Handle shape overlay click
  const handleShapeOverlayClick = useCallback(
    (overlayId: string) => {
      setSelectedOverlayId(overlayId);
      const overlay = shapeOverlays.find((o) => o.id === overlayId);
      if (overlay) {
        overlay.onClick?.();
      }
    },
    [shapeOverlays]
  );

  // Handle Konva image click - uses percentage coordinates from LayoutCanvas
  // Note: This should NOT be called when drawing shapes with shape tools (drag-to-draw)
  // Shape tools use handleShapeDraw instead, which is called from onMouseUp in layout-canvas
  const handleKonvaImageClick = useCallback(
    (
      _e: Konva.KonvaEventObject<MouseEvent>,
      percentageCoords?: { x: number; y: number }
    ) => {
      if (!percentageCoords) return;

      // If pointer tool is selected (no shape tool), don't create markers - only deselection happens
      if (!selectedShapeTool) {
        return; // Just deselect, don't create anything
      }

      // We allow "Click to Add" for primitive shapes even if a tool is selected.
      // Drag-to-draw is handled by handleShapeDraw.
      // This click handler handles single-click placement.

      const { x, y } = percentageCoords;

      // Section detail view - place seats
      if (venueType === "large" && viewingSection && isPlacingSeats) {
        const seatValues = seatPlacementForm.getValues();
        const newSeat: SeatMarker = {
          id: `temp-${Date.now()}`,
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          seat: {
            section: viewingSection.name,
            sectionId: seatValues.sectionId,
            row: seatValues.row,
            seatNumber: seatValues.seatNumber,
            seatType: seatValues.seatType,
          },
          shape: placementShape,
          isNew: true,
        };
        setSeats((prev) => [...prev, newSeat]);
        // Increment seat number for next placement
        const nextSeatNumber = String(parseInt(seatValues.seatNumber) + 1);
        seatPlacementForm.setValue("seatNumber", nextSeatNumber);
      }
      // Main floor - place sections (open inline toolbar to get name)
      else if (venueType === "large" && isPlacingSections) {
        // Handle default shape for Click-to-Add based on selected tool
        let defaultShape: PlacementShape | undefined;

        switch (selectedShapeTool) {
          case PlacementShapeType.RECTANGLE:
            defaultShape = {
              type: PlacementShapeType.RECTANGLE,
              width: 15,
              height: 10,
            };
            break;
          case PlacementShapeType.CIRCLE:
            defaultShape = { type: PlacementShapeType.CIRCLE, radius: 8 };
            break;
          case PlacementShapeType.ELLIPSE:
            defaultShape = {
              type: PlacementShapeType.ELLIPSE,
              width: 15,
              height: 10,
            };
            break;
          default:
            // For Polygon/Freeform, we don't support single-click add yet (requires drawing)
            return;
        }

        if (defaultShape) {
          setPlacementShape(defaultShape);
        }

        // Store the coordinates where user clicked
        setPendingSectionCoordinates({ x, y });
        // Start inline creation
        setIsSectionCreationPending(true);
        setEditingSectionId(null);
      }
      // Small venue - place seats
      else if (venueType === "small" && isPlacingSeats) {
        const seatValues = seatPlacementForm.getValues();
        const newSeat: SeatMarker = {
          id: `temp-${Date.now()}`,
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          seat: {
            section: seatValues.section,
            sectionId: seatValues.sectionId,
            row: seatValues.row,
            seatNumber: seatValues.seatNumber,
            seatType: seatValues.seatType,
          },
          shape: placementShape,
          isNew: true,
        };
        setSeats((prev) => [...prev, newSeat]);
        // Increment seat number for next placement
        const nextSeatNumber = String(parseInt(seatValues.seatNumber) + 1);
        seatPlacementForm.setValue("seatNumber", nextSeatNumber);
      }
    },
    [
      venueType,
      viewingSection,
      isPlacingSeats,
      isPlacingSections,
      seatPlacementForm,
      sectionForm,
      selectedShapeTool,
    ]
  );

  // Handle Konva wheel event for zoom (only when Space is pressed)
  const handleKonvaWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>, isSpacePressed: boolean) => {
      // Only zoom if Space key is held
      if (isSpacePressed) {
        e.evt.preventDefault();
        const delta = e.evt.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev + delta)));
      }
      // If Space is not pressed, allow normal scrolling (don't preventDefault)
    },
    []
  );

  // Handle pan events from canvas
  const handlePan = useCallback((delta: { x: number; y: number }) => {
    setPanOffset((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  }, []);

  // Handle seat drag end from Konva
  const handleKonvaSeatDragEnd = useCallback(
    (seatId: string, newX: number, newY: number) => {
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === seatId
            ? {
                ...seat,
                x: Math.max(0, Math.min(100, newX)),
                y: Math.max(0, Math.min(100, newY)),
              }
            : seat
        )
      );
    },
    []
  );

  // Handle seat shape transform (resize/rotate)
  const handleSeatShapeTransform = useCallback(
    (seatId: string, shape: PlacementShape) => {
      // Update local state immediately
      setSeats((prev) => {
        const updated = prev.map((seat) =>
          seat.id === seatId
            ? {
                ...seat,
                shape,
              }
            : seat
        );

        // Save shape to backend for the updated seat (debounced to avoid rate limiting)
        const seat = updated.find((s) => s.id === seatId);
        if (seat && !seat.isNew) {
          // Clear existing timer for this seat
          const existingTimer = seatShapeUpdateTimersRef.current.get(seatId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Set new debounced timer (500ms delay)
          const timer = setTimeout(() => {
            seatService
              .updateCoordinates(seatId, seat.x, seat.y, shape)
              .catch((error) => {
                console.error("Failed to save seat shape:", error);
              });
            seatShapeUpdateTimersRef.current.delete(seatId);
          }, 500);

          seatShapeUpdateTimersRef.current.set(seatId, timer);
        }

        return updated;
      });
    },
    []
  );

  // Handle section drag end from Konva
  const handleKonvaSectionDragEnd = useCallback(
    (sectionId: string, newX: number, newY: number) => {
      setSectionMarkers((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                x: Math.max(0, Math.min(100, newX)),
                y: Math.max(0, Math.min(100, newY)),
              }
            : section
        )
      );
    },
    []
  );

  // Handle section click from Konva
  const handleKonvaSectionClick = useCallback(
    (section: SectionMarker, event?: { shiftKey?: boolean }) => {
      // Shift + click: navigate to section detail view
      if (event?.shiftKey) {
        setViewingSection(section);
        seatPlacementForm.setValue("section", section.name);
        setSelectedSectionMarker(null);
        setSelectedSectionIds([]);
        setSelectedSeatIds([]);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      } else {
        setSelectedSectionIds([section.id]);
        setSelectedSectionMarker(section);
        setViewingSection(null);
      }
    },
    [seatPlacementForm]
  );

  // Handle seat marker click - used elsewhere in the component
  const handleSectionMarkerClick = (
    section: SectionMarker,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Select for editing
    setSelectedSectionMarker(section);
  };

  // Handle section double-click or button click to open section detail view
  const handleOpenSectionDetail = (section: SectionMarker) => {
    setViewingSection(section);
    // Update seat placement form with section name
    seatPlacementForm.setValue("section", section.name);
    setSelectedSectionMarker(null);
    // Reset zoom when switching sections
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle seat marker click - select (shift+click adds to selection)
  const handleSeatClick = (
    seat: SeatMarker,
    event?: { shiftKey?: boolean }
  ) => {
    if (event?.shiftKey) {
      setSelectedSeatIds((prev) =>
        prev.includes(seat.id)
          ? prev.filter((id) => id !== seat.id)
          : [...prev, seat.id]
      );
      setSelectedSeat(seat);
      setSelectedSectionIds([]);
    } else {
      setSelectedSeatIds([seat.id]);
      setSelectedSeat(seat);
      setSelectedSectionIds([]);
    }
  };

  // Handle seat view from toolbox - opens the seat sheet in view mode
  const handleSeatView = (seat: SeatMarker) => {
    setViewingSeat(seat);
  };

  // Handle seat edit from toolbox - inline edit in toolbox (similar to section designer)
  const handleSeatEdit = (seat: SeatMarker) => {
    setIsEditingSeat(true);
    seatEditForm.reset({
      section: seat.seat.section,
      sectionId: seat.seat.sectionId,
      row: seat.seat.row,
      seatNumber: seat.seat.seatNumber,
      seatType: seat.seat.seatType,
    });
  };

  const handleSeatEditSave = (data: SeatFormData) => {
    if (selectedSeat && !selectedSeat.isNew) {
      updateSeatMutation.mutate(
        { seatId: selectedSeat.id, data },
        {
          onSuccess: () => setIsEditingSeat(false),
        }
      );
    } else if (selectedSeat && selectedSeat.isNew) {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === selectedSeat.id ? { ...s, seat: data } : s
        )
      );
      setSelectedSeat(null);
      setIsEditingSeat(false);
      seatEditForm.reset();
    }
  };

  const handleSeatEditCancel = () => {
    setIsEditingSeat(false);
    seatEditForm.reset();
  };

  // Handle section view from toolbox - opens the section sheet
  const handleSectionView = (section: SectionMarker) => {
    setSelectedSectionMarker(section);
    setIsSelectedSectionSheetOpen(true);
  };

  // Handle section edit from toolbox - opens the inline toolbar
  const handleSectionEdit = (section: SectionMarker) => {
    setEditingSectionId(section.id);
    setIsSectionCreationPending(true);

    // Set shape tool to match section shape so user knows what they're editing
    if (section.shape) {
      setPlacementShape(section.shape);
      setSelectedShapeTool(section.shape.type);
    }
  };

  // Handle deselection - clear all selections when clicking on empty space
  const handleDeselect = () => {
    setSelectedSeat(null);
    setSelectedSectionMarker(null);
    setSelectedSeatIds([]);
    setSelectedSectionIds([]);
    setIsEditingSeat(false);
  };

  // Apply drag-to-select result: set multi-selection and primary from first item
  const handleMarkersInRect = useCallback(
    (seatIds: string[], sectionIds: string[]) => {
      setSelectedSeatIds(seatIds);
      setSelectedSectionIds(sectionIds);
      setSelectedSeat(
        seatIds.length > 0
          ? (seats.find((s) => s.id === seatIds[0]) ?? null)
          : null
      );
      setSelectedSectionMarker(
        sectionIds.length > 0
          ? (sectionMarkers.find((s) => s.id === sectionIds[0]) ?? null)
          : null
      );
      setViewingSection(null);
    },
    [seats, sectionMarkers]
  );

  // Section form helpers (Sheet)
  const handleOpenNewSectionForm = () => {
    setEditingSectionId(null);
    const nextName = `Section ${sectionMarkers.length + 1}`;
    sectionForm.reset({ name: nextName });
    setIsSectionFormOpen(true);
    setPendingSectionCoordinates(null); // Clear any pending coordinates
  };

  const handleEditSectionFromSheet = (section: SectionMarker) => {
    setEditingSectionId(section.id);
    sectionForm.reset({ name: section.name });
    setIsSectionFormOpen(true);
    setPendingSectionCoordinates(null); // Clear any pending coordinates
  };

  // Edit section from sectionsData (for seat-level mode)
  const handleEditSectionFromData = (section: { id: string; name: string }) => {
    setEditingSectionId(section.id);
    sectionForm.reset({ name: section.name });
    setIsSectionFormOpen(true);
    setIsManageSectionsOpen(false);
    setPendingSectionCoordinates(null); // Clear any pending coordinates
  };

  // Sync sectionSelectValue with seat placement form section
  const watchedSection = seatPlacementForm.watch("section");
  useEffect(() => {
    setSectionSelectValue(watchedSection || "");
  }, [watchedSection]);

  // Clear inline edit mode when selected seat changes or is deselected
  useEffect(() => {
    setIsEditingSeat(false);
  }, [selectedSeat?.id]);

  // Get unique sections using utility function
  const getUniqueSections = (): string[] => {
    return getUniqueSectionsUtil(
      seats,
      sectionsData,
      sectionMarkers,
      designMode
    );
  };

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      x?: number;
      y?: number;
      shape?: PlacementShape;
      replaceSectionId?: string;
    }) => {
      const { replaceSectionId: _, ...createInput } = input;
      console.log("createSectionMutation.mutationFn called with:", createInput);
      const result = await sectionService.create({
        layout_id: layoutId,
        name: input.name,
        x_coordinate: input.x,
        y_coordinate: input.y,
        shape: input.shape ? JSON.stringify(input.shape) : undefined,
      });
      console.log("createSectionMutation.mutationFn result:", result);
      return result;
    },
    onSuccess: (section, variables) => {
      // Always update seat placement form with the new section name and ID
      seatPlacementForm.setValue("section", section.name);
      seatPlacementForm.setValue("sectionId", section.id);

      const replaceSectionId = variables.replaceSectionId;

      // Only update sectionMarkers in section-level mode
      if (designMode === "section-level") {
        if (replaceSectionId) {
          // Replacing an unsaved section marker: update in place with real id
          let shape: PlacementShape | undefined = placementShape;
          if (section.shape) {
            try {
              const parsed = JSON.parse(section.shape);
              if (parsed && typeof parsed === "object" && parsed.type) {
                shape = { ...parsed, type: parsed.type as PlacementShapeType };
              }
            } catch (e) {
              console.error("Failed to parse section shape from API:", e);
            }
          }
          const updatedMarker: SectionMarker = {
            id: section.id,
            name: section.name,
            x: section.x_coordinate ?? 50,
            y: section.y_coordinate ?? 50,
            imageUrl: section.image_url || undefined,
            isNew: false,
            shape,
          };
          setSectionMarkers((prev) =>
            prev.map((s) => (s.id === replaceSectionId ? updatedMarker : s))
          );
          setSelectedSectionMarker((prev) =>
            prev?.id === replaceSectionId ? updatedMarker : prev
          );
          setViewingSection((prev) =>
            prev?.id === replaceSectionId ? updatedMarker : prev
          );
        } else {
          // New section: use pending coordinates or API values
          const coordinates = pendingSectionCoordinates || {
            x: section.x_coordinate || 50,
            y: section.y_coordinate || 50,
          };

          let shape: PlacementShape | undefined = placementShape;
          if (section.shape) {
            try {
              const parsed = JSON.parse(section.shape);
              if (parsed && typeof parsed === "object" && parsed.type) {
                shape = { ...parsed, type: parsed.type as PlacementShapeType };
              } else {
                shape = placementShape;
              }
            } catch (e) {
              console.error("Failed to parse section shape from API:", e);
              shape = placementShape;
            }
          }

          const newSectionMarker: SectionMarker = {
            id: section.id,
            name: section.name,
            x: coordinates.x,
            y: coordinates.y,
            imageUrl: section.image_url || undefined,
            isNew: false,
            shape,
          };
          setSectionMarkers((prev) => [...prev, newSectionMarker]);
          setPlacementShape({
            type: PlacementShapeType.CIRCLE,
            radius: 1.2,
          });
        }
      }

      setPendingSectionCoordinates(null);
      setIsSectionFormOpen(false);
      setEditingSectionId(null);
      sectionForm.reset({ name: "" });
      toast({ title: "Section created successfully" });
      queryClient.invalidateQueries({
        queryKey: ["sections", "layout", layoutId],
      });
    },
    onError: (error) => {
      console.error("Failed to create section:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create section",
        variant: "destructive",
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (input: {
      sectionId: string;
      name: string;
      x?: number;
      y?: number;
      file_id?: string;
      shape?: PlacementShape;
    }) => {
      return await sectionService.update(input.sectionId, {
        name: input.name,
        x_coordinate: input.x,
        y_coordinate: input.y,
        file_id: input.file_id,
        shape: input.shape ? JSON.stringify(input.shape) : undefined,
      });
    },
    onSuccess: (section) => {
      // Parse shape from API response
      let shape: PlacementShape | undefined;
      if (section.shape) {
        try {
          const parsed = JSON.parse(section.shape);
          // Normalize the type to ensure it matches the enum
          if (parsed && typeof parsed === "object" && parsed.type) {
            shape = {
              ...parsed,
              type: parsed.type as PlacementShapeType,
            };
          }
        } catch (e) {
          console.error("Failed to parse section shape from API:", e);
        }
      }

      // Update sectionMarkers
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === section.id
            ? {
                ...s,
                name: section.name,
                x: section.x_coordinate || s.x,
                y: section.y_coordinate || s.y,
                imageUrl: section.image_url || s.imageUrl,
                shape: shape !== undefined ? shape : s.shape, // Update shape if provided
              }
            : s
        )
      );
      setSelectedSectionMarker((prev) =>
        prev && prev.id === section.id
          ? {
              ...prev,
              name: section.name,
              x: section.x_coordinate || prev.x,
              y: section.y_coordinate || prev.y,
              shape: shape !== undefined ? shape : prev.shape, // Update shape if provided
            }
          : prev
      );
      if (viewingSection?.id === section.id) {
        setViewingSection((prev) =>
          prev ? { ...prev, name: section.name } : null
        );
      }
      // Update seat placement form if section name matches
      const currentSectionInForm = seatPlacementForm.getValues().section;
      if (currentSectionInForm === section.name) {
        // Section name unchanged, but sectionId might need updating
      }
      setIsSectionFormOpen(false);
      setEditingSectionId(null);
      sectionForm.reset({ name: "" });
      toast({ title: "Section updated successfully" });
      // Invalidate sections query
      queryClient.invalidateQueries({
        queryKey: ["sections", "layout", layoutId],
      });
    },
    onError: (error) => {
      console.error("Failed to update section:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update section",
        variant: "destructive",
      });
    },
  });

  // Handle keyboard shortcuts (arrow keys, copy, paste) - defined after updateSectionMutation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle Delete/Backspace: delete all selected markers (handlers called via refs to avoid declaration order)
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedSeatIds.length > 0 || selectedSectionIds.length > 0) {
          event.preventDefault();
          selectedSectionIds.forEach((id) => {
            const section = sectionMarkers.find((s) => s.id === id);
            if (section) deleteSectionRef.current?.(section);
          });
          selectedSeatIds.forEach((id) => {
            const seat = seats.find((s) => s.id === id);
            if (seat) deleteSeatRef.current?.(seat);
          });
          setSelectedSeatIds([]);
          setSelectedSectionIds([]);
          setSelectedSeat(null);
          setSelectedSectionMarker(null);
          return;
        }
      }

      // Handle copy (Ctrl+C or Cmd+C)
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        if (selectedSeat) {
          event.preventDefault();
          const currentSeat = seats.find((s) => s.id === selectedSeat.id);
          if (currentSeat) {
            setCopiedSeat({ ...currentSeat });
            setCopiedSection(null); // Clear section copy when copying seat
          }
          return;
        }
        if (selectedSectionMarker) {
          event.preventDefault();
          const currentSection = sectionMarkers.find(
            (s) => s.id === selectedSectionMarker.id
          );
          if (currentSection) {
            setCopiedSection({ ...currentSection });
            setCopiedSeat(null); // Clear seat copy when copying section
          }
          return;
        }
      }

      // Handle paste (Ctrl+V or Cmd+V)
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();

        // Paste seat
        if (copiedSeat) {
          const seatValues = seatPlacementForm.getValues();
          const offsetX = 2; // 2% offset for pasted seat
          const offsetY = 2;
          const newX = Math.min(100, Math.max(0, copiedSeat.x + offsetX));
          const newY = Math.min(100, Math.max(0, copiedSeat.y + offsetY));

          // Increment seat number
          const currentSeatNumber = parseInt(seatValues.seatNumber) || 1;
          const nextSeatNumber = String(currentSeatNumber + 1);

          const newSeat: SeatMarker = {
            id: `temp-${Date.now()}`,
            x: newX,
            y: newY,
            seat: {
              section: viewingSection?.name || copiedSeat.seat.section,
              sectionId: viewingSection?.id || copiedSeat.seat.sectionId,
              row: copiedSeat.seat.row,
              seatNumber: nextSeatNumber,
              seatType: copiedSeat.seat.seatType,
            },
            shape: copiedSeat.shape ? { ...copiedSeat.shape } : undefined,
            isNew: true,
          };

          setSeats((prev) => [...prev, newSeat]);
          setSelectedSeat(newSeat);
          seatPlacementForm.setValue(
            "seatNumber",
            String(parseInt(nextSeatNumber) + 1)
          );
          return;
        }

        // Paste section
        if (
          copiedSection &&
          designMode === "section-level" &&
          venueType === "large"
        ) {
          const offsetX = 2; // 2% offset for pasted section
          const offsetY = 2;
          const newX = Math.min(100, Math.max(0, copiedSection.x + offsetX));
          const newY = Math.min(100, Math.max(0, copiedSection.y + offsetY));

          // Generate unique section name
          const baseName = copiedSection.name;
          const existingNames = sectionMarkers.map((s) => s.name);
          let newName = baseName;
          let counter = 1;
          while (existingNames.includes(newName)) {
            newName = `${baseName} (${counter})`;
            counter++;
          }

          const newSection: SectionMarker = {
            id: `temp-${Date.now()}`,
            name: newName,
            x: newX,
            y: newY,
            imageUrl: copiedSection.imageUrl,
            shape: copiedSection.shape ? { ...copiedSection.shape } : undefined,
            isNew: true,
          };

          setSectionMarkers((prev) => [...prev, newSection]);
          setSelectedSectionMarker(newSection);
          return;
        }
      }

      // Only handle arrow keys for movement
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        return;
      }

      // Determine movement step: precise (0.1%) with Shift, normal (1%) without
      const step = event.shiftKey ? 0.1 : 1;

      // Handle seat movement
      if (selectedSeat) {
        event.preventDefault();
        const currentSeat = seats.find((s) => s.id === selectedSeat.id);
        if (!currentSeat) return;

        let newX = currentSeat.x;
        let newY = currentSeat.y;

        switch (event.key) {
          case "ArrowUp":
            newY = Math.max(0, currentSeat.y - step);
            break;
          case "ArrowDown":
            newY = Math.min(100, currentSeat.y + step);
            break;
          case "ArrowLeft":
            newX = Math.max(0, currentSeat.x - step);
            break;
          case "ArrowRight":
            newX = Math.min(100, currentSeat.x + step);
            break;
        }

        // Update seat position
        handleKonvaSeatDragEnd(selectedSeat.id, newX, newY);

        // Save to backend if seat is not new
        if (!currentSeat.isNew) {
          seatService
            .updateCoordinates(selectedSeat.id, newX, newY, currentSeat.shape)
            .catch((error) => {
              console.error("Failed to save seat position:", error);
            });
        }
        return;
      }

      // Handle section movement
      if (selectedSectionMarker) {
        event.preventDefault();
        const currentSection = sectionMarkers.find(
          (s) => s.id === selectedSectionMarker.id
        );
        if (!currentSection) return;

        let newX = currentSection.x;
        let newY = currentSection.y;

        switch (event.key) {
          case "ArrowUp":
            newY = Math.max(0, currentSection.y - step);
            break;
          case "ArrowDown":
            newY = Math.min(100, currentSection.y + step);
            break;
          case "ArrowLeft":
            newX = Math.max(0, currentSection.x - step);
            break;
          case "ArrowRight":
            newX = Math.min(100, currentSection.x + step);
            break;
        }

        // Update section position (only local state, no immediate save)
        handleKonvaSectionDragEnd(selectedSectionMarker.id, newX, newY);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedSeat,
    selectedSectionMarker,
    selectedSeatIds,
    selectedSectionIds,
    seats,
    sectionMarkers,
    handleKonvaSeatDragEnd,
    handleKonvaSectionDragEnd,
    updateSectionMutation,
    copiedSeat,
    copiedSection,
    designMode,
    venueType,
    viewingSection,
    seatPlacementForm,
  ]);

  // Handle section shape transform (resize/rotate) - defined after mutations
  const handleSectionShapeTransform = useCallback(
    (sectionId: string, shape: PlacementShape) => {
      // Only update local state - don't save to backend immediately
      // Changes will be saved when user explicitly saves the layout
      setSectionMarkers((prev) => {
        return prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                shape,
              }
            : section
        );
      });
    },
    []
  );

  const handleSeatShapeStyleChange = useCallback(
    (seatId: string, style: { fillColor?: string; strokeColor?: string }) => {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === seatId
            ? {
                ...s,
                shape: {
                  ...(s.shape || {
                    type: PlacementShapeType.CIRCLE,
                    radius: 1.2,
                  }),
                  ...style,
                } as PlacementShape,
              }
            : s
        )
      );
      setViewingSeat((prev) =>
        prev && prev.id === seatId
          ? {
              ...prev,
              shape: {
                ...(prev.shape || {
                  type: PlacementShapeType.CIRCLE,
                  radius: 1.2,
                }),
                ...style,
              } as PlacementShape,
            }
          : prev
      );
    },
    []
  );

  const handleSectionShapeStyleChange = useCallback(
    (
      sectionId: string,
      style: { fillColor?: string; strokeColor?: string }
    ) => {
      const mergeSectionShape = (
        existing: PlacementShape | undefined
      ): PlacementShape =>
        ({
          ...(existing || {
            type: PlacementShapeType.RECTANGLE,
            width: 3,
            height: 2,
          }),
          ...style,
        }) as PlacementShape;
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, shape: mergeSectionShape(s.shape) } : s
        )
      );
      setSelectedSectionMarker((prev) =>
        prev && prev.id === sectionId
          ? { ...prev, shape: mergeSectionShape(prev.shape) }
          : prev
      );
    },
    []
  );

  const handleSaveSectionForm = sectionForm.handleSubmit((data) => {
    const name = data.name.trim() || "Section";

    if (editingSectionId) {
      // Find section in sectionMarkers (section-level mode) or sectionsData (seat-level mode)
      const sectionFromMarkers = sectionMarkers.find(
        (s) => s.id === editingSectionId
      );
      const sectionFromData = sectionsData?.find(
        (s) => s.id === editingSectionId
      );

      if (sectionFromMarkers) {
        if (sectionFromMarkers.isNew) {
          // Unsaved section: create in DB and replace marker
          createSectionMutation.mutate({
            name,
            x: sectionFromMarkers.x,
            y: sectionFromMarkers.y,
            shape: sectionFromMarkers.shape,
            replaceSectionId: editingSectionId,
          });
        } else {
          // Update existing section (section-level mode)
          updateSectionMutation.mutate({
            sectionId: editingSectionId,
            name,
            x: sectionFromMarkers.x,
            y: sectionFromMarkers.y,
            shape: sectionFromMarkers.shape,
          });
        }
      } else if (sectionFromData) {
        // Update existing section (seat-level mode)
        updateSectionMutation.mutate({
          sectionId: editingSectionId,
          name,
          x: sectionFromData.x_coordinate ?? undefined,
          y: sectionFromData.y_coordinate ?? undefined,
        });
      }
    } else {
      // Create new section - always call API since seats need section_id
      console.log("Creating section via API:", {
        name,
        layoutId,
        designMode,
        pendingCoordinates: pendingSectionCoordinates,
      });
      createSectionMutation.mutate({
        name,
        // Use pending coordinates if available (from canvas click), otherwise use defaults
        x:
          designMode === "section-level"
            ? (pendingSectionCoordinates?.x ?? 50)
            : undefined,
        y:
          designMode === "section-level"
            ? (pendingSectionCoordinates?.y ?? 50)
            : undefined,
        shape:
          designMode === "section-level" && placementShape
            ? placementShape
            : undefined,
      });
    }
  });

  const handleInlineSectionSave = (name: string) => {
    if (editingSectionId) {
      const section = sectionMarkers.find((s) => s.id === editingSectionId);
      if (section) {
        if (section.isNew) {
          console.log("Creating unsaved section via API (Inline):", {
            name,
            layoutId,
          });
          createSectionMutation.mutate({
            name,
            x: section.x,
            y: section.y,
            shape: placementShape ?? section.shape,
            replaceSectionId: editingSectionId,
          });
        } else {
          console.log("Updating section via API (Inline):", {
            sectionId: editingSectionId,
            name,
            layoutId,
          });
          updateSectionMutation.mutate({
            sectionId: editingSectionId,
            name,
            x: section.x,
            y: section.y,
            shape: placementShape ?? section.shape,
          });
        }
      }
    } else {
      // Create new section - always call API since seats need section_id
      console.log("Creating section via API (Inline):", {
        name,
        layoutId,
        designMode,
        pendingCoordinates: pendingSectionCoordinates,
      });

      createSectionMutation.mutate({
        name,
        // Use pending coordinates if available (from canvas click), otherwise use defaults
        x:
          designMode === "section-level"
            ? (pendingSectionCoordinates?.x ?? 50)
            : undefined,
        y:
          designMode === "section-level"
            ? (pendingSectionCoordinates?.y ?? 50)
            : undefined,
        shape:
          designMode === "section-level" && placementShape
            ? placementShape
            : undefined,
      });
    }

    // Reset inline creation/editing state
    setIsSectionCreationPending(false);
    setPendingSectionCoordinates(null);
    setEditingSectionId(null);
  };

  const handleInlineSectionCancel = () => {
    setIsSectionCreationPending(false);
    setPendingSectionCoordinates(null);
    setEditingSectionId(null);
    // Don't clear selected shape tool to allow retry
  };

  const handleCancelSectionForm = () => {
    setIsSectionFormOpen(false);
    setEditingSectionId(null);
    sectionForm.reset({ name: "" });
    setPendingSectionCoordinates(null); // Clear any pending coordinates
  };

  // // Sync form fields with selected seat
  // // Disabled: Keep currentSeat purely for creating new seats
  // useEffect(() => {
  //   if (selectedSeat && isPlacingSeats) {
  //     setCurrentSeat(selectedSeat.seat);
  //   }
  // }, [selectedSeat, isPlacingSeats]);

  // // Update selected seat when form values change
  // useEffect(() => {
  //   if (selectedSeat && isPlacingSeats) {
  //     const hasChanges =
  //       selectedSeat.seat.section !== currentSeat.section ||
  //       selectedSeat.seat.row !== currentSeat.row ||
  //       selectedSeat.seat.seatNumber !== currentSeat.seatNumber ||
  //       selectedSeat.seat.seatType !== currentSeat.seatType;
  //
  //     if (hasChanges) {
  //       const updatedSeat = {
  //         ...selectedSeat,
  //         seat: currentSeat,
  //       };
  //
  //       setSeats((prev) =>
  //         prev.map((seat) => (seat.id === selectedSeat.id ? updatedSeat : seat))
  //       );
  //       setSelectedSeat(updatedSeat);
  //     }
  //   }
  // }, [selectedSeat]);

  // Sync section form with selected section (for section-level mode)
  useEffect(() => {
    if (selectedSectionMarker && isPlacingSections) {
      sectionForm.setValue("name", selectedSectionMarker.name);
    }
  }, [selectedSectionMarker, isPlacingSections, sectionForm]);

  // Save seats mutation
  const saveSeatsMutation = useMutation({
    mutationFn: async (seatsToSave: SeatMarker[]) => {
      // Check if image has changed (new file_id uploaded)
      const imageChanged = mainImageFileId && mainImageFileId !== initialFileId;

      // Prepare seats array with operation type determined by presence of 'id'
      // No 'id' = create, Has 'id' = update
      const seatsData = seatsToSave.map((seat) => {
        if (seat.isNew) {
          // Create: no id field
          return {
            venue_id: venueId,
            layout_id: layoutId,
            section: seat.seat.section,
            row: seat.seat.row,
            seat_number: seat.seat.seatNumber,
            seat_type: seat.seat.seatType,
            x_coordinate: seat.x,
            y_coordinate: seat.y,
            shape: seat.shape ? JSON.stringify(seat.shape) : undefined,
          };
        } else {
          // Update: has id field
          return {
            id: seat.id,
            x_coordinate: seat.x,
            y_coordinate: seat.y,
            shape: seat.shape ? JSON.stringify(seat.shape) : undefined,
          };
        }
      });

      // Use bulk operations if we have any operations or image changed
      if (seatsData.length > 0 || imageChanged) {
        await seatService.bulkOperations({
          venueId,
          seats: seatsData,
          fileId: imageChanged ? mainImageFileId : undefined,
          layoutId,
        });
      }
    },
    onSuccess: () => {
      // Invalidate seat queries
      queryClient.invalidateQueries({ queryKey: ["seats", layoutId] });
      queryClient.invalidateQueries({ queryKey: ["seats", venueId] });

      // Invalidate layout queries (layout might have been updated with new file_id)
      queryClient.invalidateQueries({ queryKey: ["layouts", layoutId] });
      queryClient.invalidateQueries({
        queryKey: ["layouts", layoutId, "with-seats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["layouts", "venue", venueId],
      });

      setSeats((prev) => prev.map((s) => ({ ...s, isNew: false })));

      // Clear all placements after successful save
      if (venueType === "small") {
        // Clear all seats for small venue
        setSeats([]);
      } else {
        // Clear all sections and their seats for large venue
        setSectionMarkers([]);
        setSeats([]);
      }
      setSelectedSeat(null);

      // Close confirmation dialog
      setShowSaveConfirmDialog(false);

      // Show success message
      toast({
        title: "Seats Saved",
        description: "Seat layout has been saved successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      // Close confirmation dialog on error
      setShowSaveConfirmDialog(false);

      // Extract error message
      let errorMessage = "Failed to save seats. Please try again.";

      if (error?.message) {
        // Try to parse JSON error message
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.detail || errorData.message || error.message;
        } catch {
          // If not JSON, use message directly
          errorMessage = error.message;
        }
      }

      // Show error toast
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete seat mutation
  const deleteSeatMutation = useMutation({
    mutationFn: async (seatId: string) => {
      // Use bulk operations: seat with id and delete flag
      await seatService.bulkOperations({
        venueId,
        seats: [{ id: seatId, delete: true }],
        layoutId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats", venueId] });
      setSelectedSeat(null);
    },
  });

  // Update seat mutation
  const updateSeatMutation = useMutation({
    mutationFn: async ({
      seatId,
      data,
    }: {
      seatId: string;
      data: SeatInfo;
    }) => {
      // Try to find section_id from section name if sectionId is not provided
      let sectionId = data.sectionId;
      if (!sectionId && data.section) {
        if (sectionsData && designMode === "seat-level") {
          const section = sectionsData.find((s) => s.name === data.section);
          sectionId = section?.id;
        } else if (designMode === "section-level") {
          const section = sectionMarkers.find((s) => s.name === data.section);
          sectionId = section?.id;
        }
      }

      return await seatService.update(seatId, {
        section_id: sectionId || data.section, // Send section_id if available, fallback to section name (backend will handle conversion)
        row: data.row,
        seat_number: data.seatNumber,
        seat_type: data.seatType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats", venueId] });
      seatEditForm.reset();
      setViewingSeat(null);
      setSelectedSeat(null);
    },
  });

  const handleSave = () => {
    setShowSaveConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmDialog(false);

    // For section-level layout, save sections first, then seats
    if (designMode === "section-level" && venueType === "large") {
      // Save all section markers in batch
      const sectionsToSave = sectionMarkers.filter((section) => !section.isNew);
      const newSections = sectionMarkers.filter((section) => section.isNew);

      try {
        // Save existing sections (updates)
        const updatePromises = sectionsToSave.map((section) => {
          // Get the original section to preserve file_id
          const originalSection = sectionsData?.find(
            (s) => s.id === section.id
          );
          return sectionService.update(section.id, {
            name: section.name,
            x_coordinate: section.x,
            y_coordinate: section.y,
            shape: section.shape ? JSON.stringify(section.shape) : undefined,
            // Preserve file_id from original section (only update if explicitly changed via image upload)
            file_id: originalSection?.file_id || undefined,
          });
        });

        // Save new sections (creates)
        const createPromises = newSections.map((section) =>
          sectionService.create({
            layout_id: layoutId,
            name: section.name,
            x_coordinate: section.x,
            y_coordinate: section.y,
            shape: section.shape ? JSON.stringify(section.shape) : undefined,
          })
        );

        // Wait for all section saves to complete
        await Promise.all([...updatePromises, ...createPromises]);

        // Invalidate sections query to refresh data
        queryClient.invalidateQueries({
          queryKey: ["sections", "layout", layoutId],
        });

        // Mark all sections as saved
        setSectionMarkers((prev) =>
          prev.map((section) => ({ ...section, isNew: false }))
        );

        // Then save seats
        saveSeatsMutation.mutate(seats);
      } catch (error) {
        console.error("Failed to save sections:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to save sections. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // For seat-level layout, just save seats
      saveSeatsMutation.mutate(seats);
    }
  };

  // Delete seat from datasheet
  const handleDeleteSeat = (seat: SeatMarker) => {
    if (!seat.isNew) {
      deleteSeatMutation.mutate(seat.id);
    }
    setSeats((prev) => prev.filter((s) => s.id !== seat.id));
    if (selectedSeat?.id === seat.id) {
      setSelectedSeat(null);
    }
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
  };

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      return await sectionService.delete(sectionId);
    },
    onSuccess: (_, sectionId) => {
      // Remove from sectionMarkers (for section-level mode)
      setSectionMarkers((prev) => prev.filter((s) => s.id !== sectionId));

      // Remove seats that belong to this section
      setSeats((prev) =>
        prev.filter((s) => {
          // Check if seat's sectionId matches (if available) or section name matches
          const seatSectionId = (s.seat as any).sectionId;
          return seatSectionId !== sectionId && s.seat.section !== sectionId;
        })
      );

      // Clear selected/viewing if they match
      if (selectedSectionMarker?.id === sectionId) {
        setSelectedSectionMarker(null);
      }
      setSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
      if (viewingSection?.id === sectionId) {
        setViewingSection(null);
      }

      toast({ title: "Section deleted successfully" });

      // Invalidate sections query
      queryClient.invalidateQueries({
        queryKey: ["sections", "layout", layoutId],
      });
    },
    onError: (error) => {
      console.error("Failed to delete section:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete section",
        variant: "destructive",
      });
    },
  });

  // Delete section handlers
  const handleDeleteSection = (section: { id: string; isNew?: boolean }) => {
    if (section.isNew) {
      // Unsaved section: only remove from local state
      const sectionId = section.id;
      setSectionMarkers((prev) => prev.filter((s) => s.id !== sectionId));
      setSeats((prev) =>
        prev.filter((s) => {
          const seatSectionId = (s.seat as any).sectionId;
          return seatSectionId !== sectionId && s.seat.section !== sectionId;
        })
      );
      if (selectedSectionMarker?.id === sectionId)
        setSelectedSectionMarker(null);
      setSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
      if (viewingSection?.id === sectionId) setViewingSection(null);
      toast({ title: "Section removed" });
    } else {
      deleteSectionMutation.mutate(section.id);
    }
  };

  // Keep delete handler refs in sync for keyboard shortcut (effect must be after handlers)
  useEffect(() => {
    deleteSeatRef.current = handleDeleteSeat;
    deleteSectionRef.current = handleDeleteSection;
  });

  // Count seats for the section to be deleted
  // Fullscreen functionality
  const handleFullscreen = async () => {
    if (!fullscreenRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (fullscreenRef.current.requestFullscreen) {
          await fullscreenRef.current.requestFullscreen();
        } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
          // Safari
          await (fullscreenRef.current as any).webkitRequestFullscreen();
        } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
          // Firefox
          await (fullscreenRef.current as any).mozRequestFullScreen();
        } else if ((fullscreenRef.current as any).msRequestFullscreen) {
          // IE/Edge
          await (fullscreenRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(!!isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Don't block rendering while loading seats - show the designer and let seats load in the background
  // The useEffect will update seats when they're loaded

  // If viewing a section detail (large venue mode), show section detail view
  if (venueType === "large" && viewingSection) {
    return (
      <>
        <SectionDetailView
          viewingSection={viewingSection}
          className={className}
          readOnly={readOnly}
          displayedSeats={displayedSeats}
          selectedSeat={selectedSeat}
          seatPlacementForm={seatPlacementForm}
          uniqueSections={getUniqueSections()}
          sectionsData={sectionsData}
          sectionSelectValue={sectionSelectValue}
          onSectionSelectValueChange={setSectionSelectValue}
          containerRef={containerRef}
          dimensionsReady={dimensionsReady}
          containerDimensions={containerDimensions}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          isPlacingSeats={isPlacingSeats}
          isUploadingImage={isUploadingImage}
          onBack={() => {
            setViewingSection(null);
            // Reset zoom when going back to main floor plan
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          onSave={handleSave}
          onClearSectionSeats={handleClearSectionSeats}
          onSectionImageSelect={handleSectionImageSelect}
          onSeatClick={handleSeatClick}
          onSeatDragEnd={handleKonvaSeatDragEnd}
          onSeatShapeTransform={handleSeatShapeTransform}
          onSeatShapeStyleChange={handleSeatShapeStyleChange}
          onImageClick={handleKonvaImageClick}
          onDeselect={handleDeselect}
          onWheel={handleKonvaWheel}
          onPan={handlePan}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onNewSection={() => {
            setViewingSection(null);
            setIsSectionCreationPending(true);
            setEditingSectionId(null);
            // sectionForm.reset({ name: "" });
          }}
          saveSeatsMutationPending={saveSeatsMutation.isPending}
          seats={seats}
          onDeleteSeat={handleDeleteSeat}
          onSetViewingSeat={setViewingSeat}
          onEditSeat={handleSeatEdit}
          onSetSelectedSeat={setSelectedSeat}
          seatEditFormReset={seatEditForm.reset}
          placementShape={placementShape}
          onPlacementShapeChange={setPlacementShape}
          selectedShapeTool={selectedShapeTool}
          onShapeToolSelect={setSelectedShapeTool}
          onShapeDraw={handleShapeDraw}
          shapeOverlays={shapeOverlays}
          selectedOverlayId={selectedOverlayId}
          onShapeOverlayClick={handleShapeOverlayClick}
          onDetectSeats={handleDetectSeats}
          isDetectingSeats={isDetectingSeats}
          seatEditControls={
            isEditingSeat && selectedSeat && !readOnly ? (
              <SeatEditControls
                form={seatEditForm}
                uniqueSections={getUniqueSections()}
                sectionsData={sectionsData}
                sectionMarkers={sectionMarkers}
                designMode={designMode}
                viewingSection={viewingSection}
                onSave={handleSeatEditSave}
                onCancel={handleSeatEditCancel}
                isUpdating={updateSeatMutation.isPending}
                standalone
              />
            ) : undefined
          }
        />
        {/* Seat View Sheet - needed for section detail view, Edit happens in toolbox */}
        <SeatEditSheet
          viewingSeat={viewingSeat}
          isOpen={!!viewingSeat}
          onOpenChange={(open) => {
            if (!open) {
              setViewingSeat(null);
            }
          }}
          isPlacingSeats={isPlacingSeats}
          isDeleting={deleteSeatMutation.isPending}
          onEdit={() => {
            if (viewingSeat) {
              handleSeatEdit(viewingSeat);
            }
          }}
          onDelete={() => {
            if (viewingSeat) {
              handleDeleteSeat(viewingSeat);
              setViewingSeat(null);
            }
          }}
        />

        {/* Save Confirmation Dialog - needed for section detail view */}
        <ConfirmationDialog
          open={showSaveConfirmDialog}
          onOpenChange={(open) => !open && setShowSaveConfirmDialog(false)}
          title="Save Seat Layout"
          description={
            seats.length > 0
              ? `Are you sure you want to save ${seats.length} seat${seats.length === 1 ? "" : "s"}? This will update the layout with your current seat placements across all sections.`
              : "Are you sure you want to save? This will update the layout."
          }
          confirmAction={{
            label: "Save",
            variant: "default",
            onClick: handleConfirmSave,
            loading: saveSeatsMutation.isPending,
          }}
          cancelAction={{
            label: "Cancel",
            onClick: () => setShowSaveConfirmDialog(false),
          }}
        />
      </>
    );
  }

  const designerContent = (
    <div className="space-y-4">
      {/* Main Image Upload */}
      {!mainImageUrl && (
        <ImageUploadCard
          id="main-image-upload"
          label={`Upload ${designMode === "seat-level" ? "Venue" : "Main"} Floor Plan Image`}
          isUploading={isUploadingImage}
          onFileSelect={handleMainImageSelect}
        />
      )}

      {/* Main Designer Content (Header + Canvas) */}
      {mainImageUrl && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out">
          <DesignerHeader
            layoutName={layoutName}
            isLoading={isLoading}
            seatsError={seatsError}
            venueType={venueType}
            sectionMarkers={sectionMarkers}
            seats={seats}
            viewingSection={viewingSection}
            displayedSeats={displayedSeats}
            onToggleDatasheet={() => setIsDatasheetOpen(true)}
            readOnly={readOnly}
            onSave={handleSave}
            isSaving={saveSeatsMutation.isPending}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleFullscreen}
            mainImageUrl={mainImageUrl}
            isPlacingSeats={isPlacingSeats}
            isPlacingSections={isPlacingSections}
            onClearAllPlacements={handleClearAllPlacements}
            onMainImageSelect={handleMainImageSelect}
            onDetectSections={
              designMode === "section-level" ? handleDetectSections : undefined
            }
            isDetectingSections={isDetectingSections}
            onDetectSeats={
              venueType === "small" ? handleDetectSeats : undefined
            }
            isDetectingSeats={isDetectingSeats}
          />

          <div className="space-y-4">
            {/* Seat Placement Controls + Shape Toolbox (Small Venue) */}
            {venueType === "small" && (
              <SeatDesignToolbar
                selectedShapeType={selectedShapeTool}
                onShapeTypeSelect={readOnly ? () => {} : setSelectedShapeTool}
                selectedSeat={selectedSeat}
                selectedSection={
                  designMode === "section-level" ? selectedSectionMarker : null
                }
                onSeatEdit={handleSeatEdit}
                onSeatView={handleSeatView}
                onSectionEdit={handleSectionEdit}
                onSectionView={
                  designMode === "section-level" ? handleSectionView : undefined
                }
                onSeatDelete={handleDeleteSeat}
                onSectionDelete={handleDeleteSection}
                onSeatShapeStyleChange={handleSeatShapeStyleChange}
                onSectionShapeStyleChange={handleSectionShapeStyleChange}
                seatPlacement={{
                  form: seatPlacementForm,
                  uniqueSections: getUniqueSections(),
                  sectionsData,
                  sectionSelectValue,
                  onSectionSelectValueChange: setSectionSelectValue,
                  onNewSection: () => {
                    setIsSectionFormOpen(true);
                    setEditingSectionId(null);
                    sectionForm.reset({ name: "" });
                  },
                  onManageSections: () => setIsManageSectionsOpen(true),
                }}
                seatEditControls={
                  isEditingSeat && selectedSeat && !readOnly ? (
                    <SeatEditControls
                      form={seatEditForm}
                      uniqueSections={getUniqueSections()}
                      sectionsData={sectionsData}
                      sectionMarkers={sectionMarkers}
                      designMode={designMode}
                      onSave={handleSeatEditSave}
                      onCancel={handleSeatEditCancel}
                      isUpdating={updateSeatMutation.isPending}
                      standalone
                    />
                  ) : undefined
                }
                readOnly={readOnly}
              />
            )}

            {/* Section Placement Controls Panel - On Top (Large Venue / Section-Level) */}
            {venueType === "large" && !viewingSection && (
              <>
                {isSectionCreationPending ? (
                  <SectionCreationToolbar
                    initialName={
                      editingSectionId
                        ? sectionMarkers.find((s) => s.id === editingSectionId)
                            ?.name || ""
                        : ""
                    }
                    selectedShapeType={selectedShapeTool}
                    onShapeTypeSelect={(type) => {
                      setSelectedShapeTool(type);
                      // If we are editing, we keep the editing state.
                      // If we are creating, we keep the creating state.
                      // But if they change tool implies they might want to redraw.
                      // For now, just update the tool.
                    }}
                    onSave={handleInlineSectionSave}
                    onCancel={handleInlineSectionCancel}
                  />
                ) : (
                  <ShapeToolbox
                    selectedShapeType={selectedShapeTool}
                    onShapeTypeSelect={
                      readOnly ? () => {} : setSelectedShapeTool
                    }
                    selectedSeat={null}
                    selectedSection={selectedSectionMarker}
                    onSeatEdit={handleSeatEdit}
                    onSeatView={handleSeatView}
                    onSectionEdit={handleSectionEdit}
                    onSectionView={handleSectionView}
                    onSeatDelete={handleDeleteSeat}
                    onSectionDelete={handleDeleteSection}
                    onSeatShapeStyleChange={handleSeatShapeStyleChange}
                    onSectionShapeStyleChange={handleSectionShapeStyleChange}
                    readOnly={readOnly}
                  />
                )}
              </>
            )}

            {/* Canvas Container - Seat-level uses SeatDesignCanvas, section-level uses LayoutCanvas */}
            {venueType === "small" ? (
              <SeatDesignCanvas
                imageUrl={mainImageUrl}
                containerRef={containerRef}
                dimensionsReady={dimensionsReady}
                containerDimensions={containerDimensions}
                containerStyle="fixed"
                seats={displayedSeats}
                selectedSeatId={selectedSeat?.id ?? null}
                isPlacingSeats={isPlacingSeats}
                readOnly={readOnly}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                onSeatClick={handleSeatClick}
                onSeatDragEnd={handleKonvaSeatDragEnd}
                onSeatShapeTransform={handleSeatShapeTransform}
                onImageClick={handleKonvaImageClick}
                onDeselect={handleDeselect}
                onShapeDraw={handleShapeDraw}
                onShapeOverlayClick={handleShapeOverlayClick}
                onWheel={handleKonvaWheel}
                onPan={handlePan}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                selectedShapeTool={selectedShapeTool}
                shapeOverlays={displayedShapeOverlays}
                selectedOverlayId={selectedOverlayId}
              />
            ) : (
              <div
                ref={containerRef}
                className="relative border rounded-lg overflow-hidden bg-gray-100 select-none w-full"
                style={{
                  height: "600px",
                  width: "100%",
                  touchAction: "none",
                  overscrollBehavior: "contain",
                }}
              >
                {dimensionsReady ? (
                  <LayoutCanvas
                    imageUrl={mainImageUrl}
                    seats={[]}
                    sections={sectionMarkers}
                    selectedSeatId={null}
                    selectedSectionId={selectedSectionMarker?.id || null}
                    selectedSeatIds={[]}
                    selectedSectionIds={selectedSectionIds}
                    onMarkersInRect={handleMarkersInRect}
                    isPlacingSeats={false}
                    isPlacingSections={isPlacingSections}
                    readOnly={readOnly}
                    zoomLevel={zoomLevel}
                    panOffset={panOffset}
                    onSeatClick={handleSeatClick}
                    onSectionClick={handleKonvaSectionClick}
                    onSectionDragEnd={handleKonvaSectionDragEnd}
                    onSeatDragEnd={handleKonvaSeatDragEnd}
                    onSeatShapeTransform={handleSeatShapeTransform}
                    onSectionShapeTransform={handleSectionShapeTransform}
                    shapeOverlays={displayedShapeOverlays}
                    onImageClick={handleKonvaImageClick}
                    onDeselect={handleDeselect}
                    onShapeDraw={handleShapeDraw}
                    onShapeOverlayClick={handleShapeOverlayClick}
                    onWheel={handleKonvaWheel}
                    onPan={handlePan}
                    containerWidth={containerDimensions.width}
                    containerHeight={containerDimensions.height}
                    venueType={venueType}
                    selectedShapeTool={selectedShapeTool}
                    selectedOverlayId={selectedOverlayId}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full py-12 text-muted-foreground">
                    Initializing canvas...
                  </div>
                )}
                <ZoomControls
                  zoomLevel={zoomLevel}
                  panOffset={panOffset}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datasheet Sheet */}
      <DatasheetView
        isOpen={isDatasheetOpen}
        onOpenChange={setIsDatasheetOpen}
        readOnly={readOnly}
        viewingSection={viewingSection}
        venueType={venueType}
        displayedSeats={displayedSeats}
        seats={seats}
        sectionMarkers={sectionMarkers}
        selectedSeat={selectedSeat}
        isPlacingSeats={isPlacingSeats}
        isSectionFormOpen={isSectionFormOpen}
        editingSectionId={editingSectionId}
        sectionForm={sectionForm}
        selectedSectionMarker={selectedSectionMarker}
        createSectionMutationPending={createSectionMutation.isPending}
        updateSectionMutationPending={updateSectionMutation.isPending}
        onSeatClick={handleSeatClick}
        onDeleteSeat={handleDeleteSeat}
        onOpenNewSectionForm={handleOpenNewSectionForm}
        onCancelSectionForm={handleCancelSectionForm}
        onSaveSectionForm={handleSaveSectionForm}
        onSectionMarkerClick={handleSectionMarkerClick}
        onOpenSectionDetail={handleOpenSectionDetail}
        onEditSectionFromSheet={handleEditSectionFromSheet}
        onDeleteSection={handleDeleteSection}
        onSetViewingSeat={setViewingSeat}
        onEditSeat={handleSeatEdit}
        onSetSelectedSeat={setSelectedSeat}
        onSetIsDatasheetOpen={setIsDatasheetOpen}
        seatEditFormReset={seatEditForm.reset}
      />

      {/* Seat View Sheet - View/Delete, Edit happens in toolbox */}
      <SeatEditSheet
        viewingSeat={viewingSeat}
        isOpen={!!viewingSeat}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSeat(null);
            setSelectedSeat(null);
          }
        }}
        isPlacingSeats={isPlacingSeats}
        isDeleting={deleteSeatMutation.isPending}
        onEdit={() => {
          if (viewingSeat) {
            handleSeatEdit(viewingSeat);
          }
        }}
        onDelete={() => {
          if (viewingSeat) {
            handleDeleteSeat(viewingSeat);
            setViewingSeat(null);
            setSelectedSeat(null);
          }
        }}
      />

      {/* Selected Section Sheet */}
      {venueType === "large" && (
        <SelectedSectionSheet
          selectedSectionMarker={selectedSectionMarker}
          seats={seats}
          isOpen={isSelectedSectionSheetOpen}
          onOpenChange={(open: boolean) => {
            setIsSelectedSectionSheetOpen(open);
            if (!open) {
              // Don't clear selection when closing - keep it selected for transform controls
              // setSelectedSectionMarker(null);
            }
          }}
          onOpenSectionDetail={handleOpenSectionDetail}
          onEdit={(section) => handleEditSectionFromSheet(section)}
          onDelete={handleDeleteSection}
        />
      )}

      {/* Instructions */}
      {mainImageUrl && (
        <InstructionsPanel
          designMode={designMode}
          sectionCount={sectionMarkers.length}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  );

  return (
    <>
      <div
        ref={fullscreenRef}
        className={
          isFullscreen ? "h-screen w-screen bg-background overflow-auto" : ""
        }
      >
        {isFullscreen ? (
          <div className="h-full w-full flex flex-col bg-background p-6">
            {designerContent}
          </div>
        ) : (
          <Card className={className}>
            <div className="p-6">{designerContent}</div>
          </Card>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        open={showSaveConfirmDialog}
        onOpenChange={setShowSaveConfirmDialog}
        title="Save Seat Layout"
        description={
          seats.length > 0
            ? `Are you sure you want to save ${seats.length} seat${seats.length === 1 ? "" : "s"}? This will update the layout with your current seat placements.`
            : "Are you sure you want to save? This will update the layout."
        }
        confirmAction={{
          label: "Save",
          variant: "default",
          onClick: handleConfirmSave,
          loading: saveSeatsMutation.isPending,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => setShowSaveConfirmDialog(false),
        }}
      />

      {/* Manage Sections Sheet (for seat-level mode) */}
      {designMode === "seat-level" && (
        <ManageSectionsSheet
          open={isManageSectionsOpen}
          onOpenChange={setIsManageSectionsOpen}
          sections={sectionsData}
          onEdit={handleEditSectionFromData}
          onDelete={handleDeleteSection}
          onNewSection={() => {
            setEditingSectionId(null);
            // Default shape/tool for new section
            setPlacementShape({
              type: PlacementShapeType.RECTANGLE,
              width: 10,
              height: 10,
            });
            setIsSectionCreationPending(true);
            setIsManageSectionsOpen(false);
          }}
          isDeleting={deleteSectionMutation.isPending}
        />
      )}

      {/* New Section Sheet */}
      <SectionFormSheet
        open={isSectionFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSectionFormOpen(false);
            setEditingSectionId(null);
            sectionForm.reset({ name: "" });
            setPendingSectionCoordinates(null); // Clear any pending coordinates
          }
        }}
        form={sectionForm}
        editingSectionId={editingSectionId}
        isCreating={createSectionMutation.isPending}
        isUpdating={updateSectionMutation.isPending}
        onSave={handleSaveSectionForm}
        onCancel={handleCancelSectionForm}
      />
    </>
  );
}
