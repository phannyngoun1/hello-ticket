import { Button, Card, Label, Textarea } from "@truths/ui";
import { Loader2 } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useState } from "react";
import { ConfirmationDialog } from "../confirmation-dialog";

export interface NoteEditorProps {
  /**
   * Current note value
   */
  value: string;
  /**
   * Callback when note value changes
   */
  onChange: (value: string) => void;
  /**
   * Callback when save button is clicked
   */
  onSave: () => void;
  /**
   * Whether save operation is in progress
   */
  isSaving?: boolean;
  /**
   * Whether the editor is in read-only mode (not editable)
   */
  disabled?: boolean;
  /**
   * Whether the editor is editable (shows save button and enables textarea)
   */
  editable?: boolean;
  /**
   * Maximum character length for the note
   * @default 2000
   */
  maxLength?: number;
  /**
   * Label for the note editor
   * @default "Notes"
   */
  label?: string;
  /**
   * Description text below the label
   */
  description?: string;
  /**
   * Placeholder text for the textarea
   */
  placeholder?: string;
  /**
   * Number of rows for the textarea
   * @default 10
   */
  rows?: number;
  className?: string;
}

export function NoteEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
  disabled = false,
  editable = true,
  maxLength = 2000,
  label = "Notes",
  description,
  placeholder = "Enter notes...",
  rows = 10,
  className,
}: NoteEditorProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Determine if the content has changed from the initial value passed in is tricky
  // without tracking initial state locally or passing it in.
  // For this component, we'll rely on the parent to handle "dirty" state logic if needed for disabling save.
  // However, purely based on UI, we should at least disable save if isSaving is true.

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <Label className="text-sm font-medium">
              {label}
            </Label>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {editable && (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSaving || disabled}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          )}
        </div>
        <div>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            disabled={isSaving || disabled || !editable}
            className="resize-none"
          />
          <div className="text-xs text-muted-foreground text-right mt-1">
            {value.length}/{maxLength} characters
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Save Note"
        description="Are you sure you want to save changes to the note?"
        confirmAction={{
          label: "Save",
          onClick: () => {
            onSave();
            setShowConfirmDialog(false);
          },
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => setShowConfirmDialog(false),
        }}
      />
    </Card>
  );
}
