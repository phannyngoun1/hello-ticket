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
} from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@truths/ui";
import {
  Trash2,
  Save,
  Maximize,
  Minimize,
  MoreVertical,
  Image as ImageIcon,
  List,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seatService } from "../seat-service";
import { sectionService } from "../../sections/section-service";
import { SeatType } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadService } from "@truths/shared";
import { ConfirmationDialog } from "@truths/custom-ui";
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
  SeatPlacementControls,
  SectionPlacementControls,
  SectionDetailView,
  DatasheetView,
  SelectedSectionSheet,
  ManageSectionsSheet,
  ShapeSelector,
  ShapeToolbox,
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
  const [isEditingViewingSeat, setIsEditingViewingSeat] = useState(false);

  // Copy/paste state
  const [copiedSeat, setCopiedSeat] = useState<SeatMarker | null>(null);
  const [copiedSection, setCopiedSection] = useState<SectionMarker | null>(null);

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
  const [sectionToDelete, setSectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmDeleteWithSeats, setConfirmDeleteWithSeats] = useState(false);

  // Debounce timers for shape updates to prevent rate limiting
  const seatShapeUpdateTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
    }>
  >([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
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

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [dimensionsReady]);

  // Load existing sections when initialSections provided
  useEffect(() => {
    if (initialSections && designMode === "section-level") {
      console.log("Loading sections from initialSections:", initialSections);
      const markers: SectionMarker[] = initialSections.map((section) => {
        console.log("Processing initialSection:", section.id, "shape value:", section.shape, "type:", typeof section.shape, "has shape prop:", "shape" in section);
        let shape: PlacementShape | undefined;
        if ("shape" in section && section.shape) {
          try {
            const parsed = JSON.parse(section.shape);
            console.log("Parsed shape JSON from initialSections:", parsed);
            // Normalize the type to ensure it matches the enum
            if (parsed && typeof parsed === 'object' && parsed.type) {
              shape = {
                ...parsed,
                type: parsed.type as PlacementShapeType,
              };
              console.log("Normalized shape from initialSections:", shape, "Type:", shape.type);
            } else {
              console.warn("Parsed shape is invalid from initialSections:", parsed);
            }
          } catch (e) {
            console.error("Failed to parse section shape from initialSections:", e, "Raw shape string:", section.shape);
          }
        } else {
          console.log("Section from initialSections has no shape or shape is falsy:", { id: section.id, name: section.name, shape: section.shape, hasShapeProp: "shape" in section });
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
      console.log("Section markers created from initialSections:", markers.map(m => ({ id: m.id, name: m.name, hasShape: !!m.shape, shapeType: m.shape?.type, shape: m.shape })));
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
        console.log("Processing section:", section.id, "shape value:", section.shape, "type:", typeof section.shape, "isTruthy:", !!section.shape);
        let shape: PlacementShape | undefined;
        if (section.shape) {
          try {
            const parsed = JSON.parse(section.shape);
            console.log("Parsed shape JSON:", parsed);
            // Normalize the type to ensure it matches the enum
            if (parsed && typeof parsed === 'object' && parsed.type) {
              shape = {
                ...parsed,
                type: parsed.type as PlacementShapeType,
              };
              console.log("Normalized shape:", shape, "Type:", shape.type);
            } else {
              console.warn("Parsed shape is invalid:", parsed);
            }
          } catch (e) {
            console.error("Failed to parse section shape:", e, "Raw shape string:", section.shape);
          }
        } else {
          console.log("Section has no shape property or shape is falsy. Section:", { id: section.id, name: section.name, shape: section.shape });
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
      console.log("Section markers created from sectionsData:", markers.map(m => ({ id: m.id, name: m.name, hasShape: !!m.shape, shapeType: m.shape?.type, shape: m.shape })));
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
          console.log("Processing initialSeat:", seat.id, "shape value:", seat.shape, "type:", typeof seat.shape, "has shape prop:", "shape" in seat);
          // Parse shape from JSON string if available
          let shape: PlacementShape | undefined;
          if ("shape" in seat && seat.shape) {
            try {
              const parsed = JSON.parse(seat.shape);
              console.log("Parsed seat shape JSON from initialSeats:", parsed);
              // Normalize the type to ensure it matches the enum
              if (parsed && typeof parsed === 'object' && parsed.type) {
                shape = {
                  ...parsed,
                  type: parsed.type as PlacementShapeType,
                };
                console.log("Normalized seat shape from initialSeats:", shape, "Type:", shape.type);
              } else {
                console.warn("Parsed seat shape is invalid from initialSeats:", parsed);
              }
            } catch (e) {
              console.error("Failed to parse seat shape from initialSeats:", e, "Raw shape string:", seat.shape);
            }
          } else {
            console.log("Seat from initialSeats has no shape or shape is falsy:", { id: seat.id, shape: seat.shape, hasShapeProp: "shape" in seat });
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
        console.log("Seat markers created from initialSeats:", markers.map(m => ({ id: m.id, hasShape: !!m.shape, shapeType: m.shape?.type, shape: m.shape })));
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
          console.log("Processing existingSeat:", seat.id, "shape value:", seat.shape, "type:", typeof seat.shape);
          // Parse shape from JSON string if available
          let shape: PlacementShape | undefined;
          if (seat.shape) {
            try {
              const parsed = JSON.parse(seat.shape);
              console.log("Parsed seat shape JSON from existingSeats:", parsed);
              // Normalize the type to ensure it matches the enum
              if (parsed && typeof parsed === 'object' && parsed.type) {
                shape = {
                  ...parsed,
                  type: parsed.type as PlacementShapeType,
                };
                console.log("Normalized seat shape from existingSeats:", shape, "Type:", shape.type);
              } else {
                console.warn("Parsed seat shape is invalid from existingSeats:", parsed);
              }
            } catch (e) {
              console.error("Failed to parse seat shape from existingSeats:", e, "Raw shape string:", seat.shape);
            }
          } else {
            console.log("Seat from existingSeats has no shape or shape is falsy:", { id: seat.id, shape: seat.shape });
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
        console.log("Seat markers created from existingSeats:", markers.map(m => ({ id: m.id, hasShape: !!m.shape, shapeType: m.shape?.type, shape: m.shape })));
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
        // Try to get section from sectionsData first (has real coordinates), otherwise use sectionMarkers
        const sectionFromData = sectionsData?.find((s) => s.id === sectionId);
        const sectionFromMarkers = sectionMarkers.find(
          (s) => s.id === sectionId
        );

        if (sectionFromData || sectionFromMarkers) {
          const section = sectionFromData || sectionFromMarkers;
          if (!section) {
            throw new Error("Section not found");
          }
          await sectionService.update(sectionId, {
            name: section.name,
            x_coordinate: sectionFromData
              ? (sectionFromData.x_coordinate ?? undefined)
              : sectionFromMarkers?.x,
            y_coordinate: sectionFromData
              ? (sectionFromData.y_coordinate ?? undefined)
              : sectionFromMarkers?.y,
            file_id: response.id, // Save the file_id
          });

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
          // Store coordinates and open section form
          setPendingSectionCoordinates({ x: clampedX, y: clampedY });
          // Store shape to apply after section is created
          setPlacementShape(finalShape);
          setIsSectionFormOpen(true);
          setEditingSectionId(null);
          sectionForm.reset({ name: "" });
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
        setIsSectionFormOpen(true);
        setEditingSectionId(null);
        sectionForm.reset({ name: "" });
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

      // If a shape tool is selected, shapes should be created via drag-to-draw (handleShapeDraw)
      // This click handler should not create markers when shape tools are active
      // This prevents duplicate markers from being created and ensures all shapes behave the same
      // All shapes (rectangle, circle, ellipse, polygon, freeform) use the same drag-to-draw behavior
      if (selectedShapeTool) {
        return; // Shape tools use drag-to-draw, not click-to-place
      }

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
      // Main floor - place sections (open form to get name first)
      else if (venueType === "large" && isPlacingSections) {
        // Store the coordinates where user clicked
        setPendingSectionCoordinates({ x, y });
        // Open section form to get the name
        setIsSectionFormOpen(true);
        setEditingSectionId(null);
        sectionForm.reset({ name: "" });
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
            seatService.updateCoordinates(seatId, seat.x, seat.y, shape).catch((error) => {
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
        // Update seat placement form with section name
        seatPlacementForm.setValue("section", section.name);
        setSelectedSectionMarker(null);
        // Reset zoom when switching sections
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      } else {
        // Regular click: select for resizing/moving
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

  // Handle seat marker click - only select, don't open sheet
  const handleSeatClick = (seat: SeatMarker) => {
    // Just select the seat for transform controls, don't open the sheet
    setSelectedSeat(seat);
    // Don't set viewingSeat - this prevents the sheet from opening
  };

  // Handle seat view from toolbox - opens the seat sheet in view mode
  const handleSeatView = (seat: SeatMarker) => {
    setViewingSeat(seat);
    setIsEditingViewingSeat(false);
  };

  // Handle seat edit from toolbox - opens the seat data sheet in edit mode
  const handleSeatEdit = (seat: SeatMarker) => {
    setViewingSeat(seat);
    setIsEditingViewingSeat(true);
    seatEditForm.reset();
  };

  // Handle section view from toolbox - opens the section sheet
  const handleSectionView = (section: SectionMarker) => {
    setSelectedSectionMarker(section);
    setIsSelectedSectionSheetOpen(true);
  };

  // Handle section edit from toolbox - opens the section form
  const handleSectionEdit = (section: SectionMarker) => {
    handleEditSectionFromSheet(section);
  };

  // Handle deselection - clear all selections when clicking on empty space
  const handleDeselect = () => {
    setSelectedSeat(null);
    setSelectedSectionMarker(null);
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

  // Sync seat edit form when viewingSeat changes (only when entering edit mode)
  useEffect(() => {
    if (viewingSeat && isEditingViewingSeat) {
      seatEditForm.reset({
        section: viewingSeat.seat.section,
        sectionId: viewingSeat.seat.sectionId,
        row: viewingSeat.seat.row,
        seatNumber: viewingSeat.seat.seatNumber,
        seatType: viewingSeat.seat.seatType,
      });
    }
  }, [viewingSeat?.id, isEditingViewingSeat]);

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
    }) => {
      console.log("createSectionMutation.mutationFn called with:", input);
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
    onSuccess: (section) => {
      // Always update seat placement form with the new section name and ID
      seatPlacementForm.setValue("section", section.name);
      seatPlacementForm.setValue("sectionId", section.id);

      // Only update sectionMarkers in section-level mode
      if (designMode === "section-level") {
        // Use pending coordinates if available (from canvas click), otherwise use default
        const coordinates = pendingSectionCoordinates || {
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
        };

        // Parse shape from API response if available, otherwise use placementShape
        let shape: PlacementShape | undefined = placementShape;
        if (section.shape) {
          try {
            const parsed = JSON.parse(section.shape);
            // Normalize the type to ensure it matches the enum
            if (parsed && typeof parsed === 'object' && parsed.type) {
              shape = {
                ...parsed,
                type: parsed.type as PlacementShapeType,
              };
              console.log("Parsed shape from API:", shape, "Type:", shape.type);
            } else {
              shape = placementShape; // Fallback to placementShape if invalid
            }
          } catch (e) {
            console.error("Failed to parse section shape from API:", e);
            shape = placementShape; // Fallback to placementShape
          }
        }

        const newSectionMarker: SectionMarker = {
          id: section.id,
          name: section.name,
          x: coordinates.x,
          y: coordinates.y,
          imageUrl: section.image_url || undefined,
          isNew: false,
          shape, // Use parsed shape from API or placementShape
        };
        setSectionMarkers((prev) => [...prev, newSectionMarker]);
        // Clear placement shape after use
        setPlacementShape({
          type: PlacementShapeType.CIRCLE,
          radius: 1.2,
        });
        // Don't auto-select the new section to avoid opening the Selected Section sheet
        // setSelectedSectionMarker(newSectionMarker);
      }

      // Clear pending coordinates after use
      setPendingSectionCoordinates(null);

      setIsSectionFormOpen(false);
      setEditingSectionId(null);
      sectionForm.reset({ name: "" });
      toast({ title: "Section created successfully" });
      // Invalidate sections query
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
          if (parsed && typeof parsed === 'object' && parsed.type) {
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
          seatPlacementForm.setValue("seatNumber", String(parseInt(nextSeatNumber) + 1));
          return;
        }
        
        // Paste section
        if (copiedSection && designMode === "section-level" && venueType === "large") {
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
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
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
        // Update existing section (section-level mode)
        updateSectionMutation.mutate({
          sectionId: editingSectionId,
          name,
          x: sectionFromMarkers.x,
          y: sectionFromMarkers.y,
          shape: sectionFromMarkers.shape,
        });
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
      setIsEditingViewingSeat(false);
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
          const originalSection = sectionsData?.find((s) => s.id === section.id);
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

  // Delete section handler (with confirmation)
  const handleDeleteSection = (
    section: SectionMarker | { id: string; name: string }
  ) => {
    setSectionToDelete(section);
    setConfirmDeleteWithSeats(false); // Reset checkbox when opening dialog
  };

  const handleConfirmDeleteSection = () => {
    if (sectionToDelete) {
      deleteSectionMutation.mutate(sectionToDelete.id);
      setSectionToDelete(null);
      setConfirmDeleteWithSeats(false);
    }
  };

  // Count seats for the section to be deleted
  const getSectionSeatCount = (sectionId: string, sectionName: string) => {
    return seats.filter((s) => {
      const seatSectionId = (s.seat as any).sectionId;
      return (
        seatSectionId === sectionId ||
        s.seat.section === sectionId ||
        s.seat.section === sectionName
      );
    }).length;
  };

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
          onImageClick={handleKonvaImageClick}
          onDeselect={handleDeselect}
          onWheel={handleKonvaWheel}
          onPan={handlePan}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onNewSection={() => {
            setIsSectionFormOpen(true);
            setEditingSectionId(null);
            sectionForm.reset({ name: "" });
          }}
          saveSeatsMutationPending={saveSeatsMutation.isPending}
          seats={seats}
          onDeleteSeat={handleDeleteSeat}
          onSetViewingSeat={setViewingSeat}
          onSetIsEditingViewingSeat={setIsEditingViewingSeat}
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
        />
        {/* Seat Edit Sheet - needed for section detail view */}
        <SeatEditSheet
          viewingSeat={viewingSeat}
          isOpen={!!viewingSeat}
          onOpenChange={(open) => {
            if (!open) {
              setViewingSeat(null);
              setIsEditingViewingSeat(false);
            }
          }}
          isEditing={isEditingViewingSeat}
          isPlacingSeats={isPlacingSeats}
          form={seatEditForm}
          uniqueSections={getUniqueSections()}
          sectionsData={sectionsData}
          sectionMarkers={sectionMarkers}
          designMode={designMode}
          isUpdating={updateSeatMutation.isPending}
          isDeleting={deleteSeatMutation.isPending}
          onEdit={() => {
            if (viewingSeat) {
              setIsEditingViewingSeat(true);
              seatEditForm.reset({
                section: viewingSeat.seat.section,
                sectionId: viewingSeat.seat.sectionId,
                row: viewingSeat.seat.row,
                seatNumber: viewingSeat.seat.seatNumber,
                seatType: viewingSeat.seat.seatType,
              });
            }
          }}
          onSave={(data) => {
            if (viewingSeat && !viewingSeat.isNew) {
              updateSeatMutation.mutate({
                seatId: viewingSeat.id,
                data,
              });
            } else if (viewingSeat && viewingSeat.isNew) {
              // Update local state for new seats
              setSeats((prev) =>
                prev.map((s) =>
                  s.id === viewingSeat.id ? { ...s, seat: data } : s
                )
              );
              setViewingSeat(null);
              setIsEditingViewingSeat(false);
              seatEditForm.reset();
            }
          }}
          onCancel={() => {
            setViewingSeat(null);
            setIsEditingViewingSeat(false);
            seatEditForm.reset();
          }}
          onDelete={() => {
            if (viewingSeat) {
              handleDeleteSeat(viewingSeat);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {layoutName ? `Designer - ${layoutName}` : "Seat Designer"}
          </h3>
          {isLoading && (
            <span className="text-xs text-muted-foreground">
              Loading seats...
            </span>
          )}
          {seatsError && (
            <span className="text-xs text-destructive">
              Error loading seats
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {/* Datasheet Toggle Button */}
          {((venueType === "large" && sectionMarkers.length > 0) ||
            (venueType === "small" && seats.length > 0) ||
            (viewingSection && displayedSeats.length > 0)) && (
            <Button
              variant="outline"
              onClick={() => setIsDatasheetOpen(true)}
              size="sm"
              className="h-7 w-7 p-0"
              title="View Datasheet"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          )}
          {!readOnly && (
            <Button
              onClick={handleSave}
              disabled={saveSeatsMutation.isPending}
              size="sm"
              className="h-7 px-2"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleFullscreen}
            size="sm"
            className="h-7 w-7 p-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-3.5 w-3.5" />
            ) : (
              <Maximize className="h-3.5 w-3.5" />
            )}
          </Button>
          {mainImageUrl &&
            !readOnly &&
            (isPlacingSeats ||
              (venueType === "large" && isPlacingSections)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleClearAllPlacements}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Placements
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Label htmlFor="change-main-image" className="cursor-pointer">
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      asChild
                    >
                      <div>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Change Image
                        <Input
                          id="change-main-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handleMainImageSelect(e);
                            e.target.value = ""; // Reset input
                          }}
                          className="hidden"
                        />
                      </div>
                    </DropdownMenuItem>
                  </Label>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </div>

      {/* Main Image Upload */}
      {!mainImageUrl && (
        <ImageUploadCard
          id="main-image-upload"
          label={`Upload ${designMode === "seat-level" ? "Venue" : "Main"} Floor Plan Image`}
          isUploading={isUploadingImage}
          onFileSelect={handleMainImageSelect}
        />
      )}

      {/* Main Floor Plan Image */}
      {mainImageUrl && (
        <div className="space-y-4">
          {/* Seat Placement Controls Panel - On Top (Small Venue) */}
          {venueType === "small" && (
            <>
              {!readOnly && (
                <SeatPlacementControls
                  form={seatPlacementForm}
                  uniqueSections={getUniqueSections()}
                  sectionsData={sectionsData}
                  sectionSelectValue={sectionSelectValue}
                  onSectionSelectValueChange={setSectionSelectValue}
                  onNewSection={() => {
                    setIsSectionFormOpen(true);
                    setEditingSectionId(null);
                    sectionForm.reset({ name: "" });
                  }}
                  onManageSections={() => setIsManageSectionsOpen(true)}
                />
              )}
              <ShapeToolbox
                selectedShapeType={selectedShapeTool}
                onShapeTypeSelect={readOnly ? undefined : setSelectedShapeTool}
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
                readOnly={readOnly}
              />
            </>
          )}

          {/* Section Placement Controls Panel - On Top (Large Venue / Section-Level) */}
          {venueType === "large" && !viewingSection && (
            <>
              <ShapeToolbox
                selectedShapeType={selectedShapeTool}
                onShapeTypeSelect={readOnly ? undefined : setSelectedShapeTool}
                selectedSeat={null}
                selectedSection={selectedSectionMarker}
                onSeatEdit={handleSeatEdit}
                onSeatView={handleSeatView}
                onSectionEdit={handleSectionEdit}
                onSectionView={handleSectionView}
                onSeatDelete={handleDeleteSeat}
                onSectionDelete={handleDeleteSection}
                readOnly={readOnly}
              />
            </>
          )}

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="relative border rounded-lg overflow-hidden bg-gray-100 flex-1"
            style={{
              minHeight: "600px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {dimensionsReady ? (
              <LayoutCanvas
                imageUrl={mainImageUrl}
                seats={venueType === "small" ? displayedSeats : []}
                sections={venueType === "large" ? sectionMarkers : []}
                selectedSeatId={selectedSeat?.id || null}
                selectedSectionId={selectedSectionMarker?.id || null}
                isPlacingSeats={venueType === "small" && isPlacingSeats}
                isPlacingSections={venueType === "large" && isPlacingSections}
                readOnly={readOnly}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                onSeatClick={handleSeatClick}
                onSectionClick={handleKonvaSectionClick}
                onSectionDragEnd={handleKonvaSectionDragEnd}
                onSeatDragEnd={handleKonvaSeatDragEnd}
                onSeatShapeTransform={handleSeatShapeTransform}
                onSectionShapeTransform={handleSectionShapeTransform}
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
                shapeOverlays={shapeOverlays}
                selectedOverlayId={selectedOverlayId}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full py-12 text-muted-foreground">
                Initializing canvas...
              </div>
            )}
            {/* Zoom Controls */}
            <ZoomControls
              zoomLevel={zoomLevel}
              panOffset={panOffset}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
            />
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
        onSetIsEditingViewingSeat={setIsEditingViewingSeat}
        onSetSelectedSeat={setSelectedSeat}
        onSetIsDatasheetOpen={setIsDatasheetOpen}
        seatEditFormReset={seatEditForm.reset}
      />

      {/* Seat View Sheet - View/Delete/Edit seat */}
      <SeatEditSheet
        viewingSeat={viewingSeat}
        isOpen={!!viewingSeat}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSeat(null);
            setSelectedSeat(null);
            setIsEditingViewingSeat(false);
            seatEditForm.reset();
          }
        }}
        isEditing={isEditingViewingSeat}
        isPlacingSeats={isPlacingSeats}
        form={seatEditForm}
        uniqueSections={getUniqueSections()}
        sectionsData={sectionsData}
        sectionMarkers={sectionMarkers}
        designMode={designMode}
        isUpdating={updateSeatMutation.isPending}
        isDeleting={deleteSeatMutation.isPending}
        onEdit={() => {
          if (viewingSeat) {
            setIsEditingViewingSeat(true);
            seatEditForm.reset({
              section: viewingSeat.seat.section,
              sectionId: viewingSeat.seat.sectionId,
              row: viewingSeat.seat.row,
              seatNumber: viewingSeat.seat.seatNumber,
              seatType: viewingSeat.seat.seatType,
            });
          }
        }}
        onSave={(data) => {
          if (viewingSeat && !viewingSeat.isNew) {
            updateSeatMutation.mutate({
              seatId: viewingSeat.id,
              data,
            });
          } else if (viewingSeat && viewingSeat.isNew) {
            // Update local state for new seats
            setSeats((prev) =>
              prev.map((s) =>
                s.id === viewingSeat.id ? { ...s, seat: data } : s
              )
            );
            setViewingSeat(null);
            setSelectedSeat(null);
            setIsEditingViewingSeat(false);
            seatEditForm.reset();
          }
        }}
        onCancel={() => {
          setViewingSeat(null);
          setIsEditingViewingSeat(false);
          seatEditForm.reset();
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

      {/* Delete Section Confirmation Dialog */}
      <ConfirmationDialog
        open={!!sectionToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setSectionToDelete(null);
            setConfirmDeleteWithSeats(false);
          }
        }}
        title="Delete Section"
        description={
          sectionToDelete ? (
            <div className="space-y-3">
              <p>
                Are you sure you want to delete "{sectionToDelete.name}"? This
                action cannot be undone.
              </p>
              {(() => {
                const seatCount = getSectionSeatCount(
                  sectionToDelete.id,
                  sectionToDelete.name
                );
                if (seatCount > 0) {
                  return (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-destructive font-medium">
                        ⚠️ Warning: This section contains {seatCount} seat
                        {seatCount === 1 ? "" : "s"}.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Deleting this section will permanently remove all{" "}
                        {seatCount} seat{seatCount === 1 ? "" : "s"} associated
                        with it.
                      </p>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="confirm-delete-with-seats"
                          checked={confirmDeleteWithSeats}
                          onCheckedChange={(checked) =>
                            setConfirmDeleteWithSeats(checked === true)
                          }
                        />
                        <Label
                          htmlFor="confirm-delete-with-seats"
                          className="text-sm font-normal cursor-pointer"
                        >
                          I understand that {seatCount} seat
                          {seatCount === 1 ? "" : "s"} will be permanently
                          deleted
                        </Label>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            ""
          )
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: handleConfirmDeleteSection,
          loading: deleteSectionMutation.isPending,
          disabled: sectionToDelete
            ? (() => {
                const seatCount = getSectionSeatCount(
                  sectionToDelete.id,
                  sectionToDelete.name
                );
                return seatCount > 0 && !confirmDeleteWithSeats;
              })()
            : false,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => {
            setSectionToDelete(null);
            setConfirmDeleteWithSeats(false);
          },
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
            sectionForm.reset({ name: "" });
            setIsSectionFormOpen(true);
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
