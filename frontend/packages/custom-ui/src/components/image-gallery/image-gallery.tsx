import { useState } from "react";
import {
  Button,
  Card,
  Label,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export interface GalleryImage {
  id: string;
  url?: string;
  name: string;
  isBanner?: boolean;
}

export interface ImageGalleryProps {
  /**
   * List of images to display
   */
  images: GalleryImage[];
  /**
   * Whether images are currently loading
   */
  isLoading?: boolean;
  /**
   * Whether an upload is in progress
   */
  isUploading?: boolean;
  /**
   * Callback when files are selected for upload
   */
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Callback when an image delete is requested
   */
  onDelete?: (image: GalleryImage) => void;
  /**
   * Callback when an image banner toggle is requested
   */
  onToggleBanner?: (image: GalleryImage) => void;
  /**
   * Whether the gallery is read-only (hides actions)
   */
  readOnly?: boolean;
  /**
   * Custom overlay renderer for image items
   */
  renderOverlay?: (image: GalleryImage, isHovered: boolean) => React.ReactNode;
  className?: string;
}

export function ImageGallery({
  images,
  isLoading = false,
  isUploading = false,
  onUpload,
  onDelete,
  onToggleBanner,
  readOnly = false,
  renderOverlay,
  className,
}: ImageGalleryProps) {
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  return (
    <div className={cn("space-y-2", className)}>
      {!readOnly && (
        <div className="flex items-center justify-between">
          <input
            id="gallery-image-upload-input"
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            className="hidden"
            disabled={isUploading || isLoading}
            aria-label="Upload images"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading images...</div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            No images uploaded yet
          </p>
          {!readOnly && (
            <Label
              htmlFor="gallery-image-upload-input-empty"
              className="cursor-pointer"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
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
                id="gallery-image-upload-input-empty"
                type="file"
                accept="image/*"
                multiple
                onChange={onUpload}
                className="hidden"
                disabled={isUploading}
                aria-label="Upload images"
              />
            </Label>
          )}
        </div>
      ) : (
        <PhotoProvider>
          <div className="grid grid-cols-3 gap-1">
            {images.map((image) => (
              <Card
                key={image.id}
                className="overflow-hidden flex flex-col aspect-square w-full h-full"
                onMouseEnter={() => setHoveredImageId(image.id)}
                onMouseLeave={() => setHoveredImageId(null)}
              >
                <div className="relative w-full h-full bg-muted group">
                  {image.url ? (
                    <PhotoView src={image.url}>
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover cursor-pointer"
                      />
                    </PhotoView>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full pointer-events-none">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {renderOverlay ? (
                    renderOverlay(image, hoveredImageId === image.id)
                  ) : (
                    <>
                      {image.isBanner && (
                        <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground px-1 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-lg z-30 border border-primary/20 pointer-events-none">
                          <Star className="h-2 w-2 fill-current" />
                          <span className="hidden sm:inline">Banner</span>
                        </div>
                      )}
                      
                      {/* Action buttons floating on hover */}
                      {!readOnly && (
                        <div
                          className={cn(
                            "absolute bottom-0 right-0 flex items-center justify-end gap-0.5 p-0.5 transition-opacity duration-200",
                            hoveredImageId === image.id
                              ? "opacity-100"
                              : "opacity-0 pointer-events-none"
                          )}
                        >
                          {onToggleBanner && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBanner(image);
                              }}
                              className="h-5 w-5 p-0 bg-background hover:bg-background border border-border shadow-md pointer-events-auto"
                              title={image.isBanner ? "Unset Banner" : "Set as Banner"}
                            >
                              <Star
                                className={cn(
                                  "h-2.5 w-2.5",
                                  image.isBanner && "fill-current"
                                )}
                              />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(image);
                              }}
                              className="h-5 w-5 p-0 bg-destructive hover:bg-destructive text-destructive-foreground opacity-100 hover:opacity-100 shadow-md pointer-events-auto"
                              title="Delete Image"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            ))}
            {!readOnly && (
              <Label
                htmlFor="gallery-image-upload-input-grid"
                className="cursor-pointer"
              >
                <Card className="flex flex-col items-center justify-center aspect-square w-full h-full bg-muted/50 hover:bg-muted transition-colors border-dashed">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </Card>
                <input
                  id="gallery-image-upload-input-grid"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onUpload}
                  className="hidden"
                  disabled={isUploading}
                  aria-label="Upload images"
                />
              </Label>
            )}
          </div>
        </PhotoProvider>
      )}
    </div>
  );
}
