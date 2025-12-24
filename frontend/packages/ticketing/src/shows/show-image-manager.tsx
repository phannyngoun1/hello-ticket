/**
 * Show Image Manager Component
 *
 * Component for managing show images (upload, view, delete, set banner)
 */

import { useState, useCallback, useEffect } from "react";
import { Card, Button, Input, Label, Textarea, Checkbox } from "@truths/ui";
import { Upload, X, Image as ImageIcon, Star, Loader2 } from "lucide-react";
import { uploadService } from "@truths/shared";
import type {
  ShowImage,
  CreateShowImageInput,
  UpdateShowImageInput,
} from "./types";
import { useShowService } from "./show-provider";
import { cn } from "@truths/ui/lib/utils";

export interface ShowImageManagerProps {
  showId: string;
  images?: ShowImage[];
  onImagesChange?: (images: ShowImage[]) => void;
  className?: string;
}

export function ShowImageManager({
  showId,
  images: initialImages = [],
  onImagesChange,
  className,
}: ShowImageManagerProps) {
  const service = useShowService();
  const [images, setImages] = useState<ShowImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    is_banner: boolean;
  } | null>(null);

  // Sync images with prop changes
  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsUploading(true);
      const newImages: ShowImage[] = [];
      const failedFiles: string[] = [];

      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        const fileName = file.name;
        setUploadingFiles((prev) => new Set(prev).add(fileName));

        try {
          // Upload file first
          const uploadResponse = await uploadService.uploadImage(file);

          // Create show image record
          const imageInput: CreateShowImageInput = {
            show_id: showId,
            file_id: uploadResponse.id,
            name: file.name,
            description: "",
            is_banner: false, // New uploads are never banners by default
          };

          const newImage = await service.createShowImage(imageInput);
          // Ensure file_url is set from upload response
          const imageWithUrl = { ...newImage, file_url: uploadResponse.url };
          newImages.push(imageWithUrl);
        } catch (error) {
          console.error(`Failed to upload image ${fileName}:`, error);
          failedFiles.push(fileName);
        } finally {
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileName);
            return next;
          });
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
      }

      // Show summary message if there were failures
      if (failedFiles.length > 0) {
        const successCount = newImages.length;
        const message =
          successCount > 0
            ? `Successfully uploaded ${successCount} image(s). ${failedFiles.length} image(s) failed to upload.`
            : `Failed to upload ${failedFiles.length} image(s). Please try again.`;
        alert(message);
      }

      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    },
    [showId, images, service, onImagesChange]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      if (!confirm("Are you sure you want to delete this image?")) return;

      try {
        await service.deleteShowImage(showId, imageId);
        const updatedImages = images.filter((img) => img.id !== imageId);
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
      } catch (error) {
        console.error("Failed to delete image:", error);
        alert("Failed to delete image. Please try again.");
      }
    },
    [showId, images, service, onImagesChange]
  );

  const handleEdit = useCallback((image: ShowImage) => {
    setEditingId(image.id);
    setEditForm({
      name: image.name,
      description: image.description || "",
      is_banner: image.is_banner,
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editForm) return;

    try {
      // If setting as banner, first unset all other banners
      if (editForm.is_banner) {
        const bannerImages = images.filter(
          (img) => img.is_banner && img.id !== editingId
        );
        for (const bannerImage of bannerImages) {
          try {
            await service.updateShowImage(showId, bannerImage.id, {
              is_banner: false,
            });
          } catch (error) {
            console.error(
              `Failed to unset banner for image ${bannerImage.id}:`,
              error
            );
          }
        }
      }

      const updateInput: UpdateShowImageInput = {
        name: editForm.name,
        description: editForm.description || undefined,
        is_banner: editForm.is_banner,
      };

      const updatedImage = await service.updateShowImage(
        showId,
        editingId,
        updateInput
      );
      const updatedImages = images.map((img) =>
        img.id === editingId
          ? updatedImage
          : editForm.is_banner && img.is_banner
            ? { ...img, is_banner: false }
            : img
      );
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error("Failed to update image:", error);
      alert("Failed to update image. Please try again.");
    }
  }, [editingId, editForm, showId, images, service, onImagesChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm(null);
  }, []);

  const handleToggleBanner = useCallback(
    async (imageId: string, currentValue: boolean) => {
      try {
        const newBannerValue = !currentValue;
        const updateInput: UpdateShowImageInput = {
          is_banner: newBannerValue,
        };

        // If setting as banner, first unset all other banners
        if (newBannerValue) {
          const bannerImages = images.filter(
            (img) => img.is_banner && img.id !== imageId
          );
          for (const bannerImage of bannerImages) {
            try {
              await service.updateShowImage(showId, bannerImage.id, {
                is_banner: false,
              });
            } catch (error) {
              console.error(
                `Failed to unset banner for image ${bannerImage.id}:`,
                error
              );
            }
          }
        }

        const updatedImage = await service.updateShowImage(
          showId,
          imageId,
          updateInput
        );
        const updatedImages = images.map((img) =>
          img.id === imageId
            ? updatedImage
            : newBannerValue && img.is_banner
              ? { ...img, is_banner: false }
              : img
        );
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
      } catch (error) {
        console.error("Failed to update banner status:", error);
        alert("Failed to update banner status. Please try again.");
      }
    },
    [showId, images, service, onImagesChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Show Images</h3>
        <Label htmlFor="image-upload" className="cursor-pointer">
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
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
            aria-label="Upload show images"
          />
        </Label>
      </div>

      {uploadingFiles.size > 0 && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm text-muted-foreground">
            Uploading {uploadingFiles.size} file(s):{" "}
            {Array.from(uploadingFiles).join(", ")}
          </p>
        </div>
      )}

      {images.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No images uploaded yet. Click "Upload Image" to add images.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-muted">
                {image.file_url ? (
                  <img
                    src={image.file_url}
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
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-2 flex flex-col flex-1">
                {editingId === image.id ? (
                  <div className="space-y-2 flex flex-col flex-1">
                    <div>
                      <Label htmlFor={`name-${image.id}`} className="text-xs">
                        Name
                      </Label>
                      <Input
                        id={`name-${image.id}`}
                        value={editForm?.name || ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`desc-${image.id}`} className="text-xs">
                        Description
                      </Label>
                      <Textarea
                        id={`desc-${image.id}`}
                        value={editForm?.description || ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : null
                          )
                        }
                        className="h-16 text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="mt-auto pt-2 flex items-center gap-2">
                      <Checkbox
                        id={`banner-${image.id}`}
                        checked={editForm?.is_banner || false}
                        onCheckedChange={(checked) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, is_banner: checked === true }
                              : null
                          )
                        }
                      />
                      <Label
                        htmlFor={`banner-${image.id}`}
                        className="text-xs cursor-pointer"
                      >
                        Set as banner
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">
                          {image.name}
                        </h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(image)}
                        >
                          Edit
                        </Button>
                      </div>
                      {image.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Checkbox
                        id={`banner-check-${image.id}`}
                        checked={image.is_banner}
                        onCheckedChange={() =>
                          handleToggleBanner(image.id, image.is_banner)
                        }
                      />
                      <Label
                        htmlFor={`banner-check-${image.id}`}
                        className="text-xs cursor-pointer"
                      >
                        Banner
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
