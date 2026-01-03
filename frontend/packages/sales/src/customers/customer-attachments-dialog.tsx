/**
 * Customer Attachments Management Dialog
 *
 * Dialog component for managing customer document attachments
 *
 * @author Phanny
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Separator,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@truths/ui";
import { X, Upload, File, Loader2, Image as ImageIcon } from "lucide-react";
import { AttachmentService, FileUpload } from "@truths/shared";
import { uploadService } from "@truths/shared";
import { Customer } from "../types";

export interface CustomerAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  attachmentService: AttachmentService;
  onSave?: (attachments: FileUpload[]) => Promise<void>;
  loading?: boolean;
}

export function CustomerAttachmentsDialog({
  open,
  onOpenChange,
  customer,
  attachmentService,
  onSave,
  loading = false,
}: CustomerAttachmentsDialogProps) {
  const [attachments, setAttachments] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load attachments when dialog opens
  useEffect(() => {
    if (open && customer.id) {
      loadAttachments();
    }
  }, [open, customer.id]);

  const loadAttachments = useCallback(async () => {
    try {
      const response = await attachmentService.getAttachmentsForEntity(
        "customer",
        customer.id,
        "document"
      );
      setAttachments(response.items);
    } catch (error) {
      console.error("Failed to load attachments:", error);
    }
  }, [customer.id, attachmentService]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setUploading(true);
      const newAttachments: FileUpload[] = [];
      const failedFiles: string[] = [];

      // Upload files sequentially
      for (const file of files) {
        const fileName = file.name;
        try {
          // Upload file
          const uploadResponse = await uploadService.uploadFile(file);

          // Link to customer
          await attachmentService.linkAttachment("customer", customer.id, {
            file_upload_id: uploadResponse.id,
            attachment_type: "document",
          });

          // Transform FileUploadResponse to FileUpload format
          newAttachments.push({
            id: uploadResponse.id,
            filename: uploadResponse.filename,
            original_name: uploadResponse.originalName,
            mime_type: uploadResponse.mimeType,
            size: uploadResponse.size,
            url: uploadResponse.url,
            uploaded_at: uploadResponse.uploadedAt,
            uploaded_by: null,
          });
        } catch (error) {
          console.error(`Failed to upload file ${fileName}:`, error);
          failedFiles.push(fileName);
        }
      }

      if (newAttachments.length > 0) {
        await loadAttachments(); // Reload to get all attachments
      }

      if (failedFiles.length > 0) {
        const successCount = newAttachments.length;
        const message =
          successCount > 0
            ? `Successfully uploaded ${successCount} file(s). ${failedFiles.length} file(s) failed to upload.`
            : `Failed to upload ${failedFiles.length} file(s). Please try again.`;
        alert(message);
      }

      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [customer.id, attachmentService, loadAttachments]
  );

  const handleRemove = useCallback(
    async (fileUploadId: string) => {
      if (!confirm("Are you sure you want to remove this attachment?")) {
        return;
      }

      setRemoving(fileUploadId);
      try {
        await attachmentService.unlinkAttachment(
          "customer",
          customer.id,
          fileUploadId
        );
        await loadAttachments();
        onSave?.(attachments.filter((a) => a.id !== fileUploadId));
      } catch (error) {
        console.error("Failed to remove attachment:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to remove attachment. Please try again."
        );
      } finally {
        setRemoving(null);
      }
    },
    [customer.id, attachmentService, attachments, loadAttachments, onSave]
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[1200px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Manage Documents
          </DialogTitle>
          <DialogDescription>
            Upload and manage document attachments for{" "}
            <span className="font-medium">
              {customer.name || customer.code}
            </span>
            . Supported formats: Images, PDF, Word, Excel, and text files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Section */}
          <div className="space-y-2">
            <label
              htmlFor={`attachments-${customer.id}`}
              className="text-sm font-medium"
            >
              Upload Documents
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              onChange={handleFileSelect}
              disabled={loading || uploading}
              className="hidden"
              id={`attachments-${customer.id}`}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Files to Upload
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 20MB for documents, 5MB for images
            </p>
          </div>

          <Separator />

          {/* Attachments List */}
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Attached Documents ({attachments.length})
              </label>
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-hidden w-full">
                {attachments.map((attachment) => (
                  <Item
                    key={attachment.id}
                    className="w-full min-w-0 gap-2 p-3"
                  >
                    <ItemMedia className="text-muted-foreground">
                      {getFileIcon(attachment.mime_type)}
                    </ItemMedia>
                    <ItemContent className="overflow-hidden">
                      <ItemTitle className="truncate">
                        {attachment.original_name}
                      </ItemTitle>
                      <ItemDescription className="truncate text-xs">
                        {formatFileSize(attachment.size)} •{" "}
                        {attachment.mime_type}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.url, "_blank")}
                        disabled={loading}
                        className="h-8 px-2 text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(attachment.id)}
                        disabled={loading || removing === attachment.id}
                        className="h-8 w-8"
                      >
                        {removing === attachment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </div>
            ) : (
              <div className="min-h-[100px] p-6 border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center text-center">
                <File className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No documents attached
                </p>
                <p className="text-xs text-muted-foreground">
                  Use the upload button above to add documents
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || uploading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
