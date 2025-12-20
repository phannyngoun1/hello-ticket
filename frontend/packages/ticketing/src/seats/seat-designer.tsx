/**
 * Seat Designer Component
 *
 * Interactive component for designing seat layouts by uploading a venue image
 * and placing seats by clicking on the image.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { seatService } from "./seat-service";
import type { CreateSeatInput } from "./types";
import { SeatType } from "./types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlacementPanel } from "./placement-panel";

export interface SeatDesignerProps {
  venueId: string;
  imageUrl?: string;
  onImageUpload?: (url: string) => void;
  className?: string;
}

type DesignMode = "seat-level" | "section-level";

interface SectionMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string;
  isNew?: boolean;
}

interface SeatInfo {
  section: string;
  row: string;
  seatNumber: string;
  seatType: SeatType;
}

interface SeatMarker {
  id: string;
  x: number;
  y: number;
  seat: SeatInfo;
  isNew?: boolean;
}

export function SeatDesigner({
  venueId,
  imageUrl: initialImageUrl,
  onImageUpload,
  className,
}: SeatDesignerProps) {
  // Design mode: "seat-level" = direct seat placement, "section-level" = section-based with separate floor plans
  const [designMode, setDesignMode] = useState<DesignMode>("seat-level");
  // Keep old venueType for backward compatibility (can be removed later)
  const venueType = designMode === "seat-level" ? "small" : "large";

  // Main floor plan image (for both types)
  const [mainImageUrl, setMainImageUrl] = useState<string | undefined>(
    initialImageUrl
  );

  // Large venue: sections placed on main floor plan
  const [sectionMarkers, setSectionMarkers] = useState<SectionMarker[]>([]);
  const [selectedSectionMarker, setSelectedSectionMarker] =
    useState<SectionMarker | null>(null);
  const [isPlacingSections, setIsPlacingSections] = useState(false);
  const [currentSectionName, setCurrentSectionName] = useState("Section A");

  // Section detail view (when clicking a section in large venue mode)
  const [viewingSection, setViewingSection] = useState<SectionMarker | null>(
    null
  );

  // Seats (for small venue: all seats, for large venue: seats in viewingSection)
  const [seats, setSeats] = useState<SeatMarker[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatMarker | null>(null);
  const [isPlacingSeats, setIsPlacingSeats] = useState(false);
  const [currentSeat, setCurrentSeat] = useState({
    section: "Section A",
    row: "Row 1",
    seatNumber: "1",
    seatType: SeatType.STANDARD,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDatasheetOpen, setIsDatasheetOpen] = useState(false);
  const [viewingSeat, setViewingSeat] = useState<SeatMarker | null>(null);
  const [isEditingViewingSeat, setIsEditingViewingSeat] = useState(false);
  const [editingSeatData, setEditingSeatData] = useState<SeatInfo | null>(null);
  const [viewingSectionForView, setViewingSectionForView] =
    useState<SectionMarker | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch existing seats
  const { data: existingSeats, isLoading } = useQuery({
    queryKey: ["seats", venueId],
    queryFn: () => seatService.getByVenue(venueId),
    enabled: !!venueId,
  });

  // Validate venueId after hooks
  if (!venueId) {
    return <div className="p-4 text-destructive">Venue ID is required</div>;
  }

  // Load existing seats when fetched
  useEffect(() => {
    if (existingSeats?.items) {
      const markers: SeatMarker[] = existingSeats.items.map((seat) => ({
        id: seat.id,
        x: seat.x_coordinate || 0,
        y: seat.y_coordinate || 0,
        seat: {
          section: seat.section,
          row: seat.row,
          seatNumber: seat.seat_number,
          seatType: seat.seat_type,
        },
      }));
      setSeats(markers);
    }
  }, [existingSeats]);

  // Get seats for current context
  const displayedSeats =
    venueType === "small"
      ? seats
      : viewingSection
        ? seats.filter((s) => s.seat.section === viewingSection.name)
        : [];

  // Handle main image upload
  const handleMainImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setMainImageUrl(preview);
        if (onImageUpload) {
          onImageUpload(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle section image upload (for large venue mode)
  const handleSectionImageSelect = (
    sectionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setSectionMarkers((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, imageUrl: preview } : s
          )
        );
        // Update viewingSection if it's the same section being viewed
        if (viewingSection?.id === sectionId) {
          setViewingSection((prev) =>
            prev ? { ...prev, imageUrl: preview } : null
          );
        }
      };
      reader.readAsDataURL(file);
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
    setIsPlacingSeats(false);
    setIsPlacingSections(false);
  };

  // Clear seats in current section (for section detail view)
  const handleClearSectionSeats = () => {
    if (viewingSection) {
      setSeats((prev) =>
        prev.filter((s) => s.seat.section !== viewingSection.name)
      );
      setSelectedSeat(null);
      setIsPlacingSeats(false);
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

  // Track spacebar state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Pan functionality - allow dragging with modifiers or alternative buttons (works in placement mode too)
  const handleMouseDown = (e: React.MouseEvent) => {
    const isPlacementMode =
      (venueType === "small" && isPlacingSeats) ||
      (venueType === "large" && isPlacingSections) ||
      (venueType === "large" && viewingSection && isPlacingSeats);

    // Store initial mouse position for drag detection
    if (e.button === 0) {
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }

    // Allow panning with:
    // - Middle mouse button (always)
    // - Right mouse button (always)
    // - Ctrl+Left click (always)
    // - Space+Left click (always)
    // - Left click when zoomed AND not in placement mode (to avoid conflicts)
    const canPan =
      e.button === 1 || // Middle mouse button (always works)
      e.button === 2 || // Right mouse button (always works)
      (e.button === 0 && e.ctrlKey) || // Ctrl+Left click (always works)
      (e.button === 0 && isSpacePressed) || // Space+Left click (always works)
      (e.button === 0 && zoomLevel > 1 && !isPlacementMode); // Left click when zoomed (only when not placing)

    if (canPan) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Check if user is dragging (mouse moved significantly from start)
      if (dragStartPos && !isPanning) {
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - dragStartPos.x, 2) +
            Math.pow(e.clientY - dragStartPos.y, 2)
        );

        // If dragged more than 5 pixels, disable placement mode and enable panning
        if (dragDistance > 5) {
          const isPlacementMode =
            (venueType === "small" && isPlacingSeats) ||
            (venueType === "large" && isPlacingSections) ||
            (venueType === "large" && viewingSection && isPlacingSeats);

          if (isPlacementMode) {
            // Disable placement mode
            setIsPlacingSeats(false);
            setIsPlacingSections(false);
            // Enable panning
            setIsPanning(true);
            setPanStart({
              x: e.clientX - panOffset.x,
              y: e.clientY - panOffset.y,
            });
            setDragStartPos(null);
            return;
          }
        }
      }

      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [
      isPanning,
      panStart,
      dragStartPos,
      panOffset,
      venueType,
      isPlacingSeats,
      isPlacingSections,
      viewingSection,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragStartPos(null);
  }, []);

  useEffect(() => {
    // Always listen for mouse events to detect dragging in placement mode
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Convert click coordinates to percentage (accounting for zoom and pan)
  const getCoordinatesFromClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      const img = imageRef.current;
      const container = containerRef.current;
      if (!img || !container) return { x: 0, y: 0 };

      const containerRect = container.getBoundingClientRect();

      // Get natural image dimensions
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      if (naturalWidth === 0 || naturalHeight === 0) {
        // Image not loaded yet, use fallback
        return { x: 50, y: 50 };
      }

      // Calculate displayed image dimensions (before transform)
      // Image has w-full, so it fills container width
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const aspectRatio = naturalHeight / naturalWidth;
      const displayedWidth = containerWidth;
      const displayedHeight = containerWidth * aspectRatio;

      // Click position relative to container
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;

      // Container center (transform origin point)
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      // Calculate position relative to container center
      const relativeToCenterX = clickX - centerX;
      const relativeToCenterY = clickY - centerY;

      // Reverse the transform
      // Transform order: translate(panOffset) then scale(zoomLevel) from center
      // To reverse: first unscale (divide by zoomLevel), then untranslate (subtract panOffset)
      const beforeZoomX = relativeToCenterX / zoomLevel;
      const beforeZoomY = relativeToCenterY / zoomLevel;

      const beforePanX = beforeZoomX - panOffset.x;
      const beforePanY = beforeZoomY - panOffset.y;

      // Now we have coordinates relative to container center in original (untransformed) space
      // Convert to position relative to image top-left corner
      // Image is centered in container, so add half image dimensions
      const imageX = beforePanX + displayedWidth / 2;
      const imageY = beforePanY + displayedHeight / 2;

      // Convert to percentage
      const x = (imageX / displayedWidth) * 100;
      const y = (imageY / displayedHeight) * 100;

      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [zoomLevel, panOffset]
  );

  // Handle main image click - place sections (large venue) or seats (small venue)
  const handleMainImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // Don't place if user was dragging
    if (isPanning || dragStartPos || selectedSectionMarker) {
      return;
    }

    if (venueType === "large" && isPlacingSections) {
      // Place section marker on main floor plan
      const { x, y } = getCoordinatesFromClick(e);
      const newSection: SectionMarker = {
        id: `section-${Date.now()}`,
        name: currentSectionName,
        x,
        y,
        isNew: true,
      };
      setSectionMarkers([...sectionMarkers, newSection]);
      setCurrentSectionName(
        `Section ${String.fromCharCode(65 + sectionMarkers.length + 1)}`
      );
    } else if (venueType === "small" && isPlacingSeats) {
      // Place seat on main floor plan (small venue)

      // Don't place if a seat is selected
      if (selectedSeat) {
        return;
      }

      const { x, y } = getCoordinatesFromClick(e);
      const newSeat: SeatMarker = {
        id: `temp-${Date.now()}`,
        x,
        y,
        seat: currentSeat,
        isNew: true,
      };
      setSeats([...seats, newSeat]);
      setSelectedSeat(null); // Clear selection when placing new seat
      setCurrentSeat({
        ...currentSeat,
        seatNumber: String(parseInt(currentSeat.seatNumber) + 1),
      });
    }
  };

  // Handle section image click - place seats on section floor plan
  const handleSectionImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!viewingSection) return;

    // Don't place if user was dragging
    if (isPanning || dragStartPos) {
      return;
    }

    // Don't place if a seat is selected
    if (selectedSeat) {
      return;
    }

    const { x, y } = getCoordinatesFromClick(e);
    const newSeat: SeatMarker = {
      id: `temp-${Date.now()}`,
      x,
      y,
      seat: {
        section: viewingSection.name,
        row: currentSeat.row,
        seatNumber: currentSeat.seatNumber,
        seatType: currentSeat.seatType,
      },
      isNew: true,
    };
    setSeats([...seats, newSeat]);
    setSelectedSeat(null); // Clear selection when placing new seat
    setCurrentSeat({
      ...currentSeat,
      seatNumber: String(parseInt(currentSeat.seatNumber) + 1),
    });
  };

  // Handle section marker click - select section for editing or viewing
  const handleSectionMarkerClick = (
    section: SectionMarker,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Enable placement mode for editing
    setIsPlacingSections(true);
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
    // If in placement mode, show in Sheet for viewing/deleting
    if (isPlacingSeats) {
      setSelectedSeat(seat);
      setViewingSeat(seat);
      setIsEditingViewingSeat(false);
      setEditingSeatData(null);
    } else {
      // Not in placement mode: show view-only Sheet
      setViewingSeat(seat);
      setIsEditingViewingSeat(false);
      setEditingSeatData(null);
    }
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

  // Handle seat drag start
  const handleSeatDragStart = (seat: SeatMarker, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedSeat(seat);
    const img = imageRef.current;
    if (img) {
      const rect = img.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - (seat.x / 100) * rect.width,
        y: e.clientY - rect.top - (seat.y / 100) * rect.height,
      });
    }
  };

  // Handle seat drag
  const handleSeatDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !selectedSeat || !imageRef.current) return;

      const img = imageRef.current;
      const rect = img.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === selectedSeat.id
            ? {
                ...seat,
                x: Math.max(0, Math.min(100, x)),
                y: Math.max(0, Math.min(100, y)),
              }
            : seat
        )
      );
    },
    [isDragging, selectedSeat, dragOffset]
  );

  // Handle drag end
  const handleSeatDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleSeatDrag);
      document.addEventListener("mouseup", handleSeatDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleSeatDrag);
        document.removeEventListener("mouseup", handleSeatDragEnd);
      };
    }
  }, [isDragging, handleSeatDrag, handleSeatDragEnd]);

  // Save seats mutation
  const saveSeatsMutation = useMutation({
    mutationFn: async (seatsToSave: SeatMarker[]) => {
      const newSeats = seatsToSave.filter((s) => s.isNew);
      const updatedSeats = seatsToSave.filter((s) => !s.isNew);

      // Create new seats
      if (newSeats.length > 0) {
        const createInputs: CreateSeatInput[] = newSeats.map((seat) => ({
          venue_id: venueId,
          section: seat.seat.section,
          row: seat.seat.row,
          seat_number: seat.seat.seatNumber,
          seat_type: seat.seat.seatType,
          x_coordinate: seat.x,
          y_coordinate: seat.y,
        }));
        await seatService.bulkCreate(venueId, createInputs);
      }

      // Update existing seats
      for (const seat of updatedSeats) {
        await seatService.updateCoordinates(seat.id, seat.x, seat.y);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats", venueId] });
      setSeats((prev) => prev.map((s) => ({ ...s, isNew: false })));
    },
  });

  // Delete seat mutation
  const deleteSeatMutation = useMutation({
    mutationFn: async (seatId: string) => {
      await seatService.delete(seatId);
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
      return await seatService.update(seatId, {
        section: data.section,
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

  // Delete section from datasheet
  const handleDeleteSection = (section: SectionMarker) => {
    // Also delete all seats in this section
    setSeats((prev) => prev.filter((s) => s.seat.section !== section.name));
    setSectionMarkers((prev) => prev.filter((s) => s.id !== section.id));
    if (selectedSectionMarker?.id === section.id) {
      setSelectedSectionMarker(null);
    }
    if (viewingSection?.id === section.id) {
      setViewingSection(null);
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

  if (isLoading) {
    return <div className="p-4">Loading seats...</div>;
  }

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
                variant={isPlacingSeats ? "default" : "outline"}
                onClick={() => setIsPlacingSeats(!isPlacingSeats)}
                size="sm"
                disabled={!viewingSection.imageUrl}
              >
                {isPlacingSeats ? "Stop Placing" : "Place Seats"}
              </Button>
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
                  Upload Floor Plan Image for {viewingSection.name}
                </span>
                <Input
                  id={`section-image-${viewingSection.id}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleSectionImageSelect(viewingSection.id, e)
                  }
                  className="hidden"
                />
              </Label>
            </Card>
          )}

          {/* Section Image with Seat Markers */}
          {viewingSection.imageUrl && (
            <div className="flex gap-4">
              <div
                ref={containerRef}
                className={`relative border rounded-lg overflow-hidden bg-gray-100 ${
                  isPlacingSeats || displayedSeats.length > 0
                    ? "flex-1"
                    : "w-full"
                }`}
                style={{ minHeight: "400px" }}
                onMouseDown={handleMouseDown}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setZoomLevel((prev) =>
                    Math.max(0.5, Math.min(3, prev + delta))
                  );
                }}
                onContextMenu={(e) => {
                  // Prevent context menu when right-clicking to pan
                  if (zoomLevel > 1) {
                    e.preventDefault();
                  }
                }}
              >
                <div
                  ref={transformWrapperRef}
                  className="relative w-full h-full"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: isPanning ? "none" : "transform 0.1s",
                  }}
                >
                  <img
                    ref={imageRef}
                    src={viewingSection.imageUrl}
                    alt={`${viewingSection.name} layout`}
                    className={`w-full h-auto ${
                      isPlacingSeats
                        ? "cursor-crosshair"
                        : zoomLevel > 1
                          ? "cursor-move"
                          : "cursor-default"
                    }`}
                    onClick={handleSectionImageClick}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  {displayedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className={`absolute w-6 h-6 rounded-full border-2 cursor-move transition-all ${
                        selectedSeat?.id === seat.id
                          ? "bg-blue-500 border-blue-700 scale-125 shadow-lg ring-2 ring-blue-300 ring-offset-2"
                          : seat.seat.seatType === SeatType.VIP
                            ? "bg-yellow-400 border-yellow-600 hover:scale-110"
                            : seat.seat.seatType === SeatType.WHEELCHAIR
                              ? "bg-green-400 border-green-600 hover:scale-110"
                              : "bg-gray-300 border-gray-500 hover:scale-110"
                      }`}
                      style={{
                        left: `${seat.x}%`,
                        top: `${seat.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={() => handleSeatClick(seat)}
                      onMouseDown={(e) => handleSeatDragStart(seat, e)}
                      title={`${seat.seat.section} ${seat.seat.row} ${seat.seat.seatNumber} (${seat.seat.seatType})`}
                    />
                  ))}
                </div>
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

              {/* Right Side Panel - Seat Placement Controls */}
              {isPlacingSeats && (
                <PlacementPanel
                  title="Place Seat"
                  isEditing={false}
                  onClose={() => {
                    setIsPlacingSeats(false);
                    setSelectedSeat(null);
                  }}
                  onDelete={undefined}
                  isDeleting={false}
                  instructionText="Click on the image to place a seat with these settings."
                >
                  <div className="text-xs font-semibold text-muted-foreground mb-3">
                    New Seat Settings
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Input
                      value={currentSeat.section}
                      onChange={(e) =>
                        setCurrentSeat({
                          ...currentSeat,
                          section: e.target.value,
                        })
                      }
                      className="mt-1"
                      disabled={!!viewingSection}
                    />
                  </div>
                  <div>
                    <Label>Row</Label>
                    <Input
                      value={currentSeat.row}
                      onChange={(e) =>
                        setCurrentSeat({
                          ...currentSeat,
                          row: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Seat #</Label>
                    <Input
                      value={currentSeat.seatNumber}
                      onChange={(e) =>
                        setCurrentSeat({
                          ...currentSeat,
                          seatNumber: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={currentSeat.seatType}
                      onValueChange={(value) =>
                        setCurrentSeat({
                          ...currentSeat,
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
                </PlacementPanel>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  const designerContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Seat Designer</h3>
        <div className="flex gap-2">
          {/* Design Mode Selector */}
          <Select
            value={designMode}
            onValueChange={(v) => setDesignMode(v as DesignMode)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seat-level">Seat Level</SelectItem>
              <SelectItem value="section-level">Section Level</SelectItem>
            </SelectContent>
          </Select>

          {venueType === "small" && (
            <Button
              variant={isPlacingSeats ? "default" : "outline"}
              onClick={() => setIsPlacingSeats(!isPlacingSeats)}
              size="sm"
              disabled={!mainImageUrl}
            >
              {isPlacingSeats ? "Stop Placing" : "Place Seats"}
            </Button>
          )}

          {venueType === "large" && (
            <Button
              variant={isPlacingSections ? "default" : "outline"}
              onClick={() => setIsPlacingSections(!isPlacingSections)}
              size="sm"
              disabled={!mainImageUrl}
            >
              {isPlacingSections ? "Stop Placing Sections" : "Place Sections"}
            </Button>
          )}

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
          {mainImageUrl && (
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
              Upload {designMode === "seat-level" ? "Venue" : "Main"} Floor Plan
              Image
            </span>
            <Input
              id="main-image-upload"
              type="file"
              accept="image/*"
              onChange={handleMainImageSelect}
              className="hidden"
            />
          </Label>
        </Card>
      )}

      {/* Main Floor Plan Image */}
      {mainImageUrl && (
        <div className="flex gap-4">
          <div
            ref={containerRef}
            className={`relative border rounded-lg overflow-hidden bg-gray-100 ${
              (venueType === "small" && isPlacingSeats) ||
              (venueType === "large" && isPlacingSections)
                ? "flex-1"
                : "w-full"
            }`}
            style={{ minHeight: "400px" }}
            onMouseDown={handleMouseDown}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev + delta)));
            }}
          >
            <div
              ref={transformWrapperRef}
              className="relative w-full h-full"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 0.1s",
              }}
            >
              <img
                ref={imageRef}
                src={mainImageUrl}
                alt={venueType === "small" ? "Venue layout" : "Main floor plan"}
                className={`w-full h-auto ${
                  (venueType === "small" && isPlacingSeats) ||
                  (venueType === "large" && isPlacingSections)
                    ? "cursor-crosshair"
                    : zoomLevel > 1
                      ? "cursor-move"
                      : "cursor-default"
                }`}
                onClick={handleMainImageClick}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />

              {/* Small Venue: Show all seats */}
              {venueType === "small" &&
                displayedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`absolute w-6 h-6 rounded-full border-2 cursor-move transition-all ${
                      selectedSeat?.id === seat.id
                        ? "bg-blue-500 border-blue-700 scale-125 shadow-lg ring-2 ring-blue-300 ring-offset-2"
                        : seat.seat.seatType === SeatType.VIP
                          ? "bg-yellow-400 border-yellow-600 hover:scale-110"
                          : seat.seat.seatType === SeatType.WHEELCHAIR
                            ? "bg-green-400 border-green-600 hover:scale-110"
                            : "bg-gray-300 border-gray-500 hover:scale-110"
                    }`}
                    style={{
                      left: `${seat.x}%`,
                      top: `${seat.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => handleSeatClick(seat)}
                    onMouseDown={(e) => handleSeatDragStart(seat, e)}
                    title={`${seat.seat.section} ${seat.seat.row} ${seat.seat.seatNumber} (${seat.seat.seatType})`}
                  />
                ))}

              {/* Large Venue: Show section markers */}
              {venueType === "large" &&
                sectionMarkers.map((section) => (
                  <div
                    key={section.id}
                    className={`absolute px-3 py-1 rounded border-2 cursor-pointer transition-all ${
                      selectedSectionMarker?.id === section.id
                        ? "bg-blue-500 border-blue-700 text-white scale-110 shadow-lg ring-2 ring-blue-300 ring-offset-2"
                        : "bg-white border-blue-500 text-blue-700 hover:bg-blue-50 hover:scale-105"
                    }`}
                    style={{
                      left: `${section.x}%`,
                      top: `${section.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={(e) => handleSectionMarkerClick(section, e)}
                    title={`${section.name} - Click to add floor plan and seats`}
                  >
                    <span className="text-sm font-medium">{section.name}</span>
                  </div>
                ))}
            </div>

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

          {/* Right Side Panel - Small Venue: Seat Placement Controls */}
          {venueType === "small" && isPlacingSeats && (
            <PlacementPanel
              title="Place Seat"
              isEditing={false}
              onClose={() => {
                setIsPlacingSeats(false);
                setSelectedSeat(null);
              }}
              onDelete={undefined}
              isDeleting={false}
              instructionText="Click on the image to place a seat with these settings."
            >
              <div className="text-xs font-semibold text-muted-foreground mb-3">
                New Seat Settings
              </div>
              <div>
                <Label>Section</Label>
                <Input
                  value={currentSeat.section}
                  onChange={(e) =>
                    setCurrentSeat({
                      ...currentSeat,
                      section: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Row</Label>
                <Input
                  value={currentSeat.row}
                  onChange={(e) =>
                    setCurrentSeat({ ...currentSeat, row: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Seat #</Label>
                <Input
                  value={currentSeat.seatNumber}
                  onChange={(e) =>
                    setCurrentSeat({
                      ...currentSeat,
                      seatNumber: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={currentSeat.seatType}
                  onValueChange={(value) =>
                    setCurrentSeat({
                      ...currentSeat,
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
            </PlacementPanel>
          )}

          {/* Right Side Panel - Large Venue: Section Placement Controls */}
          {venueType === "large" && isPlacingSections && (
            <PlacementPanel
              title={selectedSectionMarker ? "Edit Section" : "Place Section"}
              isEditing={!!selectedSectionMarker}
              editingInfo={
                selectedSectionMarker
                  ? `Editing: ${selectedSectionMarker.name}`
                  : undefined
              }
              onClose={() => {
                setIsPlacingSections(false);
                setSelectedSectionMarker(null);
              }}
              onDelete={
                selectedSectionMarker
                  ? () => {
                      handleDeleteSection(selectedSectionMarker);
                      setSelectedSectionMarker(null);
                    }
                  : undefined
              }
              instructionText="Click on the floor plan image to place this section. After placing, click the section to add its floor plan and seats."
            >
              <div>
                <Label>Section Name</Label>
                <Input
                  value={currentSectionName}
                  onChange={(e) => setCurrentSectionName(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., Section A"
                />
              </div>
            </PlacementPanel>
          )}
        </div>
      )}

      {/* Datasheet Sheet */}
      <Sheet open={isDatasheetOpen} onOpenChange={setIsDatasheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
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

          <div className="mt-6 flex-1 overflow-y-auto">
            {viewingSection ? (
              // Section detail view - show seats in this section
              <div className="space-y-2">
                {displayedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
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
                      <div className="flex gap-1">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
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
                      <div className="flex gap-1">
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
                        <Input
                          value={editingSeatData?.section || ""}
                          onChange={(e) =>
                            setEditingSeatData({
                              ...(editingSeatData || viewingSeat.seat),
                              section: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
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
                {isPlacingSeats
                  ? "Click on the image to place seats. Adjust section, row, seat number, and type above."
                  : "Click 'Place Seats' to start adding seats, or click existing seats to edit them."}
              </p>
              <p>Drag seats to reposition them.</p>
            </>
          )}
          {designMode === "section-level" && (
            <>
              <p>
                {isPlacingSections
                  ? "Click on the image to place sections. After placing, click a section to add its floor plan and seats."
                  : "Click 'Place Sections' to start adding sections, or click existing sections to add their floor plans."}
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
  );
}
