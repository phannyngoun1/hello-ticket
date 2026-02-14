import { useState, useEffect, useCallback } from "react";
import { uploadService } from "@truths/shared";
import { detectMarkers } from "../../../ai/detect-markers";
import { detectSeats } from "../../../ai/detect-seats";
import type { SeatMarker, SectionMarker } from "../types";
import { SeatType } from "../../types";
import { useToast } from "@truths/ui";

export function useSeatDesignerImage(
    initialImageUrl: string | undefined,
    onImageUploadCallback?: (url: string, fileId: string) => void,
    onRemoveImageCallback?: () => void,
    initialFileId?: string
) {
    const { toast } = useToast();
    const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadId, setImageUploadId] = useState<string | undefined>(
        initialFileId
    );
    const [isDetecting, setIsDetecting] = useState(false);

    // Track the actual file object for AI detection
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    useEffect(() => {
        if (initialImageUrl) {
            setImageUrl(initialImageUrl);
        }
    }, [initialImageUrl]);

    useEffect(() => {
        if (!imageUrl) {
            setImage(null);
            return;
        }

        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            setImage(img);
        };
    }, [imageUrl]);

    const handleImageUpload = useCallback(
        async (file: File) => {
            setIsUploadingImage(true);
            setUploadedFile(file);
            try {
                const { url, id } = await uploadService.uploadImage(file);
                setImageUrl(url);
                setImageUploadId(id);
                onImageUploadCallback?.(url, id);
                toast({
                    title: "Image uploaded",
                    description: "Seat map image has been uploaded successfully.",
                });
            } catch (error) {
                console.error("Failed to upload image:", error);
                toast({
                    title: "Upload failed",
                    description: "Failed to upload seat map image. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsUploadingImage(false);
            }
        },
        [onImageUploadCallback, toast]
    );

    const handleRemoveImage = useCallback(() => {
        setImageUrl(undefined);
        setImage(null);
        setImageUploadId(undefined);
        setUploadedFile(null);
        onRemoveImageCallback?.();
    }, [onRemoveImageCallback]);

    const handleDetectSections = useCallback(async (
        onSuccess: (sections: SectionMarker[]) => void
    ) => {
        if (!uploadedFile) {
            toast({
                title: "No image",
                description: "Please upload an image first to detect sections.",
                variant: "destructive",
            });
            return;
        }

        setIsDetecting(true);
        try {
            const data = await detectMarkers(uploadedFile);
            const newSections: SectionMarker[] = data.sections.map((marker: any) => ({
                id: crypto.randomUUID(),
                x: marker.x,
                y: marker.y,
                name: marker.label || `Section ${marker.index + 1}`,
                capacity: 100, // Default capacity
                row_count: 10, // Default rows
                is_general_admission: false,
            }));

            onSuccess(newSections);

            toast({
                title: "Detection complete",
                description: `Detected ${newSections.length} sections.`,
            });
        } catch (error) {
            console.error("Failed to detect sections:", error);
            toast({
                title: "Detection failed",
                description: "Failed to detect sections. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDetecting(false);
        }
    }, [uploadedFile, toast]);

    const handleDetectSeats = useCallback(async (
        onSuccess: (seats: SeatMarker[]) => void
    ) => {
        if (!uploadedFile) {
            toast({
                title: "No image",
                description: "Please upload an image first to detect seats.",
                variant: "destructive",
            });
            return;
        }

        setIsDetecting(true);
        try {
            const data = await detectSeats(uploadedFile);
            const newSeats: SeatMarker[] = data.seats.map((seat: any) => ({
                id: crypto.randomUUID(),
                x: seat.x,
                y: seat.y,
                seat: {
                    row: seat.row || "1",
                    seatNumber: seat.seat_number || `${seat.index + 1}`,
                    section: "General",
                    seatType: SeatType.STANDARD,
                    sectionId: "",
                },
                isNew: true,
            }));

            onSuccess(newSeats);

            toast({
                title: "Detection complete",
                description: `Detected ${newSeats.length} seats.`,
            });
        } catch (error) {
            console.error("Failed to detect seats:", error);
            toast({
                title: "Detection failed",
                description: "Failed to detect seats. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDetecting(false);
        }
    }, [uploadedFile, toast]);

    return {
        imageUrl,
        image,
        isUploadingImage,
        imageUploadId,
        isDetecting,
        handleImageUpload,
        handleRemoveImage,
        handleDetectSections,
        handleDetectSeats
    };
}
