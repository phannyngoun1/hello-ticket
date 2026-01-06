

import {
  Button,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  FileText,
  Eye,
  Download,
  Image as ImageIcon,
  File,
  Loader2,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
// We need a shared type for FileUpload/Attachment if possible, but for now we can define a generous interface
// or import from @truths/shared if available. Based on customer-detail.tsx, it uses AttachmentService and FileUpload from @truths/shared.
import { FileUpload } from "@truths/shared";

interface DocumentListProps {
  documents: FileUpload[];
  isLoading?: boolean;
  onManageAttachments?: () => void;
  className?: string;
  loading?: boolean; // Generic loading state for actions
}

export function DocumentList({
  documents,
  isLoading = false,
  onManageAttachments,
  className,
  loading = false,
}: DocumentListProps) {
  
  const handleDownload = (file: FileUpload) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.original_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium mb-1">No documents</p>
          <p className="text-xs">
            {onManageAttachments
              ? "Click 'Manage Documents' to upload files"
              : "No documents have been uploaded"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 w-full">
          <PhotoProvider>
            <div className="space-y-2 max-h-[600px] overflow-y-auto overflow-x-hidden w-full">
              {documents.map((attachment) => {
                const isImage = attachment.mime_type.startsWith("image/");
                return (
                  <Item
                    key={attachment.id}
                    className="w-full min-w-0 gap-2 p-3"
                  >
                    <ItemMedia className="text-muted-foreground">
                      {isImage ? (
                        <PhotoView src={attachment.url}>
                          <img
                            src={attachment.url}
                            alt={attachment.original_name}
                            className="h-10 w-10 object-cover rounded cursor-pointer border border-border"
                          />
                        </PhotoView>
                      ) : (
                        getFileIcon(attachment.mime_type)
                      )}
                    </ItemMedia>
                    <ItemContent className="overflow-hidden">
                      <ItemTitle className="truncate">
                        {isImage ? (
                          <PhotoView src={attachment.url}>
                            <span className="cursor-pointer hover:text-primary">
                              {attachment.original_name}
                            </span>
                          </PhotoView>
                        ) : (
                          attachment.original_name
                        )}
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
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(attachment)}
                        disabled={loading}
                        className="h-8 w-8"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </ItemActions>
                  </Item>
                );
              })}
            </div>
          </PhotoProvider>
        </div>
      )}
    </div>
  );
}
