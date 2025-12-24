/**
 * Show Image Manager Component
 * 
 * Component for managing show images (upload, view, delete, set banner)
 */

import { useState, useCallback } from "react";
import { Card, Button, Input, Label, Textarea, Checkbox } from "@truths/ui";
import { Upload, X, Image as ImageIcon, Star } from "lucide-react";
import { uploadService } from "@truths/shared";
import type { ShowImage, CreateShowImageInput, UpdateShowImageInput } from "./types";
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
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string; is_banner: boolean } | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file first
      const uploadResponse = await uploadService.uploadImage(file);
      
      // Create show image record
      const imageInput: CreateShowImageInput = {
        show_id: showId,
        file_id: uploadResponse.id,
        name: file.name,
        description: "",
        is_banner: false,
      };

      const newImage = await service.createShowImage(imageInput);
      // Ensure file_url is set from upload response
      const imageWithUrl = { ...newImage, file_url: uploadResponse.url };
      const updatedImages = [...images, imageWithUrl];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  }, [showId, images, service, onImagesChange]);

  const handleDelete = useCallback(async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await service.deleteShowImage(showId, imageId);
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    } catch (error) {
      console.error("Failed to delete image:", error);
      alert("Failed to delete image. Please try again.");
    }
  }, [showId, images, service, onImagesChange]);

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
      const updateInput: UpdateShowImageInput = {
        name: editForm.name,
        description: editForm.description || undefined,
        is_banner: editForm.is_banner,
      };

      const updatedImage = await service.updateShowImage(showId, editingId, updateInput);
      const updatedImages = images.map(img => 
        img.id === editingId ? updatedImage : img
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

  const handleToggleBanner = useCallback(async (imageId: string, currentValue: boolean) => {
    try {
      const updateInput: UpdateShowImageInput = {
        is_banner: !currentValue,
      };

      const updatedImage = await service.updateShowImage(showId, imageId, updateInput);
      const updatedImages = images.map(img => 
        img.id === imageId ? updatedImage : img
      );
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    } catch (error) {
      console.error("Failed to update banner status:", error);
      alert("Failed to update banner status. Please try again.");
    }
  }, [showId, images, service, onImagesChange]);

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
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Image"}
            </span>
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </Label>
      </div>

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
            <Card key={image.id} className="overflow-hidden">
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
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Banner
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
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
              <div className="p-4 space-y-2">
                {editingId === image.id ? (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`name-${image.id}`} className="text-xs">Name</Label>
                      <Input
                        id={`name-${image.id}`}
                        value={editForm?.name || ""}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`desc-${image.id}`} className="text-xs">Description</Label>
                      <Textarea
                        id={`desc-${image.id}`}
                        value={editForm?.description || ""}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="h-16 text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`banner-${image.id}`}
                        checked={editForm?.is_banner || false}
                        onCheckedChange={(checked) => setEditForm(prev => prev ? { ...prev, is_banner: checked === true } : null)}
                      />
                      <Label htmlFor={`banner-${image.id}`} className="text-xs cursor-pointer">
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
                    <div>
                      <h4 className="font-medium text-sm truncate">{image.name}</h4>
                      {image.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`banner-check-${image.id}`}
                          checked={image.is_banner}
                          onCheckedChange={() => handleToggleBanner(image.id, image.is_banner)}
                        />
                        <Label htmlFor={`banner-check-${image.id}`} className="text-xs cursor-pointer">
                          Banner
                        </Label>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(image)}
                      >
                        Edit
                      </Button>
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

