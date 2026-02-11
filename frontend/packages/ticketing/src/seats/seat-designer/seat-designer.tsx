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
import { api } from "@truths/api";
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
import { useDesignerHistory } from "./hooks/use-designer-history";
import type { DesignerSnapshot } from "./types";
import {
  ZoomControls,
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
  LayoutPreviewDialog,
} from "./components";

// Import types from the seat-designer folder
import type {
  SeatDesignerProps,
  SectionMarker,
  SeatInfo,
  SeatMarker,
} from "./types";
import { PlacementShapeType, type PlacementShape } from "./types";
import {
  DEFAULT_CANVAS_BACKGROUND,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
} from "./colors";

export type { SeatDesignerProps, SectionMarker, SeatInfo, SeatMarker };

const DEFAULT_CANVAS_BACKGROUND_COLOR = DEFAULT_CANVAS_BACKGROUND;

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
  onRemoveImage,
  initialCanvasBackgroundColor,
  onCanvasBackgroundColorChange,
  markerFillTransparency: initialMarkerFillTransparency,
  onMarkerFillTransparencyChange,
  className,
  fileId: initialFileId,
}: SeatDesignerProps & { fileId?: string }) {
  // Keep old venueType for backward compatibility (can be removed later)
  const venueType: "small" | "large" =
    designMode === "seat-level" ? "small" : "large";

  // Main floor plan image (for both types)
  const [mainImageUrl, setMainImageUrl] = useState<string | undefined>(
    initialImageUrl,
  );
  /** Canvas background color when no image (simple floor mode) */
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>(
    initialCanvasBackgroundColor || DEFAULT_CANVAS_BACKGROUND_COLOR,
  );
  /** Marker fill transparency (0.0 to 1.0) */
  const [markerFillTransparency, setMarkerFillTransparency] = useState<number>(
    initialMarkerFillTransparency ?? 1.0,
  );
  // Use ref to ensure we always read the latest transparency value in mutation closure
  const markerFillTransparencyRef = useRef(markerFillTransparency);
  useEffect(() => {
    markerFillTransparencyRef.current = markerFillTransparency;
  }, [markerFillTransparency]);
  // Store file_id for the main image
  const [mainImageFileId, setMainImageFileId] = useState<string | undefined>(
    initialFileId,
  );

  // Update image URL when prop changes (e.g., when layout loads with image).
  // When initialImageUrl is undefined, do not overwrite mainImageUrl so a locally
  // added image (section-level "Add floor plan image") stays visible until layout is saved.
  useEffect(() => {
    if (initialImageUrl !== undefined) {
      setMainImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  // Sync canvas background color from layout when it loads or changes
  useEffect(() => {
    if (initialCanvasBackgroundColor) {
      setCanvasBackgroundColor(initialCanvasBackgroundColor);
    }
  }, [initialCanvasBackgroundColor]);

  // Sync marker fill transparency from layout when it loads or changes
  useEffect(() => {
    if (initialMarkerFillTransparency !== undefined) {
      setMarkerFillTransparency(initialMarkerFillTransparency);
    }
  }, [initialMarkerFillTransparency]);

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
    null,
  );

  // Update canvas background color when drilling down into a section
  useEffect(() => {
    if (viewingSection) {
      // Use section's canvas background color if available
      const sectionColor =
        viewingSection.canvasBackgroundColor || DEFAULT_CANVAS_BACKGROUND_COLOR;
      setCanvasBackgroundColor(sectionColor);
    } else {
      // Restore layout's canvas background color when returning to main view
      const layoutColor =
        initialCanvasBackgroundColor || DEFAULT_CANVAS_BACKGROUND_COLOR;
      setCanvasBackgroundColor(layoutColor);
    }
  }, [viewingSection, initialCanvasBackgroundColor]);

  // Seats (for small venue: all seats, for large venue: seats in viewingSection)
  const [seats, setSeats] = useState<SeatMarker[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatMarker | null>(null);
  /** Multi-selection: all selected seat ids (for highlight + Delete key). */
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  /** Track IDs of seats deleted locally (for batch deletion on Save) */
  const [deletedSeatIds, setDeletedSeatIds] = useState<string[]>([]);
  /** Track IDs of sections deleted locally (for batch deletion on Save) */
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);

  // Undo/Redo history management (must be after seats and sectionMarkers are defined)
  const getSnapshot = useCallback((): DesignerSnapshot => {
    return {
      seats: [...seats],
      sectionMarkers: [...sectionMarkers],
      canvasBackgroundColor,
      markerFillTransparency,
    };
  }, [seats, sectionMarkers, canvasBackgroundColor, markerFillTransparency]);

  const restoreSnapshot = useCallback((snapshot: DesignerSnapshot) => {
    setSeats(snapshot.seats);
    setSectionMarkers(snapshot.sectionMarkers);
    setCanvasBackgroundColor(snapshot.canvasBackgroundColor);
    setMarkerFillTransparency(snapshot.markerFillTransparency);
  }, []);

  const {
    recordSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  } = useDesignerHistory({
    getSnapshot,
    restoreSnapshot,
  });

  // Canvas and marker handlers (defined after recordSnapshot is available)
  const handleCanvasBackgroundColorChange = useCallback((color: string) => {
    recordSnapshot(); // Record state before change for undo
    setCanvasBackgroundColor(color);
    // Don't save immediately - will be saved when save button is clicked
  }, [recordSnapshot]);

  const handleMarkerFillTransparencyChange = useCallback(
    (transparency: number) => {
      recordSnapshot(); // Record state before change for undo
      setMarkerFillTransparency(transparency);
      // Don't save immediately - will be saved when save button is clicked
    },
    [recordSnapshot],
  );

  /** Multi-selection: all selected section ids (for highlight + Delete key). */
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  /** Anchor for alignment - the object to align others to (last clicked object) */
  const [anchorSeatId, setAnchorSeatId] = useState<string | null>(null);
  const [anchorSectionId, setAnchorSectionId] = useState<string | null>(null);
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
    null,
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


  // Shape state for placement marks
  const [placementShape, setPlacementShape] = useState<PlacementShape>({
    type: PlacementShapeType.CIRCLE,
    radius: 0.8,
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
    null,
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
  
  // Refresh handler to reload data from server
  const handleRefresh = useCallback(async () => {
    // Invalidate queries - React Query will automatically dedupe concurrent refetches
    // of the same query key, so even if multiple components use the same query,
    // it will only make one network request
    
    // If initialSections is provided, we're using data from /with-seats, so we don't need
    // to invalidate the separate sections query - just invalidate /with-seats
    // The parent component will refetch /with-seats and pass updated initialSections
    const queriesToInvalidate = [
      queryClient.invalidateQueries({ 
        queryKey: ["seats", layoutId],
        refetchType: "active", // Only refetch active queries
      }),
      // Only invalidate sections query if we're not using initialSections (from /with-seats)
      // When initialSections is provided, sections come from /with-seats, so no need for separate call
      ...(!initialSections ? [
        queryClient.invalidateQueries({ 
          queryKey: ["sections", "layout", layoutId],
          refetchType: "active",
        }),
      ] : []),
      // Always invalidate with-seats so parent component gets updated data
      // This will also update initialSections when parent refetches
      queryClient.invalidateQueries({ 
        queryKey: ["layouts", layoutId, "with-seats"],
        refetchType: "active", // Only refetch active queries
      }),
    ];
    
    await Promise.all(queriesToInvalidate);
    
    // Reset dirty state and undo/redo history after refresh
    // This ensures the UI reflects that we're back to a clean state matching the server
    setDeletedSeatIds([]);
    setDeletedSectionIds([]);
    // Mark all seats and sections as not new (they're from server now)
    setSeats((prev) => prev.map((s) => ({ ...s, isNew: false })));
    setSectionMarkers((prev) => prev.map((s) => ({ ...s, isNew: false })));
    // Clear undo/redo history since we've refreshed from server
    clearHistory();
  }, [queryClient, layoutId, initialSections, clearHistory]);
  
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [dimensionsReady, setDimensionsReady] = useState(false);
  const [dragOverActive, setDragOverActive] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(5); // 5% grid spacing
  const [showGrid, setShowGrid] = useState(false); // Show grid lines on canvas
  const [showPreview, setShowPreview] = useState(false); // Show booking preview dialog

  // When in section detail view, the canvas only mounts after section has an image (else ImageUploadCard shows).
  // Reset dimensions so we re-measure the canvas container when it mounts and the image shows like seat-level.
  const prevSectionImageUrlRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const sectionImageUrl =
      venueType === "large" && viewingSection
        ? viewingSection.imageUrl
        : undefined;
    const hadImage = !!prevSectionImageUrlRef.current;
    const hasImage = !!sectionImageUrl;
    if (!hadImage && hasImage) {
      setDimensionsReady(false);
    }
    prevSectionImageUrlRef.current = sectionImageUrl;
  }, [venueType, viewingSection?.id, viewingSection?.imageUrl]);

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
    refetchOnMount: false, // Don't refetch on mount - use cache, refresh button will invalidate
    refetchOnWindowFocus: false,
  });

  // Fetch sections for the layout only if initialSections not provided
  // If initialSections is provided (from /with-seats), use that instead to avoid duplicate API calls
  const { data: sectionsData } = useQuery({
    queryKey: ["sections", "layout", layoutId],
    queryFn: () => sectionService.getByLayout(layoutId),
    enabled: !!layoutId && !initialSections, // Only fetch if initialSections not provided
    refetchOnMount: false, // Don't refetch on mount - use cache, refresh button will invalidate
    refetchOnWindowFocus: false,
  });
  
  // Use initialSections if provided, otherwise use sectionsData from query
  // Both should have the same structure (Section[]), so this is safe
  const effectiveSectionsData = (initialSections || sectionsData) as typeof sectionsData;

  // Ensure a default section exists in UI for section-level (large) mode
  // Only create temporary marker if no sections from API and no initialSections
  useEffect(() => {
    if (
      designMode === "section-level" &&
      sectionMarkers.length === 0 &&
      !isLoading &&
      !initialSections &&
      (!effectiveSectionsData || effectiveSectionsData.length === 0)
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
    effectiveSectionsData,
  ]);

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
      const markers: SectionMarker[] = initialSections.map((section) => {
        let shape: PlacementShape | undefined;
        if ("shape" in section && section.shape) {
          try {
            const parsed = JSON.parse(section.shape);
            // Normalize the type to ensure it matches the enum
            if (parsed && typeof parsed === "object" && parsed.type) {
              shape = {
                ...parsed,
                type: parsed.type as PlacementShapeType,
              };
            } else {
              console.warn(
                "Parsed shape is invalid from initialSections:",
                parsed,
              );
            }
          } catch (e) {
            console.error(
              "Failed to parse section shape from initialSections:",
              e,
            );
          }
        }
        return {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          canvasBackgroundColor:
            (section as { canvas_background_color?: string | null })
              .canvas_background_color ?? "#e5e7eb",
          shape,
          isNew: false,
        };
      });
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
      effectiveSectionsData !== undefined && // effectiveSectionsData has been loaded (could be empty array)
      designMode === "section-level"
    ) {
      // Always sync effectiveSectionsData to sectionMarkers, even if empty
      // This replaces any temporary "section-default" markers with real sections
      console.log("effectiveSectionsData received:", effectiveSectionsData);
      const markers: SectionMarker[] = effectiveSectionsData.map((section) => {
        console.log(
          "Processing section:",
          section.id,
          "name:",
          section.name,
          "canvas_background_color:",
          section.canvas_background_color,
          "marker_fill_transparency:",
          section.marker_fill_transparency,
          "shape value:",
          section.shape,
          "type:",
          typeof section.shape,
          "isTruthy:",
          !!section.shape,
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
                normalized.type,
              );
            } else {
              console.warn("Parsed shape is invalid:", parsed);
            }
          } catch (e) {
            console.error(
              "Failed to parse section shape:",
              e,
              "Raw shape string:",
              section.shape,
            );
          }
        } else {
          console.log(
            "Section has no shape property or shape is falsy. Section:",
            { id: section.id, name: section.name, shape: section.shape },
          );
        }
        return {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          // Preserve section's own values - use undefined if not set (will inherit from layout)
          // Only use defaults if section explicitly has no value AND we need a fallback for display
          canvasBackgroundColor: section.canvas_background_color !== undefined && section.canvas_background_color !== null
            ? section.canvas_background_color
            : undefined, // undefined means inherit from layout
          markerFillTransparency: section.marker_fill_transparency !== undefined && section.marker_fill_transparency !== null
            ? section.marker_fill_transparency
            : undefined, // undefined means inherit from layout
          shape,
          isNew: false,
        };
      });
      console.log(
        "Section markers created from effectiveSectionsData:",
        markers.map((m) => ({
          id: m.id,
          name: m.name,
          hasShape: !!m.shape,
          shapeType: m.shape?.type,
          shape: m.shape,
          canvasBackgroundColor: m.canvasBackgroundColor,
          markerFillTransparency: m.markerFillTransparency,
        })),
      );
      setSectionMarkers(markers);
    }
  }, [effectiveSectionsData, initialSections, designMode]);

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
            "shape" in seat,
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
                  normalized.type,
                );
              } else {
                console.warn(
                  "Parsed seat shape is invalid from initialSeats:",
                  parsed,
                );
              }
            } catch (e) {
              console.error(
                "Failed to parse seat shape from initialSeats:",
                e,
                "Raw shape string:",
                seat.shape,
              );
            }
          } else {
            console.log(
              "Seat from initialSeats has no shape or shape is falsy:",
              { id: seat.id, shape: seat.shape, hasShapeProp: "shape" in seat },
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
          })),
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
            typeof seat.shape,
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
                  normalized.type,
                );
              } else {
                console.warn(
                  "Parsed seat shape is invalid from existingSeats:",
                  parsed,
                );
              }
            } catch (e) {
              console.error(
                "Failed to parse seat shape from existingSeats:",
                e,
                "Raw shape string:",
                seat.shape,
              );
            }
          } else {
            console.log(
              "Seat from existingSeats has no shape or shape is falsy:",
              { id: seat.id, shape: seat.shape },
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
          })),
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

  // Clear anchor when it's no longer in the selected items
  useEffect(() => {
    if (anchorSeatId && !selectedSeatIds.includes(anchorSeatId)) {
      setAnchorSeatId(null);
    }
    if (anchorSectionId && !selectedSectionIds.includes(anchorSectionId)) {
      setAnchorSectionId(null);
    }
  }, [anchorSeatId, anchorSectionId, selectedSeatIds, selectedSectionIds]);

  // Handle main image upload
  const handleMainImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);
        const response = await uploadService.uploadImage(file);
        setMainImageUrl(response.url);
        setMainImageFileId(response.id); // Store file_id
        if (onImageUpload) {
          onImageUpload(response.url, response.id);
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
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);
        const response = await uploadService.uploadImage(file);

        // Update local state immediately for UI feedback
        setSectionMarkers((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, imageUrl: response.url } : s,
          ),
        );
        // Update viewingSection if it's the same section being viewed
        if (viewingSection?.id === sectionId) {
          setViewingSection((prev) =>
            prev ? { ...prev, imageUrl: response.url } : null,
          );
        }

        // Save file_id to the section in the database
        // Try to get section from effectiveSectionsData first (saved in DB), otherwise use sectionMarkers
        const sectionFromData = effectiveSectionsData?.find((s) => s.id === sectionId);
        const sectionFromMarkers = sectionMarkers.find(
          (s) => s.id === sectionId,
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
                  : s,
              ),
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
                  : null,
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
                  : null,
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

  // Remove section background image (file_id becomes optional/empty)
  const handleRemoveSectionImage = useCallback(
    (sectionId: string) => {
      recordSnapshot(); // Record state before change for undo
      // Update local state only - will be saved when Save button is clicked
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, imageUrl: undefined } : s,
        ),
      );
      if (selectedSectionMarker?.id === sectionId) {
        setSelectedSectionMarker((prev) =>
          prev ? { ...prev, imageUrl: undefined } : null,
        );
      }
      if (viewingSection?.id === sectionId) {
        setViewingSection((prev) =>
          prev ? { ...prev, imageUrl: undefined } : null,
        );
      }
    },
    [selectedSectionMarker?.id, viewingSection?.id, recordSnapshot],
  );

  // Clear all placements
  const handleClearAllPlacements = () => {
    recordSnapshot(); // Record state before change for undo
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
        recordSnapshot(); // Record state before change for undo
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
  }, [mainImageUrl, recordSnapshot]);

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
        recordSnapshot(); // Record state before change for undo
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
  }, [mainImageUrl, viewingSection, seatPlacementForm, recordSnapshot]);

  // Clear seats in current section (for section detail view)
  const handleClearSectionSeats = () => {
    if (viewingSection) {
      recordSnapshot(); // Record state before change for undo
      setSeats((prev) =>
        prev.filter((s) => s.seat.section !== viewingSection.name),
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

  // Helper function to snap coordinates to grid
  const snapToGridCoordinates = (
    x: number,
    y: number,
  ): { x: number; y: number } => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  };

  // Handle shape drawing from canvas - creates section (section-level) or seat (seat-level)
  const handleShapeDraw = useCallback(
    (
      shape: PlacementShape,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => {
      // Apply snap to grid if enabled
      const { x: snappedX, y: snappedY } = snapToGridCoordinates(x, y);
      const clampedX = Math.max(0, Math.min(100, snappedX));
      const clampedY = Math.max(0, Math.min(100, snappedY));

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
          // Store coordinates and start inline creation (no snapshot needed - will snapshot when section is created)
          setPendingSectionCoordinates({ x: clampedX, y: clampedY });
          // Store shape to apply after section is created
          setPlacementShape(finalShape);
          setIsSectionCreationPending(true);
          setEditingSectionId(null);
          // sectionForm.reset({ name: "" }); // Not used for inline creation
          return; // Exit early when creating section from shape tool
        }

        // Seat-level layout or section detail view: create seat markers
        recordSnapshot(); // Record state before change for undo
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
        recordSnapshot(); // Record state before change for undo
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
      recordSnapshot,
      viewingSection,
      isPlacingSeats,
      isPlacingSections,
      seatPlacementForm,
      sectionForm,
      selectedShapeTool,
    ],
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
    [shapeOverlays],
  );

  // Handle Konva image click - uses percentage coordinates from LayoutCanvas
  // Note: This should NOT be called when drawing shapes with shape tools (drag-to-draw)
  // Shape tools use handleShapeDraw instead, which is called from onMouseUp in layout-canvas
  const handleKonvaImageClick = useCallback(
    (
      _e: Konva.KonvaEventObject<MouseEvent>,
      percentageCoords?: { x: number; y: number },
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
        recordSnapshot(); // Record state before change for undo
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
        recordSnapshot(); // Record state before change for undo
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
      recordSnapshot,
      venueType,
      viewingSection,
      isPlacingSeats,
      isPlacingSections,
      selectedShapeTool,
      seatPlacementForm,
      placementShape,
      setPlacementShape,
      setPendingSectionCoordinates,
      setIsSectionCreationPending,
      setEditingSectionId,
      setSeats,
    ],
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
    [],
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
      recordSnapshot(); // Record state before change for undo
      // Apply snap to grid if enabled
      let snappedX = newX;
      let snappedY = newY;
      if (snapToGrid) {
        snappedX = Math.round(newX / gridSize) * gridSize;
        snappedY = Math.round(newY / gridSize) * gridSize;
      }
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === seatId
            ? {
                ...seat,
                x: Math.max(0, Math.min(100, snappedX)),
                y: Math.max(0, Math.min(100, snappedY)),
              }
            : seat,
        ),
      );
    },
    [snapToGrid, recordSnapshot],
  );

  // Handle seat shape transform (resize/rotate)
  const handleSeatShapeTransform = useCallback(
    (seatId: string, shape: PlacementShape) => {
      recordSnapshot(); // Record state before change for undo
      // Update local state only - will be saved when Save button is clicked
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === seatId
            ? {
                ...seat,
                shape,
              }
            : seat,
        ),
      );
    },
    [recordSnapshot],
  );

  // Handle section drag end from Konva
  const handleKonvaSectionDragEnd = useCallback(
    (sectionId: string, newX: number, newY: number) => {
      recordSnapshot(); // Record state before change for undo
      // Apply snap to grid if enabled
      let snappedX = newX;
      let snappedY = newY;
      if (snapToGrid) {
        snappedX = Math.round(newX / gridSize) * gridSize;
        snappedY = Math.round(newY / gridSize) * gridSize;
      }
      setSectionMarkers((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                x: Math.max(0, Math.min(100, snappedX)),
                y: Math.max(0, Math.min(100, snappedY)),
              }
            : section,
        ),
      );
    },
    [snapToGrid, gridSize, recordSnapshot],
  );

  // Handle section click from Konva (shift-click toggles multi-select)
  const handleKonvaSectionClick = useCallback(
    (section: SectionMarker, event?: { shiftKey?: boolean }) => {
      // When a shape tool is active, skip selection (canvas is in placement mode)
      if (selectedShapeTool) return;

      setViewingSection(null);
      setSelectedSeatIds([]);
      setSelectedSeat(null);

      if (event?.shiftKey) {
        const isSelected = selectedSectionIds.includes(section.id);
        const nextIds = isSelected
          ? selectedSectionIds.filter((id) => id !== section.id)
          : [...selectedSectionIds, section.id];
        setSelectedSectionIds(nextIds);

        const primaryId = nextIds.length > 0 ? nextIds[0] : null;
        const primarySection = primaryId
          ? (sectionMarkers.find((marker) => marker.id === primaryId) ?? null)
          : null;
        setSelectedSectionMarker(primarySection);
        // Set the clicked section as the anchor
        setAnchorSectionId(section.id);
        setAnchorSeatId(null);
        return;
      }

      setSelectedSectionIds([section.id]);
      setSelectedSectionMarker(section);
      // Set the clicked section as the anchor
      setAnchorSectionId(section.id);
      setAnchorSeatId(null);
    },
    [sectionMarkers, selectedSectionIds, selectedShapeTool],
  );

  // Handle seat marker click - used elsewhere in the component
  const handleSectionMarkerClick = (
    section: SectionMarker,
    e: React.MouseEvent,
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
    event?: { shiftKey?: boolean },
  ) => {
    // When a shape tool is active, skip selection (canvas is in placement mode)
    if (selectedShapeTool) return;

    if (event?.shiftKey) {
      setSelectedSeatIds((prev) =>
        prev.includes(seat.id)
          ? prev.filter((id) => id !== seat.id)
          : [...prev, seat.id],
      );
      setSelectedSeat(seat);
      setSelectedSectionIds([]);
    } else {
      setSelectedSeatIds([seat.id]);
      setSelectedSeat(seat);
      setSelectedSectionIds([]);
    }
    // Set the clicked seat as the anchor for alignment
    setAnchorSeatId(seat.id);
    setAnchorSectionId(null);
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
    if (selectedSeat) {
      recordSnapshot(); // Record state before change for undo
      // Update local state only - will be saved when Save button is clicked
      setSeats((prev) =>
        prev.map((s) => (s.id === selectedSeat.id ? { ...s, seat: data } : s)),
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

  // Handle shape tool selection - clear all selections when a shape tool (not pointer) is selected
  const handleShapeToolSelect = useCallback(
    (tool: PlacementShapeType | null) => {
      setSelectedShapeTool(tool);
      // When a shape tool (not pointer) is selected, release all selections
      if (tool !== null) {
        setSelectedSeat(null);
        setSelectedSeatIds([]);
        setSelectedSectionMarker(null);
        setSelectedSectionIds([]);
        setAnchorSeatId(null);
        setAnchorSectionId(null);
        setIsEditingSeat(false);
      }
    },
    [],
  );

  // Handle deselection - clear all selections when clicking on empty space
  const handleDeselect = () => {
    setSelectedSeat(null);
    setSelectedSectionMarker(null);
    setSelectedSeatIds([]);
    setSelectedSectionIds([]);
    setAnchorSeatId(null);
    setAnchorSectionId(null);
    setIsEditingSeat(false);
  };

  // Apply drag-to-select result: set multi-selection and primary from first item
  const handleMarkersInRect = useCallback(
    (seatIds: string[], sectionIds: string[]) => {
      // When a shape tool is active, skip drag-to-select (canvas is in placement mode)
      if (selectedShapeTool) return;

      setSelectedSeatIds(seatIds);
      setSelectedSectionIds(sectionIds);
      setSelectedSeat(
        seatIds.length > 0
          ? (seats.find((s) => s.id === seatIds[0]) ?? null)
          : null,
      );
      setSelectedSectionMarker(
        sectionIds.length > 0
          ? (sectionMarkers.find((s) => s.id === sectionIds[0]) ?? null)
          : null,
      );
      // Note: Do NOT call setViewingSection(null) here.
      // This callback is also invoked from SectionDetailView's canvas (drag-to-select seats
      // within a section). Clearing viewingSection would incorrectly exit the drill-down.
      // When on the main canvas, viewingSection is already null so the call was a no-op anyway.
    },
    [seats, sectionMarkers, selectedShapeTool],
  );

  // Handle drag over canvas for shape toolbox drag-drop
  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverActive(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverActive(false);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverActive(false);

    const dragData = e.dataTransfer.getData("application/json");
    if (!dragData) return;

    try {
      const { shapeType, dragSource } = JSON.parse(dragData);
      if (dragSource !== "shape-toolbox" || !shapeType) return;

      // Type-safe access to shape type
      const typedShapeType = shapeType as PlacementShapeType;
      if (!Object.values(PlacementShapeType).includes(typedShapeType)) {
        return;
      }

      // Get container position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate drop position relative to container
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      // Convert to percentage coordinates (0-100) accounting for zoom and pan
      const percentageX =
        ((dropX - panOffset.x) / zoomLevel / containerDimensions.width) * 100;
      const percentageY =
        ((dropY - panOffset.y) / zoomLevel / containerDimensions.height) * 100;

      // Create default shape based on selected shape type
      const defaultShapes: Record<PlacementShapeType, PlacementShape> = {
        [PlacementShapeType.CIRCLE]: {
          type: PlacementShapeType.CIRCLE,
          radius: 2,
          fillColor: DEFAULT_SHAPE_FILL,
          strokeColor: DEFAULT_SHAPE_STROKE,
        },
        [PlacementShapeType.RECTANGLE]: {
          type: PlacementShapeType.RECTANGLE,
          width: 4,
          height: 3,
          fillColor: DEFAULT_SHAPE_FILL,
          strokeColor: DEFAULT_SHAPE_STROKE,
        },
        [PlacementShapeType.ELLIPSE]: {
          type: PlacementShapeType.ELLIPSE,
          width: 4,
          height: 3,
          fillColor: DEFAULT_SHAPE_FILL,
          strokeColor: DEFAULT_SHAPE_STROKE,
        },
        [PlacementShapeType.POLYGON]: {
          type: PlacementShapeType.POLYGON,
          points: [-1.5, -1, 1.5, -1, 2, 1, 0, 2, -2, 1],
          fillColor: DEFAULT_SHAPE_FILL,
          strokeColor: DEFAULT_SHAPE_STROKE,
        },
        [PlacementShapeType.FREEFORM]: {
          type: PlacementShapeType.FREEFORM,
          points: [0, 0, 2, 0, 3, 2, 2, 3, 0, 3, -1, 2],
          fillColor: DEFAULT_SHAPE_FILL,
          strokeColor: DEFAULT_SHAPE_STROKE,
        },
      };

      const shape = defaultShapes[typedShapeType];
      if (!shape) return;

      // Call handleShapeDraw with the dropped shape
      handleShapeDraw(shape, percentageX, percentageY);
    } catch (error) {
      console.error("Error processing shape drop:", error);
    }
  };

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

  // Edit section from effectiveSectionsData (for seat-level mode)
  const handleEditSectionFromData = (section: { id: string; name: string }) => {
    setEditingSectionId(section.id);
    sectionForm.reset({ name: section.name });
    // Keep ManageSectionsSheet open - it will switch to edit mode
    setPendingSectionCoordinates(null); // Clear any pending coordinates
  };

  // Cancel edit in ManageSectionsSheet
  const handleCancelEditSection = () => {
    setEditingSectionId(null);
    sectionForm.reset({ name: "" });
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
      effectiveSectionsData,
      sectionMarkers,
      designMode,
    );
  };

  // Section creation (local-only, will be saved on Save button click)
  const handleCreateSection = (input: {
    name: string;
    x?: number;
    y?: number;
    shape?: PlacementShape;
    replaceSectionId?: string;
  }) => {
    recordSnapshot(); // Record state before change for undo
    const replaceSectionId = input.replaceSectionId;
    const tempId = replaceSectionId || `temp-${Date.now()}`;
    
    // Always update seat placement form with the new section name and ID
    seatPlacementForm.setValue("section", input.name);
    seatPlacementForm.setValue("sectionId", tempId);

    // Only update sectionMarkers in section-level mode
    if (designMode === "section-level") {
      const coordinates = pendingSectionCoordinates || {
        x: input.x ?? 50,
        y: input.y ?? 50,
      };

      const newSectionMarker: SectionMarker = {
        id: tempId,
        name: input.name,
        x: coordinates.x,
        y: coordinates.y,
        canvasBackgroundColor: "#e5e7eb",
        markerFillTransparency: 1.0,
        isNew: true,
        shape: input.shape ?? placementShape,
      };

      if (replaceSectionId) {
        // Replacing an unsaved section marker: update in place
        setSectionMarkers((prev) =>
          prev.map((s) => (s.id === replaceSectionId ? newSectionMarker : s)),
        );
        setSelectedSectionMarker((prev) =>
          prev?.id === replaceSectionId ? newSectionMarker : prev,
        );
        setViewingSection((prev) =>
          prev?.id === replaceSectionId ? newSectionMarker : prev,
        );
      } else {
        // New section
        setSectionMarkers((prev) => [...prev, newSectionMarker]);
        setPlacementShape({
          type: PlacementShapeType.CIRCLE,
          radius: 0.8,
        });
      }
    }

    setPendingSectionCoordinates(null);
    setIsSectionFormOpen(false);
    setEditingSectionId(null);
    sectionForm.reset({ name: "" });
    toast({ title: "Section created (will be saved on Save)" });
  };

  // Section update (local-only, will be saved on Save button click)
  const handleUpdateSection = (input: {
    sectionId: string;
    name: string;
    x?: number;
    y?: number;
    file_id?: string;
    shape?: PlacementShape;
  }) => {
    recordSnapshot(); // Record state before change for undo
    // Update sectionMarkers
    setSectionMarkers((prev) =>
      prev.map((s) =>
        s.id === input.sectionId
          ? {
              ...s,
              name: input.name,
              x: input.x !== undefined ? input.x : s.x,
              y: input.y !== undefined ? input.y : s.y,
              shape: input.shape !== undefined ? input.shape : s.shape,
            }
          : s,
      ),
    );
    setSelectedSectionMarker((prev) =>
      prev && prev.id === input.sectionId
        ? {
            ...prev,
            name: input.name,
            x: input.x !== undefined ? input.x : prev.x,
            y: input.y !== undefined ? input.y : prev.y,
            shape: input.shape !== undefined ? input.shape : prev.shape,
          }
        : prev,
    );
    if (viewingSection?.id === input.sectionId) {
      setViewingSection((prev) =>
        prev
          ? {
              ...prev,
              name: input.name,
            }
          : null,
      );
    }
    setIsSectionFormOpen(false);
    setEditingSectionId(null);
    sectionForm.reset({ name: "" });
    toast({ title: "Section updated (will be saved on Save)" });
  };

  const handleSectionCanvasBackgroundColorChange = useCallback(
    (color: string) => {
      if (!viewingSection) return;
      recordSnapshot(); // Record state before change for undo
      // Update local state only - will be saved when Save button is clicked
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === viewingSection.id
            ? { ...s, canvasBackgroundColor: color }
            : s,
        ),
      );
      setViewingSection((prev) =>
        prev && prev.id === viewingSection.id
          ? { ...prev, canvasBackgroundColor: color }
          : prev,
      );
    },
    [viewingSection, recordSnapshot],
  );

  const handleSectionMarkerFillTransparencyChange = useCallback(
    (transparency: number) => {
      if (!viewingSection) return;
      recordSnapshot(); // Record state before change for undo
      // Update local state only - will be saved when Save button is clicked
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === viewingSection.id
            ? { ...s, markerFillTransparency: transparency }
            : s,
        ),
      );
      setViewingSection((prev) =>
        prev && prev.id === viewingSection.id
          ? { ...prev, markerFillTransparency: transparency }
          : prev,
      );
    },
    [viewingSection, recordSnapshot],
  );

  // Handle keyboard shortcuts (arrow keys, copy, paste)
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
          setAnchorSeatId(null);
          setAnchorSectionId(null);
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
            (s) => s.id === selectedSectionMarker.id,
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

          recordSnapshot(); // Record state before change for undo
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
            String(parseInt(nextSeatNumber) + 1),
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

          recordSnapshot(); // Record state before change for undo
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

      // Handle undo/redo shortcuts
      if (event.key === "z" || event.key === "Z") {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (event.shiftKey) {
            // Ctrl+Shift+Z or Cmd+Shift+Z: Redo
            redo();
          } else {
            // Ctrl+Z or Cmd+Z: Undo
            undo();
          }
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

        // Update seat position (local state only - will be saved when Save button is clicked)
        handleKonvaSeatDragEnd(selectedSeat.id, newX, newY);
        return;
      }

      // Handle section movement
      if (selectedSectionMarker) {
        event.preventDefault();
        const currentSection = sectionMarkers.find(
          (s) => s.id === selectedSectionMarker.id,
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
    copiedSeat,
    copiedSection,
    designMode,
    venueType,
    viewingSection,
    seatPlacementForm,
    undo,
    redo,
  ]);

  // Handle section shape transform (resize/rotate) - defined after mutations
  const handleSectionShapeTransform = useCallback(
    (sectionId: string, shape: PlacementShape) => {
      recordSnapshot(); // Record state before change for undo
      // Only update local state - don't save to backend immediately
      // Changes will be saved when user explicitly saves the layout
      setSectionMarkers((prev) => {
        return prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                shape,
              }
            : section,
        );
      });
    },
    [recordSnapshot],
  );

  const handleSeatShapeStyleChange = useCallback(
    (
      seatId: string,
      style: {
        fillColor?: string;
        strokeColor?: string;
        width?: number;
        height?: number;
        radius?: number;
        rotation?: number;
      },
    ) => {
      recordSnapshot(); // Record state before change for undo
      setSeats((prev) =>
        prev.map((s) =>
          s.id === seatId
            ? {
                ...s,
                shape: {
                  ...(s.shape || {
                    type: PlacementShapeType.CIRCLE,
                    radius: 0.8,
                  }),
                  ...style,
                } as PlacementShape,
              }
            : s,
        ),
      );
      setViewingSeat((prev) =>
        prev && prev.id === seatId
          ? {
              ...prev,
              shape: {
                ...(prev.shape || {
                  type: PlacementShapeType.CIRCLE,
                  radius: 0.8,
                }),
                ...style,
              } as PlacementShape,
            }
          : prev,
      );
    },
    [recordSnapshot],
  );

  const handleSectionShapeStyleChange = useCallback(
    (
      sectionId: string,
      style: {
        fillColor?: string;
        strokeColor?: string;
        width?: number;
        height?: number;
        radius?: number;
        rotation?: number;
      },
    ) => {
      recordSnapshot(); // Record state before change for undo
      const mergeSectionShape = (
        existing: PlacementShape | undefined,
      ): PlacementShape =>
        ({
          ...(existing || {
            type: PlacementShapeType.RECTANGLE,
            width: 2,
            height: 1.5,
          }),
          ...style,
        }) as PlacementShape;
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, shape: mergeSectionShape(s.shape) } : s,
        ),
      );
      setSelectedSectionMarker((prev) =>
        prev && prev.id === sectionId
          ? { ...prev, shape: mergeSectionShape(prev.shape) }
          : prev,
        );
      },
    [recordSnapshot],
  );

  const handleSaveSectionForm = sectionForm.handleSubmit((data) => {
    const name = data.name.trim() || "Section";

    if (editingSectionId) {
      // Find section in sectionMarkers (section-level mode) or effectiveSectionsData (seat-level mode)
      const sectionFromMarkers = sectionMarkers.find(
        (s) => s.id === editingSectionId,
      );
      const sectionFromData = effectiveSectionsData?.find(
        (s) => s.id === editingSectionId,
      );

      if (sectionFromMarkers) {
        if (sectionFromMarkers.isNew) {
          // Unsaved section: create locally and replace marker
          handleCreateSection({
            name,
            x: sectionFromMarkers.x,
            y: sectionFromMarkers.y,
            shape: sectionFromMarkers.shape,
            replaceSectionId: editingSectionId,
          });
        } else {
          // Update existing section (section-level mode)
          handleUpdateSection({
            sectionId: editingSectionId,
            name,
            x: sectionFromMarkers.x,
            y: sectionFromMarkers.y,
            shape: sectionFromMarkers.shape,
          });
        }
      } else if (sectionFromData) {
        // Update existing section (seat-level mode)
        handleUpdateSection({
          sectionId: editingSectionId,
          name,
          x: sectionFromData.x_coordinate ?? undefined,
          y: sectionFromData.y_coordinate ?? undefined,
        });
      }
    } else {
      // Create new section locally (will be saved on Save button click)
      handleCreateSection({
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
          // Create unsaved section locally
          handleCreateSection({
            name,
            x: section.x,
            y: section.y,
            shape: placementShape ?? section.shape,
            replaceSectionId: editingSectionId,
          });
        } else {
          // Update existing section locally
          handleUpdateSection({
            sectionId: editingSectionId,
            name,
            x: section.x,
            y: section.y,
            shape: placementShape ?? section.shape,
          });
        }
      }
    } else {
      // Create new section locally
      handleCreateSection({
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

  // Bulk designer save mutation (saves layout properties, sections, and seats in one call)
  const bulkDesignerSaveMutation = useMutation({
    mutationFn: async () => {
      // Check if image has changed (new file_id uploaded)
      const imageChanged = mainImageFileId && mainImageFileId !== initialFileId;

      // Prepare sections array with operation type determined by presence of 'id' and 'delete' flag
      const sectionsPayload: Array<Record<string, any>> = [];
      
      if (designMode === "section-level" && venueType === "large") {
        // Process section deletions
        for (const sectionId of deletedSectionIds) {
          sectionsPayload.push({
            id: sectionId,
            delete: true,
          });
        }

        // Process section creates and updates
        for (const section of sectionMarkers) {
          // Always send marker_fill_transparency for sections
          // Priority: section's own value > layout-level value > 1.0 default
          // This ensures each section can have its own transparency value
          // Use ref for layout-level transparency to ensure we get the latest value
          const layoutTransparency = markerFillTransparencyRef.current ?? markerFillTransparency ?? 1.0;
          const sectionTransparency = (section.markerFillTransparency !== undefined && section.markerFillTransparency !== null)
            ? section.markerFillTransparency 
            : layoutTransparency;
          
          // Ensure it's always a valid number (defensive check)
          const finalTransparency = typeof sectionTransparency === 'number' && !isNaN(sectionTransparency)
            ? sectionTransparency
            : 1.0;
          
          // Debug: Log section transparency being sent
          console.log(`[Bulk Save] Section ${section.id} (${section.name}) marker_fill_transparency:`, 
                     finalTransparency, 
                     '(section.markerFillTransparency:', section.markerFillTransparency, 
                     ', layout-level:', layoutTransparency, ')');
          
          if (section.isNew) {
            // Create: no id field
            const sectionPayload: Record<string, any> = {
              name: section.name,
              x_coordinate: section.x,
              y_coordinate: section.y,
              canvas_background_color: section.canvasBackgroundColor || undefined,
              marker_fill_transparency: finalTransparency, // Always include, always a number
              shape: section.shape ? JSON.stringify(section.shape) : undefined,
            };
            sectionsPayload.push(sectionPayload);
          } else {
            // Update: has id field
            // Find original section from query result to preserve file_id
            const originalSection = effectiveSectionsData?.find((s) => s.id === section.id);
            const sectionPayload: Record<string, any> = {
              id: section.id,
              name: section.name,
              x_coordinate: section.x,
              y_coordinate: section.y,
              canvas_background_color: section.canvasBackgroundColor || undefined,
              marker_fill_transparency: finalTransparency, // Always include, always a number
              shape: section.shape ? JSON.stringify(section.shape) : undefined,
              // Preserve file_id from original section (from query result)
              file_id: originalSection?.file_id || undefined,
            };
            sectionsPayload.push(sectionPayload);
          }
        }
        
        // Debug: Log all sections payload
        console.log('[Bulk Save] All sections payload:', sectionsPayload.map(s => ({
          id: s.id,
          name: s.name,
          marker_fill_transparency: s.marker_fill_transparency,
          hasMarkerFillTransparency: 'marker_fill_transparency' in s
        })));
      }
      
      // Debug: Log final payload before sending
      console.log('[Bulk Save] Final payload sections:', sectionsPayload);

      // Prepare seats array with operation type determined by presence of 'id'
      // No 'id' = create, Has 'id' = update
      const seatsData = seats.map((seat) => {
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
          // Update: has id field - include ALL fields (position, shape, AND metadata)
          // Try to find section_id from section name if sectionId is not provided
          let sectionId = seat.seat.sectionId;
          if (!sectionId && seat.seat.section) {
            if (effectiveSectionsData && designMode === "seat-level") {
              const section = effectiveSectionsData.find((s) => s.name === seat.seat.section);
              sectionId = section?.id;
            } else if (designMode === "section-level") {
              const section = sectionMarkers.find((s) => s.name === seat.seat.section);
              sectionId = section?.id;
            }
          }
          
          return {
            id: seat.id,
            section_id: sectionId || seat.seat.section, // Send section_id if available, fallback to section name
            row: seat.seat.row,
            seat_number: seat.seat.seatNumber,
            seat_type: seat.seat.seatType,
            x_coordinate: seat.x,
            y_coordinate: seat.y,
            shape: seat.shape ? JSON.stringify(seat.shape) : undefined,
          };
        }
      });

      // Add deletions to the seats array
      const deleteOperations = deletedSeatIds.map((seatId) => ({
        id: seatId,
        delete: true,
      }));

      // Call bulk save endpoint
      // Use ref to ensure we get the latest value (in case of closure issues)
      const currentTransparency = markerFillTransparencyRef.current;
      // Ensure we always send a valid number (default to 1.0 if somehow undefined/null)
      const transparencyToSend = currentTransparency ?? markerFillTransparency ?? 1.0;
      // Debug: Log the transparency value being sent
      console.log('[Bulk Save] marker_fill_transparency being sent:', transparencyToSend, '(ref:', currentTransparency, ', state:', markerFillTransparency, ')');
      
      const response = await api.post<{
        layout: any;
        sections: any[];
        seats: any[];
      }>(
        `/api/v1/ticketing/layouts/${layoutId}/bulk-save?venue_id=${venueId}`,
        {
          canvas_background_color: canvasBackgroundColor,
          marker_fill_transparency: transparencyToSend,
          file_id: imageChanged ? mainImageFileId : undefined,
          sections: sectionsPayload,
          seats: [...seatsData, ...deleteOperations],
        },
        { requiresAuth: true }
      );

      return response;
    },
    onSuccess: (data) => {
      // Transform the response data to match the cache format (same as fetchLayoutWithSeats)
      // Transform layout
      const transformedLayout = {
        id: data.layout.id,
        tenant_id: data.layout.tenant_id,
        venue_id: data.layout.venue_id,
        name: data.layout.name,
        description: data.layout.description || undefined,
        image_url: data.layout.image_url || undefined,
        file_id: data.layout.file_id || undefined,
        design_mode: (data.layout.design_mode || "seat-level") as "seat-level" | "section-level",
        canvas_background_color: data.layout.canvas_background_color || undefined,
        marker_fill_transparency: data.layout.marker_fill_transparency ?? 1.0,
        is_active: data.layout.is_active,
        created_at: data.layout.created_at ? new Date(data.layout.created_at) : new Date(),
        updated_at: data.layout.updated_at ? new Date(data.layout.updated_at) : new Date(),
      };
      
      // Transform seats
      const transformedSeats = (data.seats || []).map((seat: any) => ({
        id: seat.id,
        tenant_id: seat.tenant_id,
        venue_id: seat.venue_id,
        layout_id: seat.layout_id,
        section_id: seat.section_id,
        section_name: seat.section_name,
        row: seat.row,
        seat_number: seat.seat_number,
        seat_type: seat.seat_type,
        x_coordinate: seat.x_coordinate ?? undefined,
        y_coordinate: seat.y_coordinate ?? undefined,
        shape: seat.shape ?? undefined,
        is_active: seat.is_active,
        created_at: seat.created_at ? new Date(seat.created_at) : new Date(),
        updated_at: seat.updated_at ? new Date(seat.updated_at) : new Date(),
      }));
      
      // Transform sections
      const transformedSections = (data.sections || []).map((section: any) => ({
        id: section.id,
        tenant_id: section.tenant_id,
        layout_id: section.layout_id,
        name: section.name,
        x_coordinate: section.x_coordinate ?? undefined,
        y_coordinate: section.y_coordinate ?? undefined,
        file_id: section.file_id ?? undefined,
        image_url: section.image_url ?? undefined,
        canvas_background_color: section.canvas_background_color ?? undefined,
        marker_fill_transparency: section.marker_fill_transparency ?? undefined,
        shape: section.shape ?? undefined,
        is_active: section.is_active,
        created_at: section.created_at ? new Date(section.created_at) : new Date(),
        updated_at: section.updated_at ? new Date(section.updated_at) : new Date(),
      }));
      
      // Update React Query cache with the transformed data instead of refetching
      // This avoids unnecessary network requests and uses the latest data from the save
      
      // Update layout cache
      queryClient.setQueryData(
        ["layouts", layoutId],
        transformedLayout
      );
      
      // Update layout with seats cache (use returned data)
      queryClient.setQueryData(
        ["layouts", layoutId, "with-seats"],
        {
          layout: transformedLayout,
          seats: transformedSeats,
          sections: transformedSections,
        }
      );
      
      // Update seats cache
      queryClient.setQueryData(
        ["seats", layoutId],
        transformedSeats
      );
      
      // Update sections cache (use returned sections)
      queryClient.setQueryData(
        ["sections", "layout", layoutId],
        transformedSections
      );
      
      // Update the current layout in the venue layouts list cache (if it exists)
      // This avoids refetching the entire venue layouts list
      queryClient.setQueryData(
        ["layouts", "venue", venueId],
        (oldData: any) => {
          if (!oldData) return oldData; // If cache doesn't exist, don't create it
          return oldData.map((layout: any) =>
            layout.id === layoutId ? transformedLayout : layout
          );
        }
      );
      
      // Only invalidate venue-level seat queries (if needed for other components)
      queryClient.invalidateQueries({ queryKey: ["seats", venueId] });

      setSeats((prev) => prev.map((s) => ({ ...s, isNew: false })));

      // Mark all sections as saved
      setSectionMarkers((prev) =>
        prev.map((section) => ({ ...section, isNew: false })),
      );

      // Clear deletion tracking arrays
      setDeletedSeatIds([]);
      setDeletedSectionIds([]);

      // Clear undo/redo history after successful save
      clearHistory();

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
        title: "Designer Saved",
        description: "All designer changes have been saved successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      // Close confirmation dialog on error
      setShowSaveConfirmDialog(false);

      // Extract error message
      let errorMessage = "Failed to save designer changes. Please try again.";

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

  const handleSave = () => {
    setShowSaveConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    // Trigger bulk save mutation (handles layout properties, sections, and seats in one call)
    bulkDesignerSaveMutation.mutate();
  };

  // Delete seat from datasheet
  const handleDeleteSeat = (seat: SeatMarker) => {
    recordSnapshot(); // Record state before change for undo
    // Track deletion for batch save (only if seat was already saved)
    if (!seat.isNew) {
      setDeletedSeatIds((prev) => [...prev, seat.id]);
    }
    // Remove from local state
    setSeats((prev) => prev.filter((s) => s.id !== seat.id));
    if (selectedSeat?.id === seat.id) {
      setSelectedSeat(null);
    }
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
  };

  // Delete section handlers
  const handleDeleteSection = (section: {
    id: string;
    isNew?: boolean;
    seat_count?: number | null;
  }) => {
    const sectionId = section.id;
    
    if (section.isNew) {
      recordSnapshot(); // Record state before change for undo
      // Unsaved section: only remove from local state
      setSectionMarkers((prev) => prev.filter((s) => s.id !== sectionId));
      setSeats((prev) =>
        prev.filter((s) => {
          const seatSectionId = (s.seat as any).sectionId;
          return seatSectionId !== sectionId && s.seat.section !== sectionId;
        }),
      );
      if (selectedSectionMarker?.id === sectionId)
        setSelectedSectionMarker(null);
      setSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
      if (viewingSection?.id === sectionId) setViewingSection(null);
      toast({ title: "Section removed" });
    } else {
      // Check seat count before attempting deletion
      const seatCount = section.seat_count ?? 0;
      if (seatCount > 0) {
        toast({
          title: "Cannot delete section",
          description: `This section has ${seatCount} seat${seatCount === 1 ? "" : "s"} attached. Please remove all seats before deleting the section.`,
          variant: "destructive",
        });
        return;
      }
      
      recordSnapshot(); // Record state before change for undo
      // Track deletion for batch save
      setDeletedSectionIds((prev) => [...prev, sectionId]);
      
      // Remove from local state
      setSectionMarkers((prev) => prev.filter((s) => s.id !== sectionId));
      
      // Remove seats that belong to this section
      setSeats((prev) =>
        prev.filter((s) => {
          // Check if seat's sectionId matches (if available) or section name matches
          const seatSectionId = (s.seat as any).sectionId;
          return seatSectionId !== sectionId && s.seat.section !== sectionId;
        }),
      );

      // Clear selected/viewing if they match
      if (selectedSectionMarker?.id === sectionId) {
        setSelectedSectionMarker(null);
      }
      setSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
      if (viewingSection?.id === sectionId) {
        setViewingSection(null);
      }
      
      toast({ title: "Section removed (will be deleted on save)" });
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
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Don't block rendering while loading seats - show the designer and let seats load in the background
  // The useEffect will update seats when they're loaded

  const handleRemoveMainImage = async () => {
    setMainImageUrl(undefined);
    setMainImageFileId(undefined);
    await onRemoveImage?.();
  };

  const handleAlign = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      const seatItems = seats.filter((s) => selectedSeatIds.includes(s.id));
      const sectionItems = sectionMarkers.filter((s) =>
        selectedSectionIds.includes(s.id),
      );
      const allItems = [...seatItems, ...sectionItems];
      if (allItems.length === 0) return;

      // Helper to get shape dimension
      const getShapeWidth = (
        item: (typeof seatItems)[0] | (typeof sectionItems)[0],
      ): number => {
        if (item.shape?.width) return item.shape.width;
        if (item.shape?.radius) return item.shape.radius * 2;
        return 0;
      };
      const getShapeHeight = (
        item: (typeof seatItems)[0] | (typeof sectionItems)[0],
      ): number => {
        if (item.shape?.height) return item.shape.height;
        if (item.shape?.radius) return item.shape.radius * 2;
        return 0;
      };

      // Find the anchor object
      let anchorItem: (typeof seatItems)[0] | (typeof sectionItems)[0] | null =
        null;
      if (anchorSeatId) {
        anchorItem = seatItems.find((s) => s.id === anchorSeatId) || null;
      } else if (anchorSectionId) {
        anchorItem = sectionItems.find((s) => s.id === anchorSectionId) || null;
      }

      // If no anchor, fall back to using min/max of all selected items
      if (!anchorItem) {
        let minLeftEdge = Infinity;
        let maxRightEdge = -Infinity;
        let minX = Infinity;
        let maxX = -Infinity;
        let minTopEdge = Infinity;
        let maxBottomEdge = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        allItems.forEach((item) => {
          const width = getShapeWidth(item);
          const height = getShapeHeight(item);
          const leftEdge = item.x - width / 2;
          const rightEdge = item.x + width / 2;
          const topEdge = item.y - height / 2;
          const bottomEdge = item.y + height / 2;

          minLeftEdge = Math.min(minLeftEdge, leftEdge);
          maxRightEdge = Math.max(maxRightEdge, rightEdge);
          minX = Math.min(minX, item.x);
          maxX = Math.max(maxX, item.x);

          minTopEdge = Math.min(minTopEdge, topEdge);
          maxBottomEdge = Math.max(maxBottomEdge, bottomEdge);
          minY = Math.min(minY, item.y);
          maxY = Math.max(maxY, item.y);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const getNewX = (
          item: (typeof seatItems)[0] | (typeof sectionItems)[0],
        ): number | undefined => {
          if (alignment === "left") {
            const width = getShapeWidth(item);
            return minLeftEdge + width / 2;
          }
          if (alignment === "right") {
            const width = getShapeWidth(item);
            return maxRightEdge - width / 2;
          }
          if (alignment === "center") return centerX;
          return undefined;
        };

        const getNewY = (
          item: (typeof seatItems)[0] | (typeof sectionItems)[0],
        ): number | undefined => {
          if (alignment === "top") {
            const height = getShapeHeight(item);
            return minTopEdge + height / 2;
          }
          if (alignment === "bottom") {
            const height = getShapeHeight(item);
            return maxBottomEdge - height / 2;
          }
          if (alignment === "middle") return centerY;
          return undefined;
        };

        if (seatItems.length > 0) {
          setSeats((prev) =>
            prev.map((s) => {
              if (!selectedSeatIds.includes(s.id)) return s;
              const newX = getNewX(s);
              const newY = getNewY(s);
              return {
                ...s,
                x: newX !== undefined ? newX : s.x,
                y: newY !== undefined ? newY : s.y,
              };
            }),
          );
        }

        if (sectionItems.length > 0) {
          setSectionMarkers((prev) =>
            prev.map((s) => {
              if (!selectedSectionIds.includes(s.id)) return s;
              const newX = getNewX(s);
              const newY = getNewY(s);
              return {
                ...s,
                x: newX !== undefined ? newX : s.x,
                y: newY !== undefined ? newY : s.y,
              };
            }),
          );
        }
        return;
      }

      // Use anchor object as reference
      const anchorWidth = getShapeWidth(anchorItem);
      const anchorHeight = getShapeHeight(anchorItem);
      const anchorLeftEdge = anchorItem.x - anchorWidth / 2;
      const anchorRightEdge = anchorItem.x + anchorWidth / 2;
      const anchorTopEdge = anchorItem.y - anchorHeight / 2;
      const anchorBottomEdge = anchorItem.y + anchorHeight / 2;

      const getNewX = (
        item: (typeof seatItems)[0] | (typeof sectionItems)[0],
      ): number | undefined => {
        // Skip the anchor item itself
        if (item.id === anchorItem!.id) return undefined;

        if (alignment === "left") {
          // Align to anchor's left edge
          const width = getShapeWidth(item);
          return anchorLeftEdge + width / 2;
        }
        if (alignment === "right") {
          // Align to anchor's right edge
          const width = getShapeWidth(item);
          return anchorRightEdge - width / 2;
        }
        if (alignment === "center") return anchorItem!.x;
        return undefined;
      };

      const getNewY = (
        item: (typeof seatItems)[0] | (typeof sectionItems)[0],
      ): number | undefined => {
        // Skip the anchor item itself
        if (item.id === anchorItem!.id) return undefined;

        if (alignment === "top") {
          // Align to anchor's top edge
          const height = getShapeHeight(item);
          return anchorTopEdge + height / 2;
        }
        if (alignment === "bottom") {
          // Align to anchor's bottom edge
          const height = getShapeHeight(item);
          return anchorBottomEdge - height / 2;
        }
        if (alignment === "middle") return anchorItem!.y;
        return undefined;
      };

      if (seatItems.length > 0) {
        setSeats((prev) =>
          prev.map((s) => {
            if (!selectedSeatIds.includes(s.id)) return s;
            const newX = getNewX(s);
            const newY = getNewY(s);
            return {
              ...s,
              x: newX !== undefined ? newX : s.x,
              y: newY !== undefined ? newY : s.y,
            };
          }),
        );
      }

      if (sectionItems.length > 0) {
        setSectionMarkers((prev) =>
          prev.map((s) => {
            if (!selectedSectionIds.includes(s.id)) return s;
            const newX = getNewX(s);
            const newY = getNewY(s);
            return {
              ...s,
              x: newX !== undefined ? newX : s.x,
              y: newY !== undefined ? newY : s.y,
            };
          }),
        );
      }
    },
    [
      seats,
      sectionMarkers,
      selectedSeatIds,
      selectedSectionIds,
      anchorSeatId,
      anchorSectionId,
    ],
  );

  const designerContent = (
    <div
      className={
        isFullscreen ? "flex flex-col flex-1 min-h-0 space-y-4" : "space-y-4"
      }
    >
      {/* Main Designer Content (Header + Canvas) - always visible; canvas shows blank when no image (simple floor) */}
      <div
        className={
          isFullscreen
            ? "flex flex-col flex-1 min-h-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out"
            : "space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out"
        }
      >
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
          isSaving={bulkDesignerSaveMutation.isPending}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleFullscreen}
          mainImageUrl={mainImageUrl}
          isPlacingSeats={isPlacingSeats}
          isPlacingSections={isPlacingSections}
          onClearAllPlacements={handleClearAllPlacements}
          onMainImageSelect={handleMainImageSelect}
          onDetectSections={
            mainImageUrl && designMode === "section-level"
              ? handleDetectSections
              : undefined
          }
          isDetectingSections={isDetectingSections}
          onDetectSeats={
            mainImageUrl && venueType === "small"
              ? handleDetectSeats
              : undefined
          }
          isDetectingSeats={isDetectingSeats}
          onRemoveImage={mainImageUrl ? handleRemoveMainImage : undefined}
          canvasBackgroundColor={canvasBackgroundColor}
          onCanvasBackgroundColorChange={
            !mainImageUrl ? handleCanvasBackgroundColorChange : undefined
          }
          markerFillTransparency={markerFillTransparency}
          onMarkerFillTransparencyChange={
            !readOnly ? handleMarkerFillTransparencyChange : undefined
          }
          snapToGrid={snapToGrid}
          onSnapToGridChange={setSnapToGrid}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          onPreview={() => setShowPreview(true)}
          onUndo={!readOnly ? undo : undefined}
          onRedo={!readOnly ? redo : undefined}
          canUndo={canUndo}
          canRedo={canRedo}
          isDirty={canUndo || deletedSeatIds.length > 0 || deletedSectionIds.length > 0 || sectionMarkers.some(s => s.isNew) || seats.some(s => s.isNew)}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />

        <div
          className={
            isFullscreen
              ? "flex flex-col flex-1 min-h-0 space-y-4"
              : "space-y-4"
          }
        >
          {/* Seat Placement Controls + Shape Toolbox (Small Venue) */}
          {venueType === "small" && (
            <SeatDesignToolbar
              selectedShapeType={selectedShapeTool}
              onShapeTypeSelect={readOnly ? () => {} : handleShapeToolSelect}
              selectedSeat={selectedSeat}
              selectedSection={
                designMode === "section-level" ? selectedSectionMarker : null
              }
              onSeatEdit={handleSeatEdit}
              onSeatView={handleSeatView}
              onSectionEdit={handleSectionEdit}
              onSectionView={
                designMode === "section-level"
                  ? handleOpenSectionDetail
                  : undefined
              }
              onSeatDelete={handleDeleteSeat}
              onSectionDelete={handleDeleteSection}
              onSeatShapeStyleChange={handleSeatShapeStyleChange}
              onSectionShapeStyleChange={handleSectionShapeStyleChange}
              onAlign={handleAlign}
              selectedSeatCount={selectedSeatIds.length}
              selectedSectionCount={selectedSectionIds.length}
              seatPlacement={
                selectedSeatIds.length <= 1
                  ? {
                      form: seatPlacementForm,
                      uniqueSections: getUniqueSections(),
                      sectionsData: effectiveSectionsData,
                      sectionSelectValue,
                      onSectionSelectValueChange: setSectionSelectValue,
                      onNewSection: () => {
                        setIsSectionFormOpen(true);
                        setEditingSectionId(null);
                        sectionForm.reset({ name: "" });
                      },
                      onManageSections: () => setIsManageSectionsOpen(true),
                    }
                  : undefined
              }
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
                    isUpdating={false}
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
                  isEditing={!!editingSectionId}
                  selectedShapeType={selectedShapeTool}
                  onShapeTypeSelect={(type) => {
                    handleShapeToolSelect(type);
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
                  onShapeTypeSelect={readOnly ? () => {} : handleShapeToolSelect}
                  selectedSeat={null}
                  selectedSection={selectedSectionMarker}
                  onSeatEdit={handleSeatEdit}
                  onSeatView={handleSeatView}
                  onSectionEdit={handleSectionEdit}
                  onSectionView={handleOpenSectionDetail}
                  onSeatDelete={handleDeleteSeat}
                  onSectionDelete={handleDeleteSection}
                  onSeatShapeStyleChange={handleSeatShapeStyleChange}
                  onSectionShapeStyleChange={handleSectionShapeStyleChange}
                  onAlign={handleAlign}
                  selectedSeatCount={0}
                  selectedSectionCount={selectedSectionIds.length}
                  readOnly={readOnly}
                />
              )}
            </>
          )}

          {/* Canvas Container - Seat-level uses SeatDesignCanvas, section-level uses LayoutCanvas */}
          {venueType === "small" ? (
            <div
              className={
                isFullscreen ? "flex-1 min-h-0 flex flex-col" : undefined
              }
              style={isFullscreen ? { minHeight: 400 } : undefined}
            >
              <SeatDesignCanvas
                imageUrl={mainImageUrl}
                canvasBackgroundColor={canvasBackgroundColor}
                containerRef={containerRef}
                dimensionsReady={dimensionsReady}
                containerDimensions={containerDimensions}
                containerStyle={isFullscreen ? "flex" : "fixed"}
                seats={displayedSeats}
                selectedSeatId={selectedSeat?.id ?? null}
                selectedSeatIds={selectedSeatIds}
                anchorSeatId={anchorSeatId}
                anchorSectionId={anchorSectionId}
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
                onMarkersInRect={handleMarkersInRect}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                selectedShapeTool={selectedShapeTool}
                shapeOverlays={displayedShapeOverlays}
                selectedOverlayId={selectedOverlayId}
                showGrid={showGrid}
                gridSize={gridSize}
              />
            </div>
          ) : (
            <div
              ref={containerRef}
              className={`relative border rounded-lg overflow-hidden select-none w-full transition-colors ${
                mainImageUrl ? "bg-gray-100" : ""
              } ${dragOverActive ? "ring-2 ring-primary bg-primary/5" : ""} ${isFullscreen ? "flex-1 min-h-0" : ""}`}
              style={{
                height: isFullscreen ? undefined : "600px",
                ...(isFullscreen ? { minHeight: 400 } : {}),
                width: "100%",
                touchAction: "none",
                overscrollBehavior: "contain",
                // Image has priority: use canvas background color only when there is no floor plan image
                ...(mainImageUrl
                  ? {}
                  : { backgroundColor: canvasBackgroundColor }),
              }}
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
            >
              {dimensionsReady ? (
                <LayoutCanvas
                  imageUrl={mainImageUrl}
                  canvasBackgroundColor={canvasBackgroundColor}
                  seats={[]}
                  sections={sectionMarkers}
                  selectedSeatId={null}
                  selectedSectionId={selectedSectionMarker?.id || null}
                  selectedSeatIds={[]}
                  selectedSectionIds={selectedSectionIds}
                  anchorSeatId={anchorSeatId}
                  anchorSectionId={anchorSectionId}
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
                  onSectionDoubleClick={handleOpenSectionDetail}
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
        createSectionMutationPending={false}
        updateSectionMutationPending={false}
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
        isDeleting={false}
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
    </div>
  );

  if (!venueId) {
    return <div className="p-4 text-destructive">Venue ID is required</div>;
  }
  if (!layoutId) {
    return <div className="p-4 text-destructive">Layout ID is required</div>;
  }

  // Section-level drill-down: show section detail view (after all hooks so hook count is stable)
  if (venueType === "large" && viewingSection) {
    const sectionDetailContent = (
      <SectionDetailView
        viewingSection={viewingSection}
        className={
          isFullscreen
            ? `${className || ""} flex-1 min-h-0 flex flex-col`.trim()
            : className
        }
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
          setZoomLevel(1);
          setPanOffset({ x: 0, y: 0 });
        }}
        onSave={handleSave}
        onClearSectionSeats={handleClearSectionSeats}
        onSectionImageSelect={handleSectionImageSelect}
        onRemoveSectionImage={handleRemoveSectionImage}
        onSeatClick={handleSeatClick}
        selectedSeatIds={selectedSeatIds}
        anchorSeatId={anchorSeatId}
        onSeatDragEnd={handleKonvaSeatDragEnd}
        onSeatShapeTransform={handleSeatShapeTransform}
        onSeatShapeStyleChange={handleSeatShapeStyleChange}
        onImageClick={handleKonvaImageClick}
        onDeselect={handleDeselect}
        onWheel={handleKonvaWheel}
        onPan={handlePan}
        onMarkersInRect={handleMarkersInRect}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onNewSection={() => {
          setViewingSection(null);
          setIsSectionCreationPending(true);
          setEditingSectionId(null);
        }}
        saveSeatsMutationPending={bulkDesignerSaveMutation.isPending}
        seats={seats}
        onDeleteSeat={handleDeleteSeat}
        onSetViewingSeat={setViewingSeat}
        onEditSeat={handleSeatEdit}
        onSetSelectedSeat={setSelectedSeat}
        seatEditFormReset={seatEditForm.reset}
        placementShape={placementShape}
        onPlacementShapeChange={setPlacementShape}
        selectedShapeTool={selectedShapeTool}
        onShapeToolSelect={handleShapeToolSelect}
        onShapeDraw={handleShapeDraw}
        shapeOverlays={shapeOverlays}
        selectedOverlayId={selectedOverlayId}
        onShapeOverlayClick={handleShapeOverlayClick}
        onDetectSeats={handleDetectSeats}
        isDetectingSeats={isDetectingSeats}
        onAlign={handleAlign}
        canvasBackgroundColor={canvasBackgroundColor}
        onCanvasBackgroundColorChange={handleSectionCanvasBackgroundColorChange}
        markerFillTransparency={viewingSection?.markerFillTransparency ?? markerFillTransparency}
        onMarkerFillTransparencyChange={!readOnly ? handleSectionMarkerFillTransparencyChange : undefined}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleFullscreen}
        showGrid={showGrid}
        gridSize={gridSize}
        onUndo={!readOnly ? undo : undefined}
        onRedo={!readOnly ? redo : undefined}
        canUndo={canUndo}
        canRedo={canRedo}
        isDirty={canUndo || deletedSeatIds.length > 0 || deletedSectionIds.length > 0 || sectionMarkers.some(s => s.isNew) || seats.some(s => s.isNew)}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
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
              isUpdating={false}
              standalone
            />
          ) : undefined
        }
      />
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
              {sectionDetailContent}
            </div>
          ) : (
            sectionDetailContent
          )}
        </div>
        <SeatEditSheet
          viewingSeat={viewingSeat}
          isOpen={!!viewingSeat}
          onOpenChange={(open) => {
            if (!open) setViewingSeat(null);
          }}
          isPlacingSeats={isPlacingSeats}
          isDeleting={false}
          onEdit={() => viewingSeat && handleSeatEdit(viewingSeat)}
          onDelete={() => {
            if (viewingSeat) {
              handleDeleteSeat(viewingSeat);
              setViewingSeat(null);
            }
          }}
        />
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
            loading: bulkDesignerSaveMutation.isPending,
          }}
          cancelAction={{
            label: "Cancel",
            onClick: () => setShowSaveConfirmDialog(false),
          }}
        />
      </>
    );
  }

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
          loading: bulkDesignerSaveMutation.isPending,
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
          isDeleting={false}
          form={sectionForm}
          editingSectionId={editingSectionId}
          isUpdating={false}
          onSave={handleSaveSectionForm}
          onCancelEdit={handleCancelEditSection}
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
        isCreating={false}
        isUpdating={false}
        onSave={handleSaveSectionForm}
        onCancel={handleCancelSectionForm}
      />

      {/* Layout Preview Dialog - Shows how layout appears during booking */}
      <LayoutPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        layout={
          {
            id: layoutId,
            name: layoutName || "Layout",
            image_url: mainImageUrl,
            canvas_background_color: canvasBackgroundColor,
            design_mode: designMode,
            marker_fill_transparency: markerFillTransparency,
          } as unknown as import("../../layouts/types").Layout
        }
        layoutSeats={(venueType === "large" && viewingSection
          ? displayedSeats
          : seats
        ).map(
          (marker) =>
            ({
              id: marker.id,
              layout_id: layoutId,
              section_id: marker.seat.sectionId || "",
              section_name: marker.seat.section,
              row: marker.seat.row,
              seat_number: marker.seat.seatNumber,
              seat_type: marker.seat.seatType,
              x_coordinate: marker.x,
              y_coordinate: marker.y,
              shape: marker.shape ? JSON.stringify(marker.shape) : undefined,
            }) as unknown as import("../../seats/types").Seat,
        )}
        sections={sectionMarkers.map(
          (marker) =>
            ({
              id: marker.id,
              layout_id: layoutId,
              name: marker.name,
              x_coordinate: marker.x,
              y_coordinate: marker.y,
              image_url: marker.imageUrl,
              canvas_background_color: marker.canvasBackgroundColor,
              shape: marker.shape ? JSON.stringify(marker.shape) : undefined,
            }) as unknown as import("../../layouts/types").Section,
        )}
        imageUrl={
          venueType === "large" && viewingSection
            ? viewingSection.imageUrl || mainImageUrl
            : mainImageUrl
        }
      />
    </>
  );
}
