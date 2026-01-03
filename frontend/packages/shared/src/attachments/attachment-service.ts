/**
 * Attachment Service
 *
 * Service for managing file attachments linked to entities
 *
 * @author Phanny
 */

import { ApiClient, ServiceConfig } from "../api/types";

export interface AttachmentEndpoints extends Record<string, string> {
  attachments: string;
  entityAttachments: string;
  profilePhoto: string;
}

export type AttachmentServiceConfig = ServiceConfig<AttachmentEndpoints>;

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

export class AttachmentService {
  private config: AttachmentServiceConfig;
  private apiClient: ApiClient;

  constructor(config: AttachmentServiceConfig) {
    this.config = config;
    this.apiClient = config.apiClient;
  }

  private getEndpoint(key: keyof AttachmentEndpoints = "attachments") {
    const defaultEndpoints: AttachmentEndpoints = {
      attachments: "/api/v1/shared/attachments",
      entityAttachments: "/api/v1/shared/attachments/entity",
      profilePhoto: "/api/v1/shared/attachments/entity",
    };
    return this.config.endpoints?.[key] || defaultEndpoints[key];
  }

  /**
   * Get all attachments for an entity
   */
  async getAttachmentsForEntity(
    entityType: string,
    entityId: string,
    attachmentType?: string
  ): Promise<AttachmentListResponse> {
    const queryParams = new URLSearchParams();
    if (attachmentType) {
      queryParams.append("attachment_type", attachmentType);
    }

    const url = `${this.getEndpoint("entityAttachments")}/${entityType}/${entityId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await this.apiClient.get<AttachmentListResponse>(url, {
      requiresAuth: true,
    });
    return response;
  }

  /**
   * Link a file upload to an entity
   */
  async linkAttachment(
    entityType: string,
    entityId: string,
    request: LinkAttachmentRequest
  ): Promise<void> {
    await this.apiClient.post(
      `${this.getEndpoint("entityAttachments")}/${entityType}/${entityId}`,
      request,
      { requiresAuth: true }
    );
  }

  /**
   * Unlink a file upload from an entity
   */
  async unlinkAttachment(
    entityType: string,
    entityId: string,
    fileUploadId: string
  ): Promise<void> {
    await this.apiClient.delete(
      `${this.getEndpoint("entityAttachments")}/${entityType}/${entityId}/${fileUploadId}`,
      { requiresAuth: true }
    );
  }

  /**
   * Set attachments for an entity (replaces existing attachments of the same type)
   */
  async setAttachments(
    entityType: string,
    entityId: string,
    request: SetAttachmentsRequest
  ): Promise<AttachmentListResponse> {
    const response = await this.apiClient.put<AttachmentListResponse>(
      `${this.getEndpoint("entityAttachments")}/${entityType}/${entityId}`,
      request,
      { requiresAuth: true }
    );
    return response;
  }

  /**
   * Get profile photo for an entity
   */
  async getProfilePhoto(
    entityType: string,
    entityId: string
  ): Promise<FileUpload | null> {
    const response = await this.apiClient.get<FileUpload | null>(
      `${this.getEndpoint("profilePhoto")}/${entityType}/${entityId}/profile-photo`,
      { requiresAuth: true }
    );
    return response;
  }

  /**
   * Set profile photo for an entity
   */
  async setProfilePhoto(
    entityType: string,
    entityId: string,
    request: SetProfilePhotoRequest
  ): Promise<FileUpload> {
    const response = await this.apiClient.put<FileUpload>(
      `${this.getEndpoint("profilePhoto")}/${entityType}/${entityId}/profile-photo`,
      request,
      { requiresAuth: true }
    );
    return response;
  }

  /**
   * Remove profile photo from an entity
   */
  async removeProfilePhoto(
    entityType: string,
    entityId: string
  ): Promise<void> {
    await this.apiClient.delete(
      `${this.getEndpoint("profilePhoto")}/${entityType}/${entityId}/profile-photo`,
      { requiresAuth: true }
    );
  }
}

