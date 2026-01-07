/**
 * Organizer Profile Photo Upload Component
 *
 * Component for uploading and managing organizer profile photos (logos)
 *
 * @author Phanny
 */

import { Building2 } from "lucide-react";
import { AttachmentService, FileUpload } from "@truths/shared";
import { Organizer } from "./types";
import { EntityProfilePhoto } from "@truths/custom-ui";

export interface OrganizerProfilePhotoUploadProps {
  organizer: Organizer;
  attachmentService: AttachmentService;
  currentPhoto?: FileUpload | null;
  onPhotoChange?: (photo: FileUpload | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OrganizerProfilePhotoUpload({
  organizer,
  attachmentService,
  currentPhoto,
  onPhotoChange,
  disabled = false,
  size = "md",
}: OrganizerProfilePhotoUploadProps) {
  return (
    <EntityProfilePhoto
      entityId={organizer.id}
      entityType="organizer"
      defaultImageUrl={organizer.logo || null}
      altText={organizer.name}
      FallbackIcon={Building2}
      attachmentService={attachmentService}
      currentPhoto={currentPhoto}
      onPhotoChange={onPhotoChange}
      disabled={disabled}
      size={size}
    />
  );
}
