# Ticket Brokerage System - Module/Package Structure

Based on the brainstorm document and your existing architecture (`application/`, `domain/`, `infrastructure/`, `presentation/`), here's the recommended module structure:

## 📦 Core Modules to Create

### 1. **Events Module** (`app/domain/events/`, `app/application/events/`, etc.)

**Purpose**: Event lifecycle, search, discovery, templates

**Domain Entities:**

- `Event` (extends/relates to Item)
- `EventStatus` (enum)
- `EventType` (enum)

**Application Services:**

- `EventService` - CRUD, search, status management
- `EventTemplateService` - Reusable event configurations

**Repositories:**

- `EventRepository`

**API Routes:**

- `presentation/core/routes/event_routes.py`

---

### 2. **Venues Module** (`app/domain/venues/`)

**Purpose**: Venue management, seat map configuration

**Domain Entities:**

- `Venue`
- `VenueType` (enum)
- `Seat` (physical seat definition)
- `SeatType` (enum: STANDARD, VIP, WHEELCHAIR, COMPANION)

**Application Services:**

- `VenueService` - CRUD, seat map management
- `SeatMapService` - Seat map visualization, coordinate management

**Repositories:**

- `VenueRepository`
- `SeatRepository`

**API Routes:**

- `presentation/core/routes/venue_routes.py`

---

### 3. **Event Seating & Inventory Module** (`app/domain/event_seating/`)

**Purpose**: Event-specific seat pricing, ownership, availability (core brokerage inventory)

**Domain Entities:**

- `EventSeat` (junction: event + seat + pricing + ownership)
- `EventSeatStatus` (enum: AVAILABLE, RESERVED, SOLD, BLOCKED, HELD)
- `OwnershipStatus` (enum: NOT_OWNED, OWNED, RETURNED_TO_SUPPLIER)
- `PriceLevel`
- `Hold` (artist/promoter holds)

**Application Services:**

- `EventSeatService` - Availability queries, ownership management
- `PriceLevelService` - Pricing management
- `HoldService` - Hold management, release

**Repositories:**

- `EventSeatRepository`
- `PriceLevelRepository`
- `HoldRepository`

**API Routes:**

- `presentation/core/routes/event_seating_routes.py`
- `presentation/core/routes/inventory_routes.py` (for owned-seat inventory)

---

### 4. **Bookings Module** (`app/domain/bookings/`)

**Purpose**: Booking lifecycle, multi-ticket support, seat selection helpers

**Domain Entities:**

- `Booking`
- `BookingStatus` (enum: PENDING, RESERVED, CONFIRMED, PAID, CANCELLED, REFUNDED)
- `BookingItem` (line items - one per ticket)
- `SaleBooking` (extends Booking for customer sales)

**Application Services:**

- `BookingService` - Create, update, cancel bookings
- `SeatSelectionService` - Find adjacent seats, best available, validate selection
- `BookingCancellationService` - Full/partial cancellation logic

**Repositories:**

- `BookingRepository`
- `BookingItemRepository`

**API Routes:**

- `presentation/core/routes/booking_routes.py`

---

### 5. **Tickets Module** (`app/domain/tickets/`)

**Purpose**: Ticket generation, validation, scanning, transfers (tickets created at reservation time)

**Domain Entities:**

- `Ticket`
- `TicketStatus` (enum: RESERVED, CONFIRMED, CANCELLED, TRANSFERRED, USED)
- `TicketTransfer` (for ticket transfers)

**Application Services:**

- `TicketService` - Generate tickets, validate barcodes/QR codes
- `TicketScanningService` - Entry validation, duplicate detection
- `TicketTransferService` - Transfer tickets between customers

**Repositories:**

- `TicketRepository`

**API Routes:**

- `presentation/core/routes/ticket_routes.py`
- `presentation/core/routes/ticket_scanning_routes.py`

---

### 6. **Guests Module** (`app/domain/guests/`)

**Purpose**: Guest information, classification, check-in

**Domain Entities:**

- `Guest`
- `GuestType` (enum: PRIMARY, COMPANION, CHILD, VIP, STAFF, PRESS)
- `GuestClassification` (enum: INDIVIDUAL, GROUP_LEADER, CORPORATE, MEMBER)
- `ClassificationRule`

**Application Services:**

- `GuestService` - Register, update guest info
- `GuestClassificationService` - Classify guests based on rules

**Repositories:**

- `GuestRepository`
- `ClassificationRuleRepository`

**API Routes:**

- `presentation/core/routes/guest_routes.py`

---

### 7. **Payments Module** (`app/domain/payments/`)

**Purpose**: Payment processing, refunds, gateway integration

**Domain Entities:**

- `PaymentTransaction`
- `PaymentStatus` (enum: PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED, DISPUTED)
- `PaymentMethod` (enum)
- `Refund`

**Application Services:**

- `PaymentService` - Process payments, handle webhooks
- `RefundService` - Process refunds (full/partial)

**Repositories:**

- `PaymentTransactionRepository`
- `RefundRepository`

**Infrastructure:**

- `infrastructure/payments/stripe_adapter.py`
- `infrastructure/payments/paypal_adapter.py`

**API Routes:**

- `presentation/core/routes/payment_routes.py`

---

### 8. **Promotions Module** (`app/domain/promotions/`)

**Purpose**: Promotions, discount codes, usage tracking

**Domain Entities:**

- `Promotion`
- `PromotionType` (enum: PERCENTAGE_DISCOUNT, FIXED_DISCOUNT, etc.)
- `CustomerPromotionUsage`

**Application Services:**

- `PromotionService` - Create, validate, apply promotions
- `PromotionValidationService` - Check eligibility, usage limits

**Repositories:**

- `PromotionRepository`
- `PromotionUsageRepository`

**API Routes:**

- `presentation/core/routes/promotion_routes.py`

---

### 9. **PreSales Module** (`app/domain/presales/`)

**Purpose**: Pre-sale access codes, eligibility, seat allocation

**Domain Entities:**

- `PreSale`
- `PreSaleAccessCode` (optional - if you want separate code management)

**Application Services:**

- `PreSaleService` - Create presales, validate access codes
- `PreSaleEligibilityService` - Check customer eligibility

**Repositories:**

- `PreSaleRepository`

**API Routes:**

- `presentation/core/routes/presale_routes.py`

---

### 10. **Suppliers Module** (`app/domain/suppliers/`)

**Purpose**: Supplier management, purchase orders, accounts payable

**Domain Entities:**

- `Supplier` (extends Customer)
- `SupplierType` (enum: EVENT_ORGANIZER, VENUE_OWNER, PROMOTER, etc.)
- `PurchaseOrder`
- `PurchaseOrderStatus` (enum: DRAFT, PENDING, CONFIRMED, PARTIALLY_RECEIVED, COMPLETED, CANCELLED)
- `PurchaseOrderLine`
- `AccountsPayable`
- `SupplierDeliveryReceipt` (for ticket receipts after PO completion)

**Application Services:**

- `SupplierService` - CRUD suppliers
- `PurchaseOrderService` - Create, confirm, receive POs
- `AccountsPayableService` - Track and pay invoices
- `SupplierReceiptService` - Generate delivery receipts

**Repositories:**

- `SupplierRepository`
- `PurchaseOrderRepository`
- `PurchaseOrderLineRepository`
- `AccountsPayableRepository`

**API Routes:**

- `presentation/core/routes/supplier_routes.py`
- `presentation/core/routes/purchase_order_routes.py`
- `presentation/core/routes/accounts_payable_routes.py`

---

### 11. **Sales Module** (`app/domain/sales/`)

**Purpose**: Customer sales, profit tracking, sales reporting

**Application Services:**

- `SalesService` - Create customer sales, track profit
- `SalesReportingService` - Revenue, profit reports

**Note**: This can extend `BookingService` since sales are bookings with profit tracking.

**API Routes:**

- `presentation/core/routes/sales_routes.py`

---

### 12. **Notifications Module** (`app/application/notifications/`)

**Purpose**: Email, SMS, push notifications

**Application Services:**

- `EmailNotificationService`
- `SMSNotificationService`
- `PushNotificationService`

**Infrastructure:**

- `infrastructure/notifications/sendgrid_adapter.py`
- `infrastructure/notifications/twilio_adapter.py`

**API Routes:**

- `presentation/core/routes/notification_routes.py`

---

### 13. **Analytics Module** (`app/domain/analytics/`, `app/application/analytics/`)

**Purpose**: Reporting, forecasting, recommendations (can be Phase 2+)

**Domain Entities:**

- `RealtimeSalesData`
- `RevenueForecast`
- `PerformanceCost`
- `SalesRecommendation`

**Application Services:**

- `AnalyticsService` - Real-time metrics
- `ForecastingService` - Revenue forecasting
- `RecommendationService` - AI-powered recommendations

**Repositories:**

- `AnalyticsRepository`

**API Routes:**

- `presentation/core/routes/analytics_routes.py`

---

## 🗂️ Recommended Directory Structure

```
backend/app/
├── domain/
│   ├── events/
│   │   ├── __init__.py
│   │   ├── event.py
│   │   ├── event_status.py
│   │   └── event_type.py
│   ├── venues/
│   │   ├── __init__.py
│   │   ├── venue.py
│   │   ├── seat.py
│   │   └── seat_type.py
│   ├── event_seating/
│   │   ├── __init__.py
│   │   ├── event_seat.py
│   │   ├── price_level.py
│   │   ├── hold.py
│   │   └── ownership_status.py
│   ├── bookings/
│   │   ├── __init__.py
│   │   ├── booking.py
│   │   ├── booking_item.py
│   │   └── sale_booking.py
│   ├── tickets/
│   │   ├── __init__.py
│   │   ├── ticket.py
│   │   └── ticket_transfer.py
│   ├── guests/
│   │   ├── __init__.py
│   │   ├── guest.py
│   │   └── classification_rule.py
│   ├── payments/
│   │   ├── __init__.py
│   │   ├── payment_transaction.py
│   │   └── refund.py
│   ├── promotions/
│   │   ├── __init__.py
│   │   ├── promotion.py
│   │   └── promotion_usage.py
│   ├── presales/
│   │   ├── __init__.py
│   │   └── presale.py
│   ├── suppliers/
│   │   ├── __init__.py
│   │   ├── supplier.py
│   │   ├── purchase_order.py
│   │   ├── purchase_order_line.py
│   │   ├── accounts_payable.py
│   │   └── supplier_delivery_receipt.py
│   └── sales/
│       ├── __init__.py
│       └── sales_report.py
│
├── application/
│   ├── events/
│   │   ├── __init__.py
│   │   ├── event_service.py
│   │   └── event_template_service.py
│   ├── venues/
│   │   ├── __init__.py
│   │   ├── venue_service.py
│   │   └── seat_map_service.py
│   ├── event_seating/
│   │   ├── __init__.py
│   │   ├── event_seat_service.py
│   │   ├── price_level_service.py
│   │   └── hold_service.py
│   ├── bookings/
│   │   ├── __init__.py
│   │   ├── booking_service.py
│   │   ├── seat_selection_service.py
│   │   └── booking_cancellation_service.py
│   ├── tickets/
│   │   ├── __init__.py
│   │   ├── ticket_service.py
│   │   ├── ticket_scanning_service.py
│   │   └── ticket_transfer_service.py
│   ├── guests/
│   │   ├── __init__.py
│   │   ├── guest_service.py
│   │   └── guest_classification_service.py
│   ├── payments/
│   │   ├── __init__.py
│   │   ├── payment_service.py
│   │   └── refund_service.py
│   ├── promotions/
│   │   ├── __init__.py
│   │   ├── promotion_service.py
│   │   └── promotion_validation_service.py
│   ├── presales/
│   │   ├── __init__.py
│   │   ├── presale_service.py
│   │   └── presale_eligibility_service.py
│   ├── suppliers/
│   │   ├── __init__.py
│   │   ├── supplier_service.py
│   │   ├── purchase_order_service.py
│   │   ├── accounts_payable_service.py
│   │   └── supplier_receipt_service.py
│   ├── sales/
│   │   ├── __init__.py
│   │   ├── sales_service.py
│   │   └── sales_reporting_service.py
│   └── notifications/
│       ├── __init__.py
│       ├── email_notification_service.py
│       ├── sms_notification_service.py
│       └── push_notification_service.py
│
├── infrastructure/
│   ├── repositories/
│   │   ├── events/
│   │   ├── venues/
│   │   ├── event_seating/
│   │   ├── bookings/
│   │   ├── tickets/
│   │   ├── guests/
│   │   ├── payments/
│   │   ├── promotions/
│   │   ├── presales/
│   │   ├── suppliers/
│   │   └── sales/
│   ├── payments/
│   │   ├── stripe_adapter.py
│   │   └── paypal_adapter.py
│   └── notifications/
│       ├── sendgrid_adapter.py
│       └── twilio_adapter.py
│
└── presentation/
    └── core/
        └── routes/
            ├── event_routes.py
            ├── venue_routes.py
            ├── event_seating_routes.py
            ├── inventory_routes.py
            ├── booking_routes.py
            ├── ticket_routes.py
            ├── ticket_scanning_routes.py
            ├── guest_routes.py
            ├── payment_routes.py
            ├── promotion_routes.py
            ├── presale_routes.py
            ├── supplier_routes.py
            ├── purchase_order_routes.py
            ├── accounts_payable_routes.py
            ├── sales_routes.py
            └── notification_routes.py
```

---

## 🚀 Implementation Priority (MVP First)

### Phase 1: Foundation

1. ✅ **Events Module** - Basic CRUD
2. ✅ **Venues Module** - Venue + Seat definitions
3. ✅ **Event Seating Module** - EventSeat, PriceLevel, ownership tracking

### Phase 2: Core Booking Flow

4. ✅ **Bookings Module** - Booking lifecycle
5. ✅ **Tickets Module** - Ticket generation (at reservation time)
6. ✅ **Payments Module** - Payment processing

### Phase 3: Brokerage Operations

7. ✅ **Suppliers Module** - Purchase orders, receipt generation
8. ✅ **Sales Module** - Customer sales, profit tracking

### Phase 4: Enhanced Features

9. ✅ **Guests Module** - Guest management
10. ✅ **Promotions Module** - Discount codes
11. ✅ **PreSales Module** - Access codes
12. ✅ **Notifications Module** - Email/SMS

### Phase 5: Advanced (Later)

13. ✅ **Analytics Module** - Reporting, forecasting

---

## 📝 Notes

- **Reuse existing modules**: `customers/`, `addresses/`, `audit_logs/` (for audit trail)
- **Shared concerns**: Multi-tenancy (`tenant_id`), timestamps, UUIDs
- **Cross-cutting**: Validation, error handling, logging (in `shared/`)
- **Database**: Use Alembic migrations for each module's tables

---

**Next Steps:**

1. Start with Phase 1 modules (Events, Venues, Event Seating)
2. Create domain entities first, then repositories, then services, then routes
3. Write tests as you go (unit tests for services, integration tests for APIs)
