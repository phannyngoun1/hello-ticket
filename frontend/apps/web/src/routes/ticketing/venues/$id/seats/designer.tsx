import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SeatDesignerPage } from "../../../../../pages/ticketing/seat-designer-page";

export const Route = createFileRoute("/ticketing/venues/$id/seats/designer")({
  component: SeatDesignerPage,
  validateSearch: z.object({
    layoutId: z.string().optional(),
  }),
});
