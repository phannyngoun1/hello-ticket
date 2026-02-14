import { useEffect } from "react";

interface UseSeatDesignerHotkeysProps {
    onUndo?: () => void;
    onRedo?: () => void;
    onSave?: () => void;
    onDelete?: () => void;
    onEscape?: () => void;
    onSelectAll?: () => void;
}

export function useSeatDesignerHotkeys({
    onUndo,
    onRedo,
    onSave,
    onDelete,
    onEscape,
    onSelectAll,
}: UseSeatDesignerHotkeysProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                onUndo?.();
            }

            // Redo: Ctrl+Y, Ctrl+Shift+Z, or Cmd+Shift+Z
            if (
                ((e.ctrlKey || e.metaKey) && e.key === "y") ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
            ) {
                e.preventDefault();
                onRedo?.();
            }

            // Save: Ctrl+S or Cmd+S
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                onSave?.();
            }

            // Delete: Delete or Backspace
            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                onDelete?.();
            }

            // Escape
            if (e.key === "Escape") {
                e.preventDefault();
                onEscape?.();
            }

            // Select All: Ctrl+A or Cmd+A
            if ((e.ctrlKey || e.metaKey) && e.key === "a") {
                e.preventDefault();
                onSelectAll?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onUndo, onRedo, onSave, onDelete, onEscape, onSelectAll]);
}
