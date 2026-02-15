/**
 * Instructions Panel Component
 * 
 * Displays instructions for using the seat designer
 */

export interface InstructionsPanelProps {
  designMode: "seat-level" | "section-level";
  sectionCount?: number;
  isFullscreen?: boolean;
}

export function InstructionsPanel({
  designMode,
  sectionCount = 0,
  isFullscreen = false,
}: InstructionsPanelProps) {
  return (
    <div className="text-xs text-gray-500 space-y-0.5">
      {designMode === "seat-level" ? (
        <>
          <p>
            Click on the image to place seats. Adjust section, row, seat
            number, and type above.
          </p>
          <p>Drag seats to reposition them.</p>
        </>
      ) : (
        <>
          <p>
            Click on the image to place sections. After placing, click a
            section to add its floor plan and seats.
          </p>
          {sectionCount > 0 && (
            <p>
              {sectionCount} section(s) placed. Click any section to add its
              floor plan.
            </p>
          )}
        </>
      )}
      {!isFullscreen && (
        <p className="text-xs mt-1">
          💡 Tip: Use the fullscreen button for a larger workspace
        </p>
      )}
    </div>
  );
}

