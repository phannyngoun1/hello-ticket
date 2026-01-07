import { Image as ImageIcon } from "lucide-react";
import { AttachmentService, FileUpload } from "@truths/shared";
import { Venue } from "./types";
import { EntityProfilePhoto } from "@truths/custom-ui";

export interface VenueProfilePhotoUploadProps {
  venue: Venue;
  attachmentService: AttachmentService;
  currentPhoto?: FileUpload | null;
  onPhotoChange?: (photo: FileUpload | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function VenueProfilePhotoUpload({
  venue,
  attachmentService,
  currentPhoto,
  onPhotoChange,
  disabled = false,
  size = "md",
}: VenueProfilePhotoUploadProps) {
  return (
    <EntityProfilePhoto
      entityId={venue.id}
      entityType="venue"
      defaultImageUrl={venue.image_url || null}
      altText={venue.name}
      FallbackIcon={ImageIcon}
      attachmentService={attachmentService}
      currentPhoto={currentPhoto}
      onPhotoChange={onPhotoChange}
      disabled={disabled}
      size={size}
    />
  );
}
