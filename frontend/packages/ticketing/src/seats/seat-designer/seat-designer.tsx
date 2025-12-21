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
} from "./components";

// Import types from the seat-designer folder
import type {
  SeatDesignerProps,
  SectionMarker,
  SeatInfo,
  SeatMarker,
} from "./types";
export type { SeatDesignerProps, SectionMarker, SeatInfo, SeatMarker };

export function SeatDesigner({
  venueId,
  layoutId,
  layoutName,
  imageUrl: initialImageUrl,
  designMode = "seat-level", // Design mode from layout (defaults to seat-level for backward compatibility)
  initialSeats,
  initialSections,
  onImageUpload,
  className,
  fileId: initialFileId,
}: SeatDesignerProps & { fileId?: string }) {
  // Keep old venueType for backward compatibility (can be removed later)
  const venueType = designMode === "seat-level" ? "small" : "large";

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
  // Always in placement mode - simplified
  const isPlacingSections = true;
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  // Store coordinates when clicking to place a section (pending section creation)
  const [pendingSectionCoordinates, setPendingSectionCoordinates] =
    useState<{ x: number; y: number } | null>(null);

  // Section Form
  const sectionForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
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
  }, [designMode, isLoading, sectionMarkers.length, initialSections, sectionsData]);

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
      const markers: SectionMarker[] = initialSections.map((section) => ({
        id: section.id,
        name: section.name,
        x: section.x_coordinate || 50,
        y: section.y_coordinate || 50,
        imageUrl: section.image_url || undefined,
        isNew: false,
      }));
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
      const markers: SectionMarker[] = sectionsData.map((section) => ({
        id: section.id,
        name: section.name,
        x: section.x_coordinate || 50,
        y: section.y_coordinate || 50,
        imageUrl: section.image_url || undefined,
        isNew: false,
      }));
      setSectionMarkers(markers);
    }
  }, [sectionsData, initialSections, designMode]);

  // Load existing seats when fetched or when initialSeats provided
  useEffect(() => {
    // If initialSeats is provided, use it directly (from combined endpoint)
    if (initialSeats) {
      if (initialSeats.length > 0) {
        const markers: SeatMarker[] = initialSeats.map((seat) => ({
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
        }));
        setSeats(markers);
      } else {
        // Layout exists but has no seats yet - start with empty array
        setSeats([]);
      }
    } else if (existingSeats) {
      // Fallback to query result if initialSeats not provided
      if (existingSeats.items && existingSeats.items.length > 0) {
        const markers: SeatMarker[] = existingSeats.items.map((seat) => ({
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
        }));
        setSeats(markers);
      } else {
        // Layout exists but has no seats yet - start with empty array
        setSeats([]);
      }
    } else if (!isLoading && !seatsError && !initialSeats) {
      // Query completed but no data - reset seats (only if not using initialSeats)
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
        const sectionFromMarkers = sectionMarkers.find((s) => s.id === sectionId);
        
        if (sectionFromData || sectionFromMarkers) {
          const section = sectionFromData || sectionFromMarkers;
          await sectionService.update(sectionId, {
            name: section.name,
            x_coordinate: sectionFromData ? sectionFromData.x_coordinate : sectionFromMarkers?.x,
            y_coordinate: sectionFromData ? sectionFromData.y_coordinate : sectionFromMarkers?.y,
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

  // Handle Konva image click - uses percentage coordinates from LayoutCanvas
  const handleKonvaImageClick = useCallback(
    (
      _e: Konva.KonvaEventObject<MouseEvent>,
      percentageCoords?: { x: number; y: number }
    ) => {
      if (!percentageCoords) return;

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

  // Handle section click from Konva
  const handleKonvaSectionClick = useCallback((section: SectionMarker) => {
    // Select for editing
    setSelectedSectionMarker(section);
  }, []);

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

  // Handle seat marker click
  const handleSeatClick = (seat: SeatMarker) => {
    // Show seat details in Sheet for viewing/editing/deleting
    setSelectedSeat(seat);
    setViewingSeat(seat);
    setIsEditingViewingSeat(false);
    seatEditForm.reset();
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
    mutationFn: async (input: { name: string; x?: number; y?: number }) => {
      console.log("createSectionMutation.mutationFn called with:", input);
      const result = await sectionService.create({
        layout_id: layoutId,
        name: input.name,
        x_coordinate: input.x,
        y_coordinate: input.y,
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
        
        const newSectionMarker: SectionMarker = {
          id: section.id,
          name: section.name,
          x: coordinates.x,
          y: coordinates.y,
          imageUrl: section.image_url || undefined,
          isNew: false,
        };
        setSectionMarkers((prev) => [...prev, newSectionMarker]);
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
    }) => {
      return await sectionService.update(input.sectionId, {
        name: input.name,
        x_coordinate: input.x,
        y_coordinate: input.y,
        file_id: input.file_id,
      });
    },
    onSuccess: (section) => {
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
        x: designMode === "section-level" 
          ? (pendingSectionCoordinates?.x ?? 50)
          : undefined,
        y: designMode === "section-level" 
          ? (pendingSectionCoordinates?.y ?? 50)
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
          };
        } else {
          // Update: has id field
          return {
            id: seat.id,
            x_coordinate: seat.x,
            y_coordinate: seat.y,
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

  const handleConfirmSave = () => {
    setShowSaveConfirmDialog(false);
    saveSeatsMutation.mutate(seats);
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
  };

  const handleConfirmDeleteSection = () => {
    if (sectionToDelete) {
      deleteSectionMutation.mutate(sectionToDelete.id);
      setSectionToDelete(null);
    }
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
          onImageClick={handleKonvaImageClick}
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
        <div className="flex gap-2">
          {/* Datasheet Toggle Button */}
          {((venueType === "large" && sectionMarkers.length > 0) ||
            (venueType === "small" && seats.length > 0) ||
            (viewingSection && displayedSeats.length > 0)) && (
            <Button
              variant="outline"
              onClick={() => setIsDatasheetOpen(true)}
              size="sm"
              title="View Datasheet"
            >
              <List className="h-4 w-4 mr-2" />
              Datasheet
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saveSeatsMutation.isPending}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleFullscreen}
            size="sm"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          {mainImageUrl &&
            (isPlacingSeats ||
              (venueType === "large" && isPlacingSections)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
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
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                onSeatClick={handleSeatClick}
                onSectionClick={handleKonvaSectionClick}
                onSeatDragEnd={handleKonvaSeatDragEnd}
                onImageClick={handleKonvaImageClick}
                onWheel={handleKonvaWheel}
                onPan={handlePan}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
                venueType={venueType}
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
          isOpen={!!selectedSectionMarker}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSelectedSectionMarker(null);
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
        onOpenChange={(open) => !open && setSectionToDelete(null)}
        title="Delete Section"
        description={
          sectionToDelete
            ? `Are you sure you want to delete "${sectionToDelete.name}"? This action cannot be undone. Any seats in this section will also be removed.`
            : ""
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: handleConfirmDeleteSection,
          loading: deleteSectionMutation.isPending,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => setSectionToDelete(null),
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
