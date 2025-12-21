/**
 * Manage Sections Sheet Component
 *
 * Sheet to list, edit, and delete sections from the database (seat-level mode)
 */


import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Card,
  Button,
} from "@truths/ui";
import { Edit, Trash2 } from "lucide-react";
import type { Section } from "../../../sections/types";

interface ManageSectionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[] | undefined;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
  onNewSection: () => void;
  isDeleting: boolean;
}

export function ManageSectionsSheet({
  open,
  onOpenChange,
  sections,
  onEdit,
  onDelete,
  onNewSection,
  isDeleting,
}: ManageSectionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Manage Sections</SheetTitle>
          <SheetDescription>
            Edit or delete sections for this layout
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {sections?.length || 0} section(s)
            </p>
            <Button size="sm" onClick={onNewSection}>
              + New Section
            </Button>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {sections && sections.length > 0 ? (
              sections.map((section) => (
                <Card key={section.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{section.name}</p>
                      {section.x_coordinate != null &&
                        section.y_coordinate != null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Position: ({section.x_coordinate.toFixed(1)},{" "}
                            {section.y_coordinate.toFixed(1)})
                          </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(section)}
                        className="h-8 px-2"
                        title="Edit section"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(section)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        title="Delete section"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sections found. Create your first section.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
