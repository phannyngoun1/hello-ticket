import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  const handlePreviousImage = useCallback(() => {
    if (!previewImage || images.length === 0) return;
    const currentIndex = images.findIndex((img) => img.id === previewImage.id);
    if (currentIndex > 0) {
      setPreviewImage(images[currentIndex - 1]);
    } else {
      setPreviewImage(images[images.length - 1]); // Loop to last image
    }
  }, [previewImage, images]);

  const handleNextImage = useCallback(() => {
    if (!previewImage || images.length === 0) return;
    const currentIndex = images.findIndex((img) => img.id === previewImage.id);
    if (currentIndex < images.length - 1) {
      setPreviewImage(images[currentIndex + 1]);
    } else {
      setPreviewImage(images[0]); // Loop to first image
    }
  }, [previewImage, images]);

  // Keyboard navigation for image preview
  useEffect(() => {
    if (!previewImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, handlePreviousImage, handleNextImage]);

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
        <div className="grid grid-cols-3 gap-1">
          {images.map((image) => (
            <Card
              key={image.id}
              className="overflow-hidden flex flex-col aspect-square  w-full h-full"
              onMouseEnter={() => setHoveredImageId(image.id)}
              onMouseLeave={() => setHoveredImageId(null)}
            >
              <div
                className="relative w-full h-full bg-muted group cursor-pointer"
                onClick={() => setPreviewImage(image)}
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
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
      )}

      {/* Image Preview Dialog - Full Screen */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-full max-h-screen h-screen w-screen p-0 m-0 rounded-none border-0">
          {previewImage && images.length > 0 && (
            <div className="flex flex-col h-full w-full bg-black/95">
              {/* Header */}
              <DialogHeader className="px-6 pt-6 pb-4 bg-black/50 border-b border-border/20">
                <DialogTitle className="text-white">
                  {previewImage.name}
                  {images.length > 1 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (
                      {images.findIndex((img) => img.id === previewImage.id) +
                        1}{" "}
                      of {images.length})
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              {/* Image Container */}
              <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                {previewImage.url && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={previewImage.url}
                      alt={previewImage.name}
                      className="max-w-full max-h-full object-contain"
                    />
                    {images.length > 1 && (
                      <>
                        {/* Previous Button */}
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="fixed left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-r-full rounded-l-none bg-background/90 hover:bg-background shadow-lg border border-border border-l-0 z-10"
                          onClick={handlePreviousImage}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        {/* Next Button */}
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="fixed right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-l-full rounded-r-none bg-background/90 hover:bg-background shadow-lg border border-border border-r-0 z-10"
                          onClick={handleNextImage}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
               {/* Close button handled by Dialog primitive, but we can add an explicit one if needed or rely on Esc/ClickOutside */}
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-white/70 hover:text-white hover:bg-white/20 z-50"
                    onClick={() => setPreviewImage(null)}
                 >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close</span>
                 </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
