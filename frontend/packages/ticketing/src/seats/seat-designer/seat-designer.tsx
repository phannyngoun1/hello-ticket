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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import {
  Upload,
  Trash2,
  Save,
  X,
  Maximize,
  Minimize,
  MoreVertical,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  List,
  Edit,
} from "lucide-react";
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
  const [currentSectionName, setCurrentSectionName] = useState("Section A");
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);

  // Section detail view (when clicking a section in large venue mode)
  const [viewingSection, setViewingSection] = useState<SectionMarker | null>(
    null
  );

  // Seats (for small venue: all seats, for large venue: seats in viewingSection)
  const [seats, setSeats] = useState<SeatMarker[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatMarker | null>(null);
  // Always in placement mode - simplified
  const isPlacingSeats = true;
  const [currentSeat, setCurrentSeat] = useState<SeatInfo>({
    section: "Section A",
    sectionId: undefined,
    row: "Row 1",
    seatNumber: "1",
    seatType: SeatType.STANDARD,
  });
  const [sectionSelectValue, setSectionSelectValue] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDatasheetOpen, setIsDatasheetOpen] = useState(false);
  const [viewingSeat, setViewingSeat] = useState<SeatMarker | null>(null);
  const [isEditingViewingSeat, setIsEditingViewingSeat] = useState(false);
  const [editingSeatData, setEditingSeatData] = useState<SeatInfo | null>(null);
  const [viewingSectionForView, setViewingSectionForView] =
    useState<SectionMarker | null>(null);
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
  useEffect(() => {
    if (
      designMode === "section-level" &&
      sectionMarkers.length === 0 &&
      !isLoading
    ) {
      const defaultSection: SectionMarker = {
        id: `section-default`,
        name: "Section A",
        x: 50,
        y: 50,
        isNew: true,
      };
      setSectionMarkers([defaultSection]);
      setSelectedSectionMarker(defaultSection);
      setCurrentSectionName(defaultSection.name);
    }
  }, [designMode, isLoading, sectionMarkers.length]);

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
      // Select first section if available and none is selected
      if (markers.length > 0) {
        setSelectedSectionMarker((prev) => prev || markers[0]);
        setCurrentSectionName((prev) => prev || markers[0].name);
      }
    }
  }, [initialSections, designMode]);

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
        const newSeat: SeatMarker = {
          id: `temp-${Date.now()}`,
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          seat: {
            section: viewingSection.name,
            row: currentSeat.row,
            seatNumber: currentSeat.seatNumber,
            seatType: currentSeat.seatType,
          },
          isNew: true,
        };
        setSeats((prev) => [...prev, newSeat]);
        setCurrentSeat({
          ...currentSeat,
          seatNumber: String(parseInt(currentSeat.seatNumber) + 1),
        });
      }
      // Main floor - place sections (create locally, will be saved via form or bulk save)
      else if (venueType === "large" && isPlacingSections) {
        const newSection: SectionMarker = {
          id: `section-${Date.now()}`,
          name: currentSectionName,
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          isNew: true,
        };
        setSectionMarkers((prev) => [...prev, newSection]);
        setCurrentSectionName((prevName) => {
          const match = prevName.match(/Section ([A-Z])/);
          const nextLetter = match
            ? String.fromCharCode(match[1].charCodeAt(0) + 1)
            : "B";
          return `Section ${nextLetter}`;
        });
      }
      // Small venue - place seats
      else if (venueType === "small" && isPlacingSeats) {
        const newSeat: SeatMarker = {
          id: `temp-${Date.now()}`,
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
          seat: currentSeat,
          isNew: true,
        };
        setSeats((prev) => [...prev, newSeat]);
        setCurrentSeat({
          ...currentSeat,
          seatNumber: String(parseInt(currentSeat.seatNumber) + 1),
        });
      }
    },
    [
      venueType,
      viewingSection,
      isPlacingSeats,
      isPlacingSections,
      currentSeat,
      currentSectionName,
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
    setCurrentSeat({ ...currentSeat, section: section.name });
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
    setEditingSeatData(null);
  };

  // Section form helpers (Sheet)
  const handleOpenNewSectionForm = () => {
    setEditingSectionId(null);
    const nextName = `Section ${sectionMarkers.length + 1}`;
    setCurrentSectionName(nextName);
    setIsSectionFormOpen(true);
  };

  const handleEditSectionFromSheet = (section: SectionMarker) => {
    setEditingSectionId(section.id);
    setCurrentSectionName(section.name);
    setIsSectionFormOpen(true);
  };

  // Edit section from sectionsData (for seat-level mode)
  const handleEditSectionFromData = (section: { id: string; name: string }) => {
    setEditingSectionId(section.id);
    setCurrentSectionName(section.name);
    setIsSectionFormOpen(true);
    setIsManageSectionsOpen(false);
  };

  // Sync sectionSelectValue with currentSeat.section
  useEffect(() => {
    setSectionSelectValue(currentSeat.section || "");
  }, [currentSeat.section]);

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
      // Always update currentSeat with the new section name and ID
      setCurrentSeat((prev) => ({
        ...prev,
        section: section.name,
        sectionId: section.id,
      }));

      // Only update sectionMarkers in section-level mode
      if (designMode === "section-level") {
        const newSectionMarker: SectionMarker = {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          isNew: false,
        };
        setSectionMarkers((prev) => [...prev, newSectionMarker]);
        setSelectedSectionMarker(newSectionMarker);
      }

      setIsSectionFormOpen(false);
      setEditingSectionId(null);
      setCurrentSectionName("");
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
    }) => {
      return await sectionService.update(input.sectionId, {
        name: input.name,
        x_coordinate: input.x,
        y_coordinate: input.y,
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
      setCurrentSeat((prev) => ({ ...prev, section: section.name }));
      setIsSectionFormOpen(false);
      setEditingSectionId(null);
      setCurrentSectionName("");
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

  const handleSaveSectionForm = () => {
    const name = currentSectionName.trim() || "Section";

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
      });
      createSectionMutation.mutate({
        name,
        x: designMode === "section-level" ? 50 : undefined,
        y: designMode === "section-level" ? 50 : undefined,
      });
    }
  };

  const handleCancelSectionForm = () => {
    setIsSectionFormOpen(false);
    setEditingSectionId(null);
    setCurrentSectionName("");
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

  // Sync form field with selected section
  useEffect(() => {
    if (selectedSectionMarker && isPlacingSections) {
      setCurrentSectionName(selectedSectionMarker.name);
    }
  }, [selectedSectionMarker, isPlacingSections]);

  // Update selected section name when form value changes
  useEffect(() => {
    if (selectedSectionMarker && isPlacingSections) {
      if (selectedSectionMarker.name !== currentSectionName) {
        const updatedSection = {
          ...selectedSectionMarker,
          name: currentSectionName,
        };

        setSectionMarkers((prev) =>
          prev.map((section) =>
            section.id === selectedSectionMarker.id ? updatedSection : section
          )
        );
        setSelectedSectionMarker(updatedSection);
      }
    }
  }, [currentSectionName, selectedSectionMarker, isPlacingSections]);

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
      setEditingSeatData(null);
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
      <Card className={className}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewingSection(null);
                  // Reset zoom when going back to main floor plan
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="mb-2"
              >
                <X className="h-4 w-4 mr-2" />
                Back to Main Floor Plan
              </Button>
              <h3 className="text-lg font-semibold">
                Section: {viewingSection.name}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saveSeatsMutation.isPending}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleClearSectionSeats}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Seats
                  </DropdownMenuItem>
                  {viewingSection.imageUrl && (
                    <>
                      <DropdownMenuSeparator />
                      <Label
                        htmlFor={`change-section-image-${viewingSection.id}`}
                        className="cursor-pointer"
                      >
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          asChild
                        >
                          <div>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Change Image
                            <Input
                              id={`change-section-image-${viewingSection.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                handleSectionImageSelect(viewingSection.id, e);
                                e.target.value = ""; // Reset input
                              }}
                              className="hidden"
                            />
                          </div>
                        </DropdownMenuItem>
                      </Label>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Section Image Upload */}
          {!viewingSection.imageUrl && (
            <Card className="p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <Label
                htmlFor={`section-image-${viewingSection.id}`}
                className="cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-700">
                  {isUploadingImage
                    ? "Uploading..."
                    : `Upload Floor Plan Image for ${viewingSection.name}`}
                </span>
                <Input
                  id={`section-image-${viewingSection.id}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleSectionImageSelect(viewingSection.id, e)
                  }
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </Label>
            </Card>
          )}

          {/* Section Image with Seat Markers */}
          {viewingSection.imageUrl && (
            <div className="space-y-4">
              {/* Seat Placement Controls Panel - On Top */}
              <Card className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Section / Row / Seat #</Label>
                    <div className="flex gap-2 mt-1">
                      <Select
                        value={
                          viewingSection
                            ? viewingSection.name
                            : currentSeat.section || ""
                        }
                        onValueChange={(value) => {
                          if (value === "new-section") {
                            setIsSectionFormOpen(true);
                            setEditingSectionId(null);
                            setCurrentSectionName("");
                          } else {
                            setCurrentSeat({
                              ...currentSeat,
                              section: value,
                            });
                          }
                        }}
                        disabled={!!viewingSection}
                      >
                        <SelectTrigger className="h-8 text-sm flex-1">
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {getUniqueSections().map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                          {!viewingSection && (
                            <SelectItem value="new-section">
                              <div className="flex items-center gap-2 font-medium text-primary">
                                <span>+ New Section</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Input
                        value={currentSeat.row}
                        onChange={(e) =>
                          setCurrentSeat({
                            ...currentSeat,
                            row: e.target.value,
                          })
                        }
                        className="h-8 text-sm w-16"
                        placeholder="Row"
                      />
                      <Input
                        value={currentSeat.seatNumber}
                        onChange={(e) =>
                          setCurrentSeat({
                            ...currentSeat,
                            seatNumber: e.target.value,
                          })
                        }
                        className="h-8 text-sm w-16"
                        placeholder="#"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={currentSeat.seatType}
                      onValueChange={(value) =>
                        setCurrentSeat({
                          ...currentSeat,
                          seatType: value as SeatType,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SeatType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Canvas Container */}
              <div
                ref={containerRef}
                className="relative border rounded-lg overflow-hidden bg-gray-100 flex-1"
                style={{
                  minHeight: "600px",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {dimensionsReady ? (
                  <LayoutCanvas
                    imageUrl={viewingSection.imageUrl}
                    seats={displayedSeats}
                    selectedSeatId={selectedSeat?.id || null}
                    isPlacingSeats={isPlacingSeats}
                    isPlacingSections={false}
                    zoomLevel={zoomLevel}
                    panOffset={panOffset}
                    onSeatClick={handleSeatClick}
                    onSeatDragEnd={handleKonvaSeatDragEnd}
                    onImageClick={handleKonvaImageClick}
                    onWheel={handleKonvaWheel}
                    onPan={handlePan}
                    containerWidth={containerDimensions.width}
                    containerHeight={containerDimensions.height}
                    venueType="small"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full py-12 text-muted-foreground">
                    Initializing canvas...
                  </div>
                )}
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetZoom}
                    disabled={
                      zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0
                    }
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-center text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
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
        <Card className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <Label htmlFor="main-image-upload" className="cursor-pointer">
            <span className="text-sm font-medium text-gray-700">
              {isUploadingImage
                ? "Uploading..."
                : `Upload ${designMode === "seat-level" ? "Venue" : "Main"} Floor Plan Image`}
            </span>
            <Input
              id="main-image-upload"
              type="file"
              accept="image/*"
              onChange={handleMainImageSelect}
              className="hidden"
              disabled={isUploadingImage}
            />
          </Label>
        </Card>
      )}

      {/* Main Floor Plan Image */}
      {mainImageUrl && (
        <div className="space-y-4">
          {/* Seat Placement Controls Panel - On Top (Small Venue) */}
          {venueType === "small" && (
            <Card className="p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Section / Row / Seat #</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={sectionSelectValue || currentSeat.section || ""}
                      onValueChange={(value) => {
                        if (value === "new-section") {
                          setIsSectionFormOpen(true);
                          setEditingSectionId(null);
                          setCurrentSectionName("");
                          // Reset select to current section
                          setSectionSelectValue(currentSeat.section || "");
                        } else if (value === "manage-sections") {
                          setIsManageSectionsOpen(true);
                          // Reset select to current section
                          setSectionSelectValue(currentSeat.section || "");
                        } else {
                          setCurrentSeat({
                            ...currentSeat,
                            section: value,
                          });
                          setSectionSelectValue(value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm flex-1">
                        <SelectValue placeholder="Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueSections().map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-border my-1 mx-2" />
                        <SelectItem value="new-section">
                          <div className="flex items-center gap-2 font-medium text-primary">
                            <span>+ New Section</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="manage-sections">
                          <div className="flex items-center gap-2 font-medium">
                            <Edit className="h-3 w-3" />
                            <span>Manage Sections</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={currentSeat.row}
                      onChange={(e) =>
                        setCurrentSeat({ ...currentSeat, row: e.target.value })
                      }
                      className="h-8 text-sm w-16"
                      placeholder="Row"
                    />
                    <Input
                      value={currentSeat.seatNumber}
                      onChange={(e) =>
                        setCurrentSeat({
                          ...currentSeat,
                          seatNumber: e.target.value,
                        })
                      }
                      className="h-8 text-sm w-16"
                      placeholder="#"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={currentSeat.seatType}
                    onValueChange={(value) =>
                      setCurrentSeat({
                        ...currentSeat,
                        seatType: value as SeatType,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SeatType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* Section Placement Controls Panel - On Top (Large Venue) */}
          {venueType === "large" && (
            <Card className="p-3">
              {selectedSectionMarker && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    Editing: {selectedSectionMarker.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleDeleteSection(selectedSectionMarker);
                      setSelectedSectionMarker(null);
                    }}
                    className="h-6 px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div>
                <Label className="text-xs">Section</Label>
                <Select
                  value={selectedSectionMarker?.id || ""}
                  onValueChange={(value) => {
                    if (value === "new-section") {
                      setIsSectionFormOpen(true);
                      setEditingSectionId(null);
                      setCurrentSectionName("");
                    } else {
                      const section = sectionMarkers.find(
                        (s) => s.id === value
                      );
                      if (section) {
                        setSelectedSectionMarker(section);
                        setCurrentSectionName(section.name);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue placeholder="Select or create section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionMarkers.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new-section">
                      <div className="flex items-center gap-2 font-medium text-primary">
                        <span>+ New Section</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
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
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                disabled={
                  zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0
                }
                title="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className="text-xs text-center text-muted-foreground bg-background/80 px-2 py-1 rounded">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datasheet Sheet */}
      <Sheet open={isDatasheetOpen} onOpenChange={setIsDatasheetOpen}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              {viewingSection
                ? `Seats - ${viewingSection.name}`
                : venueType === "large"
                  ? "Sections"
                  : "Seats"}
            </SheetTitle>
            <SheetDescription>
              {viewingSection
                ? `${displayedSeats.length} seat(s) in ${viewingSection.name}`
                : venueType === "large"
                  ? `${sectionMarkers.length} section(s) placed`
                  : `${seats.length} seat(s) placed`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex-1 overflow-y-auto min-h-0">
            {viewingSection ? (
              // Section detail view - show seats in this section
              <div className="space-y-2">
                {displayedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSeat?.id === seat.id
                        ? "bg-blue-50 border-blue-500"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      if (isPlacingSeats) {
                        // In placement mode: select seat for editing
                        setSelectedSeat(seat);
                        setIsDatasheetOpen(false);
                      } else {
                        // Not in placement mode: show view-only Sheet
                        setViewingSeat(seat);
                        setIsDatasheetOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {seat.seat.row} {seat.seat.seatNumber}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {seat.seat.seatType}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPlacingSeats && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSeat(seat);
                              setIsEditingViewingSeat(true);
                              setEditingSeatData(seat.seat);
                              setIsDatasheetOpen(false);
                            }}
                            className="h-6 w-6 p-0"
                            title="Edit seat"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {isPlacingSeats && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSeat(seat);
                            }}
                            className="h-6 w-6 p-0"
                            title="Delete seat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : venueType === "large" ? (
              // Large venue main view - show sections
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Sections</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenNewSectionForm}
                    className="h-7 px-3"
                  >
                    Add section
                  </Button>
                </div>

                {isSectionFormOpen && (
                  <Card className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {editingSectionId ? "Update section" : "New section"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={handleCancelSectionForm}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-3"
                          onClick={handleSaveSectionForm}
                          disabled={
                            !currentSectionName.trim() ||
                            createSectionMutation.isPending ||
                            updateSectionMutation.isPending
                          }
                        >
                          {editingSectionId ? "Update" : "Create"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Section Name</Label>
                      <Input
                        value={currentSectionName}
                        onChange={(e) => setCurrentSectionName(e.target.value)}
                        className="mt-1 h-8 text-sm"
                        placeholder="e.g., Section A"
                        autoFocus
                      />
                    </div>
                  </Card>
                )}

                {sectionMarkers.map((section) => (
                  <div
                    key={section.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSectionMarker?.id === section.id
                        ? "bg-blue-50 border-blue-500"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSectionMarkerClick(section, e);
                      setIsDatasheetOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {section.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {section.imageUrl
                            ? "Floor plan added"
                            : "No floor plan"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {
                            seats.filter((s) => s.seat.section === section.name)
                              .length
                          }{" "}
                          seat(s)
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSectionDetail(section);
                            setIsDatasheetOpen(false);
                          }}
                          className="h-7 px-3"
                        >
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSectionFromSheet(section);
                          }}
                          className="h-7 px-2"
                          title="Edit section"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(section);
                          }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Delete section"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Small venue - show all seats
              <div className="space-y-2">
                {seats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSeat?.id === seat.id
                        ? "bg-blue-50 border-blue-500"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      if (isPlacingSeats) {
                        // In placement mode: select seat for editing
                        setSelectedSeat(seat);
                        setIsDatasheetOpen(false);
                      } else {
                        // Not in placement mode: show view-only Sheet
                        setViewingSeat(seat);
                        setIsDatasheetOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {seat.seat.section} {seat.seat.row}{" "}
                          {seat.seat.seatNumber}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {seat.seat.seatType}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPlacingSeats && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSeat(seat);
                              setIsEditingViewingSeat(true);
                              setEditingSeatData(seat.seat);
                              setIsDatasheetOpen(false);
                            }}
                            className="h-6 w-6 p-0"
                            title="Edit seat"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {isPlacingSeats && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSeat(seat);
                            }}
                            className="h-6 w-6 p-0"
                            title="Delete seat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Seat View Sheet - View/Delete/Edit seat */}
      <Sheet
        open={!!viewingSeat}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSeat(null);
            setSelectedSeat(null);
            setIsEditingViewingSeat(false);
            setEditingSeatData(null);
          }
        }}
      >
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          {viewingSeat && (
            <>
              <SheetHeader>
                <SheetTitle>Seat Information</SheetTitle>
                <SheetDescription>
                  {isPlacingSeats
                    ? isEditingViewingSeat
                      ? "Edit seat details"
                      : "View or edit this seat"
                    : "View seat details (read-only)"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {isEditingViewingSeat ? (
                  // Edit mode
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label>Section</Label>
                        <Select
                          value={editingSeatData?.section || ""}
                          onValueChange={(value) => {
                            // Find the section_id for the selected section name
                            let sectionId = editingSeatData?.sectionId;
                            if (sectionsData && designMode === "seat-level") {
                              const section = sectionsData.find(
                                (s) => s.name === value
                              );
                              sectionId = section?.id;
                            } else if (designMode === "section-level") {
                              const section = sectionMarkers.find(
                                (s) => s.name === value
                              );
                              sectionId = section?.id;
                            }

                            setEditingSeatData({
                              ...(editingSeatData || viewingSeat.seat),
                              section: value,
                              sectionId: sectionId,
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUniqueSections().map((section) => (
                              <SelectItem key={section} value={section}>
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Row</Label>
                        <Input
                          value={editingSeatData?.row || ""}
                          onChange={(e) =>
                            setEditingSeatData({
                              ...(editingSeatData || viewingSeat.seat),
                              row: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Seat Number</Label>
                        <Input
                          value={editingSeatData?.seatNumber || ""}
                          onChange={(e) =>
                            setEditingSeatData({
                              ...(editingSeatData || viewingSeat.seat),
                              seatNumber: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={
                            editingSeatData?.seatType ||
                            viewingSeat.seat.seatType
                          }
                          onValueChange={(value) =>
                            setEditingSeatData({
                              ...(editingSeatData || viewingSeat.seat),
                              seatType: value as SeatType,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(SeatType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          if (editingSeatData && !viewingSeat.isNew) {
                            updateSeatMutation.mutate({
                              seatId: viewingSeat.id,
                              data: editingSeatData,
                            });
                          } else if (editingSeatData && viewingSeat.isNew) {
                            // Update local state for new seats
                            setSeats((prev) =>
                              prev.map((s) =>
                                s.id === viewingSeat.id
                                  ? { ...s, seat: editingSeatData }
                                  : s
                              )
                            );
                            setViewingSeat(null);
                            setSelectedSeat(null);
                            setIsEditingViewingSeat(false);
                            setEditingSeatData(null);
                          }
                        }}
                        disabled={updateSeatMutation.isPending}
                      >
                        {updateSeatMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsEditingViewingSeat(false);
                          setEditingSeatData(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  // View mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Section</Label>
                        <div className="mt-1 text-sm font-medium">
                          {viewingSeat.seat.section}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Row</Label>
                        <div className="mt-1 text-sm font-medium">
                          {viewingSeat.seat.row}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          Seat Number
                        </Label>
                        <div className="mt-1 text-sm font-medium">
                          {viewingSeat.seat.seatNumber}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <div className="mt-1 text-sm font-medium">
                          {viewingSeat.seat.seatType}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">
                          Position
                        </Label>
                        <div className="mt-1 text-sm font-medium">
                          X: {viewingSeat.x.toFixed(2)}%, Y:{" "}
                          {viewingSeat.y.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    {isPlacingSeats && (
                      <div className="pt-4 border-t space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setIsEditingViewingSeat(true);
                            setEditingSeatData(viewingSeat.seat);
                          }}
                        >
                          Edit Seat
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            handleDeleteSeat(viewingSeat);
                            setViewingSeat(null);
                            setSelectedSeat(null);
                          }}
                          disabled={deleteSeatMutation.isPending}
                        >
                          {deleteSeatMutation.isPending
                            ? "Deleting..."
                            : "Delete Seat"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Section View Sheet - Read-only view when not in placement mode */}
      <Sheet
        open={!!viewingSectionForView}
        onOpenChange={(open) => !open && setViewingSectionForView(null)}
      >
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          {viewingSectionForView && (
            <>
              <SheetHeader>
                <SheetTitle>Section Information</SheetTitle>
                <SheetDescription>
                  View section details (read-only)
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <div className="mt-1 text-sm font-medium">
                      {viewingSectionForView.name}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Floor Plan</Label>
                    <div className="mt-1 text-sm font-medium">
                      {viewingSectionForView.imageUrl ? "Added" : "Not added"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Seats</Label>
                    <div className="mt-1 text-sm font-medium">
                      {
                        seats.filter(
                          (s) => s.seat.section === viewingSectionForView.name
                        ).length
                      }{" "}
                      seat(s)
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Position</Label>
                    <div className="mt-1 text-sm font-medium">
                      X: {viewingSectionForView.x.toFixed(2)}%, Y:{" "}
                      {viewingSectionForView.y.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Selected Section Info */}
      {selectedSectionMarker && !viewingSection && venueType === "large" && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Selected Section</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSectionMarker(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>{" "}
              {selectedSectionMarker.name}
            </div>
            <div>
              <span className="text-gray-500">Floor Plan:</span>{" "}
              {selectedSectionMarker.imageUrl ? "Added" : "Not added"}
            </div>
            <div>
              <span className="text-gray-500">Seats:</span>{" "}
              {
                seats.filter(
                  (s) => s.seat.section === selectedSectionMarker.name
                ).length
              }{" "}
              seat(s)
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleOpenSectionDetail(selectedSectionMarker)}
            >
              Open Section Detail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentSectionName(selectedSectionMarker.name);
              }}
            >
              Use Name for Next
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteSection(selectedSectionMarker)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {mainImageUrl && (
        <div className="text-sm text-gray-500 space-y-1">
          {designMode === "seat-level" && (
            <>
              <p>
                Click on the image to place seats. Adjust section, row, seat
                number, and type above.
              </p>
              <p>Drag seats to reposition them.</p>
            </>
          )}
          {designMode === "section-level" && (
            <>
              <p>
                Click on the image to place sections. After placing, click a
                section to add its floor plan and seats.
              </p>
              <p>
                {sectionMarkers.length > 0 &&
                  `${sectionMarkers.length} section(s) placed. Click any section to add its floor plan.`}
              </p>
            </>
          )}
          {!isFullscreen && (
            <p className="text-xs mt-2">
              💡 Tip: Use the fullscreen button for a larger workspace
            </p>
          )}
        </div>
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
        <Sheet
          open={isManageSectionsOpen}
          onOpenChange={(open) => setIsManageSectionsOpen(open)}
        >
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Manage Sections</SheetTitle>
              <SheetDescription>
                Edit or delete sections for this layout
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {sectionsData?.length || 0} section(s)
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSectionId(null);
                    setCurrentSectionName("");
                    setIsSectionFormOpen(true);
                    setIsManageSectionsOpen(false);
                  }}
                >
                  + New Section
                </Button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {sectionsData && sectionsData.length > 0 ? (
                  sectionsData.map((section) => (
                    <Card key={section.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{section.name}</p>
                          {section.x_coordinate != null &&
                            section.y_coordinate != null && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Position: ({section.x_coordinate.toFixed(1)},{" "}
                                {section.y_coordinate.toFixed(1)})
                              </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSectionFromData(section)}
                            className="h-8 px-2"
                            title="Edit section"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSection(section)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            title="Delete section"
                            disabled={deleteSectionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sections found. Create your first section.
                  </p>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* New Section Sheet */}
      <Sheet
        open={isSectionFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSectionFormOpen(false);
            setEditingSectionId(null);
            setCurrentSectionName("");
          }
        }}
      >
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {editingSectionId ? "Edit Section" : "New Section"}
            </SheetTitle>
            <SheetDescription>
              {editingSectionId
                ? "Update the section details"
                : "Create a new section for your layout"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                value={currentSectionName}
                onChange={(e) => setCurrentSectionName(e.target.value)}
                className="mt-1.5"
                placeholder="e.g., Section A, VIP Area, General Admission"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSectionFormOpen(false);
                  setEditingSectionId(null);
                  setCurrentSectionName("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSectionForm}
                disabled={
                  !currentSectionName.trim() ||
                  createSectionMutation.isPending ||
                  updateSectionMutation.isPending
                }
                className="flex-1"
              >
                {editingSectionId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
