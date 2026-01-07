/**
 * Employee Profile Photo Upload Component
 *
 * Component for uploading and managing employee profile photos
 */

import { User } from "lucide-react";
import { AttachmentService, FileUpload } from "@truths/shared";
import { Employee } from "./types";
import { EntityProfilePhoto } from "packages/custom-ui/src";


export interface EmployeeProfilePhotoUploadProps {
  employee: Employee;
  attachmentService: AttachmentService;
  currentPhoto?: FileUpload | null;
  onPhotoChange?: (photo: FileUpload | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EmployeeProfilePhotoUpload({
  employee,
  attachmentService,
  currentPhoto,
  onPhotoChange,
  disabled = false,
  size = "md",
}: EmployeeProfilePhotoUploadProps) {
  return (
    <EntityProfilePhoto
      entityId={employee.id}
      entityType="employee"
      defaultImageUrl={null}
      altText={employee.name}
      FallbackIcon={User}
      attachmentService={attachmentService}
      currentPhoto={currentPhoto}
      onPhotoChange={onPhotoChange}
      disabled={disabled}
      size={size}
    />
  );
}
