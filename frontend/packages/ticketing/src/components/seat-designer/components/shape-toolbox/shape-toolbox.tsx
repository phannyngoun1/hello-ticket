import { Card } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import type { SeatMarker, SectionMarker } from "../../types";
import type { ShapeToolboxProps, ShapeToolboxStyle } from "./types";
import { ShapeToolbarSection } from "./shape-toolbar-section";
import { AlignmentToolbarSection } from "./alignment-toolbar-section";
import { SizeControlsSection } from "./size-controls-section";
import { MarkerActionsSection } from "./marker-actions-section";

export function ShapeToolbox({
  shape,
  selection,
  actions,
  styleActions,
  layout = {},
  readOnly = false,
  level = "seat",
}: ShapeToolboxProps) {
  const {
    selectedShapeType,
    onShapeTypeSelect,
  } = shape;
  const {
    selectedSeat,
    selectedSection,
    selectedSeatCount = 0,
    selectedSectionCount = 0,
  } = selection;
  const {
    onSeatEdit,
    onSeatView,
    onSectionEdit,
    onSectionView,
    onSeatDelete,
    onSectionDelete,
  } = actions;
  const {
    onSeatShapeStyleChange,
    onSectionShapeStyleChange,
    onAlign,
  } = styleActions;
  const {
    seatPlacementControls,
    seatEditControls,
    className,
  } = layout;

  const totalSelected = selectedSeatCount + selectedSectionCount;
  const showAlignment = !readOnly && onAlign && totalSelected >= 2;

  const selectedMarker = selectedSeat || selectedSection;
  const markerName = selectedSeat
    ? `${selectedSeat.seat.section} ${selectedSeat.seat.row}-${selectedSeat.seat.seatNumber}`
    : selectedSection
      ? selectedSection.name
      : null;

  const handleEdit =
    selectedSeat && onSeatEdit
      ? () => onSeatEdit(selectedSeat)
      : selectedSection && onSectionEdit
        ? () => onSectionEdit(selectedSection)
        : undefined;
  // View button only for sections (not for seats in toolbar)
  const handleView =
    selectedSection && onSectionView
      ? () => onSectionView(selectedSection)
      : undefined;
  const handleDelete =
    selectedSeat && onSeatDelete
      ? () => onSeatDelete(selectedSeat)
      : selectedSection && onSectionDelete
        ? () => onSectionDelete(selectedSection)
        : undefined;

  const markerShape = selectedSeat?.shape ?? selectedSection?.shape;
  const onStyleChange =
    selectedSeat && onSeatShapeStyleChange
      ? (style: ShapeToolboxStyle) => onSeatShapeStyleChange(selectedSeat.id, style)
      : selectedSection && onSectionShapeStyleChange
        ? (style: ShapeToolboxStyle) => onSectionShapeStyleChange(selectedSection.id, style)
        : undefined;

  const isEditMode = !!(selectedSeat && seatEditControls);

  return (
    <Card className={cn("px-3 py-2.5", className)}>
      <div className="flex items-center gap-3 flex-wrap w-full">
        {!isEditMode && (
          <ShapeToolbarSection
            selectedShapeType={selectedShapeType}
            onShapeTypeSelect={onShapeTypeSelect}
            readOnly={readOnly}
            level={level}
          />
        )}

        {showAlignment && (
          <AlignmentToolbarSection onAlign={onAlign} />
        )}

        {!isEditMode &&
          !selectedMarker &&
          selectedShapeType &&
          seatPlacementControls && (
            <div className="flex items-center gap-2 border-l pl-2.5">
              {seatPlacementControls}
            </div>
          )}

        {!isEditMode && markerShape && (
          <SizeControlsSection
            markerShape={markerShape}
            onStyleChange={onStyleChange}
          />
        )}

        {selectedSeat && seatEditControls
          ? seatEditControls
          : selectedMarker &&
            markerName && (
              <MarkerActionsSection
                markerName={markerName}
                isSection={!!selectedSection}
                readOnly={readOnly}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
      </div>
    </Card>
  );
}
