/**
 * Profile Photo Upload Component
 *
 * Component for uploading and managing customer profile photos
 *
 * @author Phanny
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Camera, Loader2, User, Pencil } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { uploadService } from "@truths/shared";
import { AttachmentService, FileUpload } from "@truths/shared";
import { Customer } from "../types";

export interface ProfilePhotoUploadProps {
  customer: Customer;
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

export function ProfilePhotoUpload({
  customer,
  attachmentService,
  currentPhoto,
  onPhotoChange,
  disabled = false,
  size = "md",
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhoto?.url || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentPhoto changes
  useEffect(() => {
    setPreviewUrl(currentPhoto?.url || null);
  }, [currentPhoto]);

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
          "customer",
          customer.id,
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
        console.error("Failed to upload profile photo:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to upload profile photo. Please try again."
        );
      } finally {
        setUploading(false);
      }
    },
    [customer.id, attachmentService, onPhotoChange]
  );


  const getInitials = () => {
    const name = customer.name || customer.code || "C";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
        id={`profile-photo-${customer.id}`}
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
                <AvatarImage src={previewUrl} alt={customer.name} />
              </Avatar>
            </PhotoView>
          ) : (
            <Avatar className={cn(sizeClasses[size], "border-2 border-border")}>
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className={cn(iconSizeClasses[size], "text-muted-foreground/50")} />
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

