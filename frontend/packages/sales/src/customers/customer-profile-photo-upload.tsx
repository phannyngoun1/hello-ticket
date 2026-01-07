import { User } from "lucide-react";
import { AttachmentService, FileUpload } from "@truths/shared";
import { Customer } from "../types";
import { EntityProfilePhoto } from "@truths/custom-ui";

export interface CustomerProfilePhotoUploadProps {
  customer: Customer;
  attachmentService: AttachmentService;
  currentPhoto?: FileUpload | null;
  onPhotoChange?: (photo: FileUpload | null) => void;
  disabled?: boolean;
}

export function CustomerProfilePhotoUpload({
  customer,
  attachmentService,
  currentPhoto,
  onPhotoChange,
  disabled,
}: CustomerProfilePhotoUploadProps) {
  return (
    <EntityProfilePhoto
      entityId={customer.id}
      entityType="customer"
      defaultImageUrl={null} // Assuming customer has no image_url field yet, similar to Employee
      altText={customer.name}
      FallbackIcon={User}
      attachmentService={attachmentService}
      currentPhoto={currentPhoto}
      onPhotoChange={onPhotoChange}
      disabled={disabled}
    />
  );
}
