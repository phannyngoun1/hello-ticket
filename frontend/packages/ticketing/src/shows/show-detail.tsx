/**
 * Show Detail Component
 *
 * Display detailed information about a show with optional edit and activity views.
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Tabs,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { ConfirmationDialog, ActionList, NoteEditor, } from "@truths/custom-ui";
import type { ActionItem } from "@truths/custom-ui";
import {
  Edit,
  Info,
  Database,
  Image as ImageIcon,
  X,
  Star,
  Trash2,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Show, ShowImage, UpdateShowInput } from "./types";
import { useShowService } from "./show-provider";
import { EditShowDialog } from "./edit-show-dialog";
import { useUpdateShow } from "./use-shows";
import { uploadService } from "@truths/shared";

export interface ShowDetailProps {
  className?: string;
  data?: Show;
  loading?: boolean;
  error?: Error | null;

  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (data: Show) => void;
  onDelete?: (data: Show) => void;
  onAddImage?: (data: Show) => void;

  customActions?: (data: Show) => React.ReactNode;
}

export function ShowDetail({
  className,
  data,
  loading = false,
  error = null,

  showMetadata = false,
  editable = true,
  onEdit,
  onDelete,
  onAddImage,

  customActions,
}: ShowDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "images" | "note" | "metadata"
  >("profile");
  const service = useShowService();
  const [images, setImages] = useState<ShowImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<ShowImage | null>(null);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteShowConfirmationText, setDeleteShowConfirmationText] =
    useState("");
  const [isDeletingShow, setIsDeletingShow] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const updateShowMutation = useUpdateShow(service);

  // Initialize note value when data changes
  useEffect(() => {
    if (data?.note !== undefined) {
      setNoteValue(data.note || "");
    }
  }, [data?.note]);

  // Load images when data is available
  useEffect(() => {
    if (!data?.id) return;

    const loadImages = async () => {
      setIsLoadingImages(true);
      try {
        const loadedImages = await service.fetchShowImages(data.id);
        setImages(loadedImages);
      } catch (error) {
        console.error("Failed to load images:", error);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
  }, [data?.id, service]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    if (!data?.id) return;
    setDeleteImageId(imageId);
  }, []);

  const confirmDeleteImage = useCallback(async () => {
    if (!data?.id || !deleteImageId) return;

    setIsDeleting(true);
    try {
      await service.deleteShowImage(data.id, deleteImageId);
      const updatedImages = images.filter((img) => img.id !== deleteImageId);
      setImages(updatedImages);
      setDeleteImageId(null);
      setDeleteConfirmationText("");
    } catch (error) {
      console.error("Failed to delete image:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [data?.id, deleteImageId, images, service]);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteImageId(null);
      setDeleteConfirmationText("");
    }
  }, []);

  const handleToggleBanner = useCallback(
    async (imageId: string, currentValue: boolean) => {
      if (!data?.id) return;
      try {
        const newBannerValue = !currentValue;

        // If setting as banner, first unset all other banners
        if (newBannerValue) {
          const bannerImages = images.filter(
            (img) => img.is_banner && img.id !== imageId
          );
          for (const bannerImage of bannerImages) {
            try {
              await service.updateShowImage(data.id, bannerImage.id, {
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

        const updatedImage = await service.updateShowImage(data.id, imageId, {
          is_banner: newBannerValue,
        });
        const updatedImages = images.map((img) =>
          img.id === imageId
            ? updatedImage
            : newBannerValue && img.is_banner
              ? { ...img, is_banner: false }
              : img
        );
        setImages(updatedImages);
      } catch (error) {
        console.error("Failed to update banner status:", error);
        alert("Failed to update banner status. Please try again.");
      }
    },
    [data?.id, images, service]
  );

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

  const getShowDisplayName = () => {
    return data?.code || data?.id || "";

    return data?.id || "";
  };

  const displayName = useMemo(
    () => (data ? getShowDisplayName() : ""),
    [data, data?.code]
  );

  // Internal handlers for actions when callbacks aren't provided
  const handleInternalEdit = useCallback(() => {
    if (onEdit && data) {
      onEdit(data);
    } else if (data) {
      setShowEditDialog(true);
    }
  }, [onEdit, data]);

  const handleInternalAddImage = useCallback(() => {
    if (onAddImage && data) {
      onAddImage(data);
    } else if (data) {
      // Switch to images tab and trigger file input
      setActiveTab("images");
      // Trigger file input click after a short delay to ensure tab is visible
      setTimeout(() => {
        const fileInput = document.getElementById(
          "show-image-upload-input"
        ) as HTMLInputElement;
        fileInput?.click();
      }, 100);
    }
  }, [onAddImage, data]);

  const handleInternalDelete = useCallback(() => {
    if (onDelete && data) {
      onDelete(data);
    } else if (data) {
      setShowDeleteDialog(true);
    }
  }, [onDelete, data]);

  const handleConfirmDeleteShow = useCallback(async () => {
    if (!data?.id) return;

    setIsDeletingShow(true);
    try {
      await service.deleteShow(data.id);
      setShowDeleteDialog(false);
      setDeleteShowConfirmationText("");
      // Navigate back to shows list
      window.location.href = "/ticketing/shows";
    } catch (error) {
      console.error("Failed to delete show:", error);
      alert("Failed to delete show. Please try again.");
    } finally {
      setIsDeletingShow(false);
    }
  }, [data?.id, service]);

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateShowInput) => {
      await updateShowMutation.mutateAsync({ id, input });
      setShowEditDialog(false);
      // The query will be invalidated by the mutation, so data will refresh automatically
    },
    [updateShowMutation]
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!data?.id) return;

      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsUploadingImage(true);
      const newImages: ShowImage[] = [];
      const failedFiles: string[] = [];

      // Upload files sequentially
      for (const file of files) {
        const fileName = file.name;
        try {
          // Upload file first
          const uploadResponse = await uploadService.uploadImage(file);

          // Create show image record
          const imageInput = {
            show_id: data.id,
            file_id: uploadResponse.id,
            name: file.name,
            description: "",
            is_banner: false,
          };

          const newImage = await service.createShowImage(imageInput);
          const imageWithUrl = { ...newImage, file_url: uploadResponse.url };
          newImages.push(imageWithUrl);
        } catch (error) {
          console.error(`Failed to upload image ${fileName}:`, error);
          failedFiles.push(fileName);
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
      }

      if (failedFiles.length > 0) {
        const successCount = newImages.length;
        const message =
          successCount > 0
            ? `Successfully uploaded ${successCount} image(s). ${failedFiles.length} image(s) failed to upload.`
            : `Failed to upload ${failedFiles.length} image(s). Please try again.`;
        alert(message);
      }

      setIsUploadingImage(false);
      // Reset file input
      e.target.value = "";
    },
    [data?.id, images, service]
  );

  // All hooks must be called before any early returns

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "N/A";
      const potentialDate = new Date(trimmed);
      if (!Number.isNaN(potentialDate.getTime())) {
        return potentialDate.toLocaleString();
      }
      return trimmed;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No show selected</div>
        </div>
      </Card>
    );
  }

  const hasMetadata = showMetadata;
  const hasImages = images.length > 0;

  // Build action list
  const actionItems: ActionItem[] = [];

  // Add Edit action if editable
  if (editable && data) {
    actionItems.push({
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: handleInternalEdit,
      variant: "ghost",
    });
  }

  // Add Add Image action
  if (data) {
    actionItems.push({
      id: "add-image",
      label: "Add Image",
      icon: <Upload className="h-3.5 w-3.5" />,
      onClick: handleInternalAddImage,
      variant: "ghost",
    });
  }

  // Add Delete action
  if (data) {
    actionItems.push({
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: handleInternalDelete,
      variant: "destructive",
    });
  }

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
              <Info className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>

              {data.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {data.code}
                </p>
              )}
            </div>
          </div>

          <ActionList
            actions={actionItems}
            maxVisibleActions={2}
            customActions={customActions?.(data)}
            size="sm"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b mb-4">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("profile")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Profile
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "images"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("images")}
              >
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images {hasImages && `(${images.length})`}
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "note"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("note")}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Note
                </span>
              </button>
              {hasMetadata && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "metadata"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("metadata")}
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Metadata
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-0">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Basic Information
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Code</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(data.code)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium">Name</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(data.name)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Timeline
                    </h3>
                    <dl className="space-y-3">
                      {data.created_at && (
                        <div>
                          <dt className="text-sm font-medium">Created</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(data.created_at)}
                          </dd>
                        </div>
                      )}
                      {data.updated_at && (
                        <div>
                          <dt className="text-sm font-medium">Last Updated</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(data.updated_at)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === "images" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    id="show-image-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage || isLoadingImages}
                    aria-label="Upload show images"
                  />
                </div>
                {isLoadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">
                      Loading images...
                    </div>
                  </div>
                ) : images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No images uploaded yet
                    </p>
                    <Label
                      htmlFor="show-image-upload-input-empty"
                      className="cursor-pointer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingImage}
                        asChild
                      >
                        <span>
                          {isUploadingImage ? (
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
                        id="show-image-upload-input-empty"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                        aria-label="Upload show images"
                      />
                    </Label>
                  </div>
                ) : (
                  <div className="grid grid-cols-3  w-full h-full gap-2">
                    {images.map((image) => (
                      <Card
                        key={image.id}
                        className="overflow-hidden flex flex-col aspect-square w-full h-full"
                        onMouseEnter={() => setHoveredImageId(image.id)}
                        onMouseLeave={() => setHoveredImageId(null)}
                      >
                        <div
                          className="relative w-full h-full bg-muted group cursor-pointer"
                          onClick={() => setPreviewImage(image)}
                        >
                          {image.file_url ? (
                            <img src={image.file_url} alt={image.name} />
                          ) : (
                            <div className="flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          {image.is_banner && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-lg z-30 border border-primary/20 pointer-events-none">
                              <Star className="h-3 w-3 fill-current" />
                              <span>Banner</span>
                            </div>
                          )}
                          {/* Action buttons floating on hover */}
                          <div
                            className={cn(
                              "absolute bottom-0 right-0 flex items-center justify-end gap-1.5 p-1.5 transition-opacity duration-200",
                              hoveredImageId === image.id
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none"
                            )}
                          >
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBanner(image.id, image.is_banner);
                              }}
                              className="h-8 w-8 p-0 bg-background hover:bg-background border border-border shadow-md pointer-events-auto"
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  image.is_banner && "fill-current"
                                )}
                              />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(image.id);
                              }}
                              className="h-8 w-8 p-0 bg-destructive hover:bg-destructive text-destructive-foreground opacity-100 hover:opacity-100 shadow-md pointer-events-auto"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Note Tab */}
            {activeTab === "note" && (
              <div className="space-y-4">
                <NoteEditor
                  value={noteValue}
                  
                  onChange={setNoteValue}
                  onSave={async () => {
                    if (!data?.id) return;
                    setIsSavingNote(true);
                    try {
                      await updateShowMutation.mutateAsync({
                        id: data.id,
                        input: { note: noteValue },
                      });
                    } catch (error) {
                      console.error("Failed to save note:", error);
                      alert("Failed to save note. Please try again.");
                      setNoteValue(data?.note || "");
                    } finally {
                      setIsSavingNote(false);
                    }
                  }}
                  isSaving={isSavingNote}
                  disabled={isSavingNote}
                  editable={editable}
                  description="Add or edit notes about this show"
                  maxLength={2000}
                />
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === "metadata" && (
              <div className="space-y-6">
                <Card>
                  <div className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Tabs>
      </div>

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
                {previewImage.file_url && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={previewImage.file_url}
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
              {/* Footer with description */}
              {previewImage.description && (
                <div className="px-6 pb-6 bg-black/50 border-t border-border/20">
                  <p className="text-sm text-muted-foreground mt-4">
                    {previewImage.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteImageId}
        onOpenChange={handleDeleteDialogChange}
        title="Delete Image"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>
            <div className="space-y-2">
              <Label
                htmlFor="delete-confirmation"
                className="text-sm font-medium"
              >
                Type <span className="font-mono font-semibold">delete</span> to
                confirm:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                disabled={isDeleting}
                autoFocus
                className="font-mono"
              />
            </div>
          </div>
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: confirmDeleteImage,
          loading: isDeleting,
          disabled:
            deleteConfirmationText.toLowerCase() !== "delete" || isDeleting,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => {
            setDeleteImageId(null);
            setDeleteConfirmationText("");
          },
          disabled: isDeleting,
        }}
      />

      {/* Delete Show Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteShowConfirmationText("");
          }
        }}
        title="Delete Show"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this show? This action cannot be
              undone.
            </p>
            <div className="space-y-2">
              <Label
                htmlFor="delete-show-confirmation"
                className="text-sm font-medium"
              >
                Type <span className="font-mono font-semibold">delete</span> to
                confirm:
              </Label>
              <Input
                id="delete-show-confirmation"
                value={deleteShowConfirmationText}
                onChange={(e) => setDeleteShowConfirmationText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                disabled={isDeletingShow}
                autoFocus
                className="font-mono"
              />
            </div>
          </div>
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: handleConfirmDeleteShow,
          loading: isDeletingShow,
          disabled:
            deleteShowConfirmationText.toLowerCase() !== "delete" ||
            isDeletingShow,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => {
            setShowDeleteDialog(false);
            setDeleteShowConfirmationText("");
          },
          disabled: isDeletingShow,
        }}
      />

      {/* Edit Show Dialog */}
      {data && (
        <EditShowDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={handleEditSubmit}
          show={data}
          title="Edit Show"
        />
      )}
    </Card>
  );
}
