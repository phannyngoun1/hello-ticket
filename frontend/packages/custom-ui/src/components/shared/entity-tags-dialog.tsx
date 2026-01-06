
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Separator,
} from "@truths/ui";
import { X, Check, ChevronsUpDown, Plus, Tag, Loader2 } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { TagService, TagWithAttachmentStatus } from "@truths/shared";

export interface EntityTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  entityType: string; // "customer" | "organizer" | etc.
  initialTags?: string[];
  tagService: TagService;
  onSave: (tags: string[]) => Promise<void>;
  loading?: boolean;
}

export function EntityTagsDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  entityType,
  initialTags = [],
  tagService,
  onSave,
  loading = false,
}: EntityTagsDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<TagWithAttachmentStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(undefined);

  // Load available tags when dialog opens
  useEffect(() => {
    if (open && entityId) {
      loadAvailableTags();
    }
  }, [open, entityId]);

  // Reset selected tags when dialog opens/closes
  const serializedInitialTags = JSON.stringify(initialTags || []);
  useEffect(() => {
    if (open) {
      setSelectedTags(JSON.parse(serializedInitialTags));
      setSearchQuery("");
      setComboboxOpen(false);
    }
  }, [open, serializedInitialTags]);

  // Update popover width when combobox opens
  useEffect(() => {
    if (comboboxOpen && triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, [comboboxOpen]);

  const loadAvailableTags = useCallback(async () => {
    if (!entityId) return;
    setLoadingTags(true);
    try {
      const response = await tagService.getAvailableTagsForEntity(
        entityType,
        entityId,
        searchQuery || undefined,
        200
      );
      
      // Note: We rely on the prop `initialTags` for the source of truth for "currently selected" tags.
      
      setAvailableTags(response.items);
    } catch (error) {
      console.error("Failed to load available tags:", error);
    } finally {
      setLoadingTags(false);
    }
  }, [entityId, entityType, tagService, searchQuery]);

  // Reload tags when search query changes
  useEffect(() => {
    if (comboboxOpen) {
      const timeoutId = setTimeout(() => {
        loadAvailableTags();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, comboboxOpen, loadAvailableTags]);

  const handleTagSelect = useCallback(
    (tagName: string) => {
      if (!selectedTags.includes(tagName)) {
        setSelectedTags([...selectedTags, tagName]);
      }
      setSearchQuery("");
      setComboboxOpen(false);
    },
    [selectedTags]
  );

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
    },
    [selectedTags]
  );

  const handleCreateNewTag = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setSearchQuery("");
      setComboboxOpen(false);
    }
  }, [searchQuery, selectedTags]);

  const handleSave = useCallback(async () => {
    await onSave(selectedTags);
    onOpenChange(false);
  }, [selectedTags, onSave, onOpenChange]);

  const hasChanges = useMemo(() => {
    const initial = initialTags || [];
    if (selectedTags.length !== initial.length) return true;
    return selectedTags.some((tag) => !initial.includes(tag));
  }, [selectedTags, initialTags]);

  // Filter available tags based on search
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableTags;
    }
    const query = searchQuery.toLowerCase();
    return availableTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query) &&
        !selectedTags.includes(tag.name)
    );
  }, [availableTags, searchQuery, selectedTags]);

  // Check if search query is a new tag (not in available tags)
  const isNewTag = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.trim().toLowerCase();
    return !availableTags.some((tag) => tag.name.toLowerCase() === query);
  }, [searchQuery, availableTags]);

  // Separate attached and unattached tags
  const { attachedTags, unattachedTags } = useMemo(() => {
    const attached: TagWithAttachmentStatus[] = [];
    const unattached: TagWithAttachmentStatus[] = [];
    
    filteredTags.forEach((tag) => {
      if (tag.is_attached) {
        attached.push(tag);
      } else {
        unattached.push(tag);
      }
    });
    
    return { attachedTags: attached, unattachedTags: unattached };
  }, [filteredTags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            Add or remove tags for <span className="font-medium">{entityName}</span>. 
            Select existing tags or create new ones by typing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tag Selector Combobox */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Tags</label>
            <div ref={triggerRef} className="w-full">
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between h-11"
                    disabled={loading || loadingTags}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {loadingTags ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground">Loading tags...</span>
                        </>
                      ) : selectedTags.length > 0 ? (
                        <>
                          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">
                            {selectedTags.length} {selectedTags.length === 1 ? "tag" : "tags"} selected
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {searchQuery || "Search or create tags..."}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0" 
                  align="start"
                  style={popoverWidth ? { width: `${popoverWidth}px` } : undefined}
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search tags or type to create new..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      {loadingTags ? (
                        <div className="py-6 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">Loading tags...</p>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>
                            {isNewTag && searchQuery.trim() ? (
                              <div className="py-2 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={handleCreateNewTag}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create &quot;{searchQuery.trim()}&quot;
                                </Button>
                              </div>
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No tags found.</p>
                                <p className="text-xs mt-1">Type to create a new tag</p>
                              </div>
                            )}
                          </CommandEmpty>
                          
                          {attachedTags.length > 0 && (
                            <CommandGroup heading="Currently Attached">
                              {attachedTags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => handleTagSelect(tag.name)}
                                  className={cn(
                                    "cursor-pointer",
                                    selectedTags.includes(tag.name) && "opacity-50"
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedTags.includes(tag.name)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="flex-1">{tag.name}</span>
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Current
                                  </Badge>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                          
                          {unattachedTags.length > 0 && (
                            <>
                              {attachedTags.length > 0 && <Separator />}
                              <CommandGroup heading="Available Tags">
                                {unattachedTags.map((tag) => (
                                  <CommandItem
                                    key={tag.id}
                                    value={tag.name}
                                    onSelect={() => handleTagSelect(tag.name)}
                                    className={cn(
                                      "cursor-pointer",
                                      selectedTags.includes(tag.name) && "opacity-50"
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTags.includes(tag.name)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <span className="flex-1">{tag.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                          
                          {isNewTag && searchQuery.trim() && (
                            <>
                              {(attachedTags.length > 0 || unattachedTags.length > 0) && <Separator />}
                              <CommandGroup>
                                <CommandItem
                                  value={searchQuery.trim()}
                                  onSelect={handleCreateNewTag}
                                  className="cursor-pointer font-medium"
                                >
                                  <Plus className="mr-2 h-4 w-4 text-primary" />
                                  Create &quot;{searchQuery.trim()}&quot;
                                </CommandItem>
                              </CommandGroup>
                            </>
                          )}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              Type to search existing tags or create a new one
            </p>
          </div>

          <Separator />

          {/* Selected Tags Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Selected Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              </label>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  disabled={loading}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-lg bg-muted/30">
                {selectedTags.map((tag) => {
                  const isCurrentlyAttached = availableTags.find(
                    (t) => t.name === tag && t.is_attached
                  );
                  return (
                    <Badge
                      key={tag}
                      variant={isCurrentlyAttached ? "default" : "secondary"}
                      className={cn(
                        "text-xs flex items-center gap-1.5 pr-1.5 py-1.5 px-2.5",
                        isCurrentlyAttached && "bg-primary/10 text-primary border-primary/20"
                      )}
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        disabled={loading}
                        className="ml-1 rounded-full hover:bg-background/80 p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="min-h-[100px] p-6 border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center text-center">
                <Tag className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No tags selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Use the search box above to add tags
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !hasChanges}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
