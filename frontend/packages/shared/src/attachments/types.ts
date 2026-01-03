/**
 * Attachment Types
 *
 * Type definitions for file attachments linked to entities
 *
 * @author Phanny
 */

export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  uploaded_by?: string | null;
}

export interface AttachmentListResponse {
  items: FileUpload[];
  total: number;
}

export interface LinkAttachmentRequest {
  file_upload_id: string;
  attachment_type?: string;
}

export interface SetAttachmentsRequest {
  file_upload_ids: string[];
  attachment_type?: string;
}

export interface SetProfilePhotoRequest {
  file_upload_id: string;
}

