-- Migration 024: Create tickets table
-- Description: Creates tickets table to store ticket information for event seats
-- Date: 2025-12-28

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_seat_id VARCHAR(255) NOT NULL,
    booking_id VARCHAR(255),
    
    ticket_number VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    
    price_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    barcode VARCHAR(255),
    qr_code VARCHAR(255),
    transfer_token VARCHAR(255),
    
    reserved_at TIMESTAMP WITH TIME ZONE,
    reserved_until TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    scanned_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    version INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (event_seat_id) REFERENCES event_seats(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS ix_tickets_ticket_number ON tickets(ticket_number);
CREATE UNIQUE INDEX IF NOT EXISTS ix_tickets_barcode ON tickets(barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_tickets_qr_code ON tickets(qr_code) WHERE qr_code IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS ix_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS ix_tickets_event_seat_id ON tickets(event_seat_id);
CREATE INDEX IF NOT EXISTS ix_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS ix_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS ix_tickets_transfer_token ON tickets(transfer_token) WHERE transfer_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_tickets_event_status ON tickets(event_id, status);
CREATE INDEX IF NOT EXISTS ix_tickets_event_seat ON tickets(event_id, event_seat_id);
CREATE INDEX IF NOT EXISTS ix_tickets_booking ON tickets(tenant_id, booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_tickets_tenant_event ON tickets(tenant_id, event_id);

