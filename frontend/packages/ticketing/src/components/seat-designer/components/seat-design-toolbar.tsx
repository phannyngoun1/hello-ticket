/**
 * Seat Design Toolbar Component
 *
 * Renders ShapeToolbox with built-in compact SeatPlacementControls when seat placement props are provided.
 * Used by both seat-level main view and section-level drill-down for consistent seat design UX.
 */

import { ShapeToolbox, type ShapeToolboxProps } from "./shape-toolbox";
import { SeatPlacementControls, type SeatPlacementControlsProps } from "./seat-placement-controls";

export interface SeatPlacementProps {
  form: SeatPlacementControlsProps["form"];
  uniqueSections: SeatPlacementControlsProps["uniqueSections"];
  sectionsData?: SeatPlacementControlsProps["sectionsData"];
  sectionSelectValue: SeatPlacementControlsProps["sectionSelectValue"];
  onSectionSelectValueChange: SeatPlacementControlsProps["onSectionSelectValueChange"];
  viewingSection?: SeatPlacementControlsProps["viewingSection"];
  onNewSection: SeatPlacementControlsProps["onNewSection"];
  onManageSections?: SeatPlacementControlsProps["onManageSections"];
}

export interface SeatDesignToolbarProps extends ShapeToolboxProps {
  /** When provided and !readOnly, renders compact SeatPlacementControls inside ShapeToolbox */
  seatPlacement?: SeatPlacementProps;
  /** When provided and selectedSeat, renders inline SeatEditControls (replaces marker name + View/Edit/Delete) */
  seatEditControls?: React.ReactNode;
}

export function SeatDesignToolbar({
  seatPlacement,
  seatEditControls,
  readOnly = false,
  ...shapeToolboxProps
}: SeatDesignToolbarProps) {
  const seatPlacementControls =
    seatPlacement && !readOnly ? (
      <SeatPlacementControls compact {...seatPlacement} />
    ) : undefined;

  return (
    <ShapeToolbox
      {...shapeToolboxProps}
      seatPlacementControls={seatPlacementControls}
      seatEditControls={seatEditControls}
      readOnly={readOnly}
    />
  );
}
