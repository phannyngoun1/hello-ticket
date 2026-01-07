/**
 * Entity Profile Photo Upload Component
 *
 * Generic component for uploading and managing profile photos for various entities
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Camera, Loader2, Pencil } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { uploadService } from "@truths/shared";
import { AttachmentService, FileUpload } from "@truths/shared";

export interface EntityProfilePhotoProps {
  entityId: string;
  entityType: string;
  defaultImageUrl: string | null;
  altText: string;
  FallbackIcon: React.ComponentType<{ className?: string }>;
  attachmentService: AttachmentService;
  currentPhoto?: FileUpload | null;
  onPhotoChange?: (photo: FileUpload | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-20 w-20",
  lg: "h-32 w-32",
};

const iconSizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function EntityProfilePhoto({
  entityId,
  entityType,
  defaultImageUrl,
  altText,
  FallbackIcon,
  attachmentService,
  currentPhoto,
  onPhotoChange,
  disabled = false,
  size = "md",
}: EntityProfilePhotoProps) {
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhoto?.url || defaultImageUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentPhoto or defaultImageUrl changes
  useEffect(() => {
    if (currentPhoto?.url) {
      setPreviewUrl(currentPhoto.url);
      return;
    }
    
    if (defaultImageUrl) {
      setPreviewUrl(defaultImageUrl);
      return;
    }

    // If neither is available, try to fetch from service
    // This handles cases where entity doesn't have image URL field (like Employee)
    // or when it's missing (fallback for Venue)
    let isMounted = true;
    
    const fetchProfilePhoto = async () => {
      try {
        // Avoid fetching if we already have a preview URL that might be manually set? 
        // No, we want to sync with props primarily.
        // But if this is initial load and inputs are null, we fetch.
        
        const photo = await attachmentService.getProfilePhoto(entityType, entityId);
        if (isMounted && photo?.url) {
          setPreviewUrl(photo.url);
          // We can optionally notify parent, but parent might default to null if it doesn't support the field
          if (onPhotoChange) {
            onPhotoChange(photo);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${entityType} profile photo:`, error);
      }
    };

    fetchProfilePhoto();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhoto, defaultImageUrl, entityId, entityType]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (5MB for images)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      setUploading(true);
      try {
        // Upload file
        const uploadResponse = await uploadService.uploadFile(file);

        // Set as profile photo
        const profilePhoto = await attachmentService.setProfilePhoto(
          entityType,
          entityId,
          { file_upload_id: uploadResponse.id }
        );

        // Update preview
        setPreviewUrl(profilePhoto.url);
        onPhotoChange?.(profilePhoto);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error(`Failed to upload ${entityType} photo:`, error);
        alert(
          error instanceof Error
            ? error.message
            : `Failed to upload ${entityType} photo. Please try again.`
        );
      } finally {
        setUploading(false);
      }
    },
    [entityId, entityType, attachmentService, onPhotoChange]
  );

  const hasPhoto = !!previewUrl;

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
        id={`${entityType}-photo-${entityId}`}
      />
      
      <div
        className={cn(
          "relative group transition-all",
          sizeClasses[size]
        )}
        onMouseEnter={() => !disabled && !uploading && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <PhotoProvider>
          {hasPhoto && previewUrl ? (
            <PhotoView src={previewUrl}>
              <Avatar 
                className={cn(
                  sizeClasses[size], 
                  "border-2 border-border",
                  !disabled && !uploading && "cursor-pointer"
                )}
              >
                <AvatarImage src={previewUrl} alt={altText} />
              </Avatar>
            </PhotoView>
          ) : (
            <Avatar className={cn(sizeClasses[size], "border-2 border-border")}>
              <AvatarFallback className="bg-muted text-muted-foreground">
                <FallbackIcon className={cn(iconSizeClasses[size], "text-muted-foreground/50")} />
              </AvatarFallback>
            </Avatar>
          )}
        </PhotoProvider>

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className={cn(iconSizeClasses[size], "animate-spin text-primary")} />
          </div>
        )}

        {/* Hover overlay for add photo (when no photo exists) */}
        {!uploading && hovered && !disabled && !hasPhoto && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              title="Add photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Edit icon at bottom edge (when photo exists) */}
        {hasPhoto && !uploading && !disabled && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute bottom-0 right-0 h-6 w-6 bg-primary text-primary-foreground border-2 border-background rounded-full shadow-md hover:bg-primary/90 transition-all",
              hovered ? "opacity-100 scale-100" : "opacity-80 scale-95"
            )}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title="Edit photo"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

    </div>
  );
}
