/**
 * Show Detail Component
 *
 * Display detailed information about a show with optional edit and activity views.
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Button, Card, Tabs, Input, Label } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  ConfirmationDialog,
  ActionList,
  NoteEditor,
  ImageGallery,
} from "@truths/custom-ui";
import type { ActionItem } from "@truths/custom-ui";
import {
  Edit,
  Info,
  Database,
  Image as ImageIcon,
  Star,
  Trash2,
  Upload,
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

        // Make a single API call - backend handles unsetting other banners
        const updatedImage = await service.updateShowImage(data.id, imageId, {
          is_banner: newBannerValue,
        });

        // Update local state - unset other banners if setting a new one
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
              <ImageGallery
                images={images.map((img) => ({
                  id: img.id,
                  url: img.file_url,
                  name: img.name,
                  isBanner: img.is_banner,
                }))}
                isLoading={isLoadingImages}
                isUploading={isUploadingImage}
                onUpload={handleImageUpload}
                onDelete={(img) => handleDeleteImage(img.id)}
                onToggleBanner={(img) =>
                  handleToggleBanner(img.id, img.isBanner ?? false)
                }
                readOnly={!editable}
                renderOverlay={(image, isHovered) => (
                  <>
                    {image.isBanner && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-md z-50 border border-primary/20">
                        <Star className="h-3 w-3 fill-current" />
                        <span>Banner</span>
                      </div>
                    )}

                    {!!editable && (
                      <div
                        className={cn(
                          "absolute bottom-0 right-0 flex items-center justify-end gap-1 p-1 transition-opacity duration-200",
                          isHovered
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
                            handleToggleBanner(
                              image.id,
                              image.isBanner ?? false
                            );
                          }}
                          className="h-8 w-8 p-0 bg-background hover:bg-background border border-border shadow-md pointer-events-auto"
                          title={
                            image.isBanner ? "Unset Banner" : "Set as Banner"
                          }
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              image.isBanner && "fill-current"
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
                          title="Delete Image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              />
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
