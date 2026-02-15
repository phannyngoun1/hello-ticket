import { useCallback, useState } from "react";
import type Konva from "konva";

interface UsePopoverPositionProps {
    containerRef: React.RefObject<HTMLDivElement>;
}

export function usePopoverPosition({ containerRef }: UsePopoverPositionProps) {
    const [hoveredSeatPosition, setHoveredSeatPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const updatePopoverPosition = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            const group = e.target.getParent();
            const evt = e.evt;
            const stage = e.target.getStage();

            if (group && stage && containerRef.current) {
                try {
                    // Get the container's bounding rect to account for its position on the page
                    const containerRect = containerRef.current.getBoundingClientRect();

                    // Use Konva's getClientRect to get the bounding box
                    // This gives us coordinates relative to the stage container
                    const box = group.getClientRect();

                    // Convert to absolute screen coordinates by adding container position
                    // This accounts for scroll position since getBoundingClientRect() is relative to viewport
                    const absoluteX = containerRect.left + box.x;
                    const absoluteY = containerRect.top + box.y;

                    const popoverWidth = 320; // Width of the popover
                    const popoverHeight = 200; // Estimated height
                    const offset = 15; // Offset from seat

                    // Calculate preferred position (to the right of seat)
                    let screenX = absoluteX + box.width + offset;
                    let screenY = absoluteY + box.height / 2 - popoverHeight / 2;

                    // Get viewport dimensions
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    // Check if popover would go off right edge of viewport
                    if (screenX + popoverWidth > viewportWidth) {
                        // Position to the left of seat instead
                        screenX = absoluteX - popoverWidth - offset;
                    }

                    // Check if popover would go off left edge
                    if (screenX < 0) {
                        screenX = Math.max(offset, absoluteX + box.width + offset);
                        // If still off screen, position at edge
                        if (screenX + popoverWidth > viewportWidth) {
                            screenX = viewportWidth - popoverWidth - offset;
                        }
                    }

                    // Check if popover would go off bottom edge
                    if (screenY + popoverHeight > viewportHeight) {
                        screenY = viewportHeight - popoverHeight - offset;
                    }

                    // Check if popover would go off top edge
                    if (screenY < 0) {
                        screenY = offset;
                    }

                    setHoveredSeatPosition({ x: screenX, y: screenY });
                } catch (error) {
                    // Fallback to mouse position if getClientRect fails
                    fallbackToMousePosition(evt);
                }
            } else {
                // Fallback to mouse position
                fallbackToMousePosition(evt);
            }
        },
        [containerRef]
    );

    const fallbackToMousePosition = (evt: MouseEvent) => {
        const popoverWidth = 320;
        let screenX = evt.clientX + 20;
        let screenY = evt.clientY - 100;

        // Keep on screen
        if (screenX + popoverWidth > window.innerWidth) {
            screenX = evt.clientX - popoverWidth - 20;
        }
        if (screenY < 0) {
            screenY = 10;
        }

        setHoveredSeatPosition({ x: screenX, y: screenY });
    };

    return {
        hoveredSeatPosition,
        setHoveredSeatPosition,
        updatePopoverPosition,
    };
}
