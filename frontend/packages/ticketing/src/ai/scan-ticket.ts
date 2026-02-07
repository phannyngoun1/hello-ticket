/**
 * Scan ticket API: POST event_id/tickets/scan with code from barcode/QR.
 */

import { api } from "@truths/api";

export interface ScanTicketResponse {
  ticket_id: string;
  ticket_number: string;
  event_seat_id: string;
  section_name?: string | null;
  row_name?: string | null;
  seat_number?: string | null;
  scanned_at: string;
}

export async function scanTicket(
  eventId: string,
  code: string
): Promise<ScanTicketResponse> {
  return api.post<ScanTicketResponse>(
    `/api/v1/ticketing/events/${eventId}/tickets/scan`,
    { code },
    { requiresAuth: true }
  );
}
