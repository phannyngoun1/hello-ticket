/**
 * Pending Image Manager Component
 *
 * Component for managing images before a show is created.
 * Stores files temporarily and allows setting banner flags.
 */

import { useState, useCallback } from "react";
import { Card, Button, Label, Checkbox } from "@truths/ui";
import { Upload, X, Image as ImageIcon, Star, Loader2 } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";

export interface PendingImage {
  id: string;
  file: File;
  name: string;
  description?: string;
  is_banner: boolean;
  preview?: string;
}

export interface PendingImageManagerProps {
  images?: PendingImage[];
  onImagesChange?: (images: PendingImage[]) => void;
  className?: string;
  disabled?: boolean;
}

export function PendingImageManager({
  images: initialImages = [],
  onImagesChange,
  className,
  disabled = false,
}: PendingImageManagerProps) {
  const [images, setImages] = useState<PendingImage[]>(initialImages);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsProcessing(true);
      const newImages: PendingImage[] = [];

      // Process files to create previews
      for (const file of files) {
        const preview = URL.createObjectURL(file);
        const pendingImage: PendingImage = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          description: "",
          is_banner: false,
          preview,
        };
        newImages.push(pendingImage);
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      setIsProcessing(false);

      // Reset file input
      e.target.value = "";
    },
    [images, onImagesChange]
  );

  const handleDelete = useCallback(
    (imageId: string) => {
      const imageToRemove = images.find((img) => img.id === imageId);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const updatedImages = images.filter((img) => img.id !== imageId);
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    },
    [images, onImagesChange]
  );

  const handleToggleBanner = useCallback(
    (imageId: string) => {
      const targetImage = images.find((img) => img.id === imageId);
      if (!targetImage) return;

      const newBannerValue = !targetImage.is_banner;

      // If setting as banner, unset all other banners
      const updatedImages = images.map((img) =>
        img.id === imageId
          ? { ...img, is_banner: newBannerValue }
          : newBannerValue && img.is_banner
            ? { ...img, is_banner: false }
            : img
      );
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    },
    [images, onImagesChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Show Images</h3>
        <Label htmlFor="pending-image-upload" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isProcessing}
            asChild
          >
            <span>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </>
              )}
            </span>
          </Button>
          <input
            id="pending-image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isProcessing}
            aria-label="Upload show images"
          />
        </Label>
      </div>

      {images.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No images selected yet. Click "Upload Images" to add images.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-muted">
                {image.preview ? (
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {image.is_banner && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Banner
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    className="h-6 w-6 p-0"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-2 flex flex-col flex-1">
                <div className="flex-1">
                  <h4 className="font-medium text-sm truncate">{image.name}</h4>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Checkbox
                    id={`banner-check-${image.id}`}
                    checked={image.is_banner}
                    onCheckedChange={() => handleToggleBanner(image.id)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`banner-check-${image.id}`}
                    className="text-xs cursor-pointer"
                  >
                    Banner
                  </Label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
