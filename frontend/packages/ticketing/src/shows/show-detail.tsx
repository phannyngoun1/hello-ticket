/**
 * Show Detail Component
 *
 * Display detailed information about a show with optional edit and activity views.
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  
  
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  MoreVertical,
  Info,
  Database,
  Image as ImageIcon,
} from "lucide-react";
import { Show, ShowImage } from "./types";
import { useShowService } from "./show-provider";

export interface ShowDetailProps {
  className?: string;
  data?: Show;
  loading?: boolean;
  error?: Error | null;
  
  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (data: Show) => void;
  
  customActions?: (data: Show) => React.ReactNode;
}

export function ShowDetail({
  className,
  data,
  loading = false,
  error = null,
  
  showMetadata = false,
  editable = true,
  onEdit,
  
  customActions,
}: ShowDetailProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "images" | "metadata">("profile");
  const service = useShowService();
  const [images, setImages] = useState<ShowImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Load images when data is available
  useEffect(() => {
    if (!data?.id) return;

    const loadImages = async () => {
      setIsLoadingImages(true);
      try {
        const loadedImages = await service.fetchShowImages(data.id);
        setImages(loadedImages);
      } catch (error) {
        console.error("Failed to load images:", error);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
  }, [data?.id, service]);

  // All hooks must be called before any early returns
  
  const getShowDisplayName = () => {
    
    
    
    return data?.code || data?.id || "";
    
    
    
    
    
    
    
    return data?.id || "";
  };
  

  const displayName = useMemo(
    () =>
      data
        ? getShowDisplayName()
        : "",
    [data, data?.code]
  );

  

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "N/A";
      const potentialDate = new Date(trimmed);
      if (!Number.isNaN(potentialDate.getTime())) {
        return potentialDate.toLocaleString();
      }
      return trimmed;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No show selected</div>
        </div>
      </Card>
    );
  }

  const hasMetadata = showMetadata;
  const hasImages = images.length > 0;

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
              
              <Info className="h-10 w-10 text-primary" />
              
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              
              
              {data.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {data.code}
                </p>
              )}
              
              
              
              
              
              
              
              
              
              
              
              
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {customActions?.(data)}
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {editable && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                      <Edit className="mr-2 h-3.5 w-3.5" /> Edit show
                    </DropdownMenuItem>
                  )}

                  

                  {customActions && customActions(data)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b mb-4">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("profile")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Profile
                </span>
              </button>
              {(hasImages || isLoadingImages) && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "images"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("images")}
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images {hasImages && `(${images.length})`}
                  </span>
                </button>
              )}
              {hasMetadata && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "metadata"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("metadata")}
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Metadata
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-0">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Basic Information
                    </h3>
                    <dl className="space-y-3">
                      
                      
                      
                      
                      
                      <div>
                        <dt className="text-sm font-medium">Code</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(data.code)}
                        </dd>
                      </div>
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      <div>
                        <dt className="text-sm font-medium">Name</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(data.name)}
                        </dd>
                      </div>
                      
                      
                      
                      
                      
                      
                      
                    </dl>
                  </div>

                  

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Timeline
                    </h3>
                    <dl className="space-y-3">
                      {data.created_at && (
                        <div>
                          <dt className="text-sm font-medium">Created</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(data.created_at)}
                          </dd>
                        </div>
                      )}
                      {data.updated_at && (
                        <div>
                          <dt className="text-sm font-medium">Last Updated</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(data.updated_at)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === "images" && (
              <div className="space-y-6">
                {isLoadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">Loading images...</div>
                  </div>
                ) : images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No images uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          {image.file_url ? (
                            <img
                              src={image.file_url}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {image.is_banner && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                              Banner
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-sm truncate">{image.name}</h4>
                          {image.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {image.description}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === "metadata" && (
              <div className="space-y-6">
                <Card>
                  <div className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </Card>
  );
}
