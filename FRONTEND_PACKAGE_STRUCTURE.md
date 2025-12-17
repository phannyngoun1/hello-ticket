# Frontend Package Structure - Ticket Brokerage System

Based on your existing monorepo structure (`packages/` + `apps/web/`) and the backend modules, here's a **consolidated** frontend package organization:

## 📦 Final Package Structure (3 Core Packages)

**Three main packages:**

1. **`packages/ticketing/`** - Core ticketing (Events, Venues, Seating, Tickets)
2. **`packages/purchasing/`** - Purchasing operations (Suppliers, Purchase Orders, Payments, Accounts Payable)
3. **`packages/sales/`** - Sales & Customer features (EXISTING - extend with Bookings, Guests, Promotions, PreSales)

**Note:** Analytics can be added later as a separate package if needed.

---

## 📦 Detailed Package Structure

### 1. **`packages/ticketing/`** - Core Ticketing System (Consolidated)

**Combines:** Events, Venues, Event Seating, Tickets

**Structure:**

**Structure:**

```
packages/ticketing/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    │
    ├── events/
    │   ├── types.ts                    # Event, EventStatus, EventType
    │   ├── services/
    │   │   ├── event-service.ts
    │   │   └── event-template-service.ts
    │   ├── hooks/
    │   │   ├── use-events.tsx
    │   │   ├── use-event.tsx
    │   │   └── use-event-templates.tsx
    │   ├── components/
    │   │   ├── event-list/
    │   │   ├── event-form/
    │   │   ├── event-detail/
    │   │   └── event-search/
    │   └── index.ts
    │
    ├── venues/
    │   ├── types.ts                    # Venue, Seat, SeatType, VenueType
    │   ├── services/
    │   │   ├── venue-service.ts
    │   │   └── seat-map-service.ts
    │   ├── hooks/
    │   │   ├── use-venues.tsx
    │   │   ├── use-venue.tsx
    │   │   └── use-seat-map.tsx
    │   ├── components/
    │   │   ├── venue-list/
    │   │   ├── venue-form/
    │   │   ├── seat-map/
    │   │   └── seat-management/
    │   └── index.ts
    │
    ├── seating/
    │   ├── types.ts                    # EventSeat, PriceLevel, Hold, OwnershipStatus
    │   ├── services/
    │   │   ├── event-seat-service.ts
    │   │   ├── price-level-service.ts
    │   │   └── hold-service.ts
    │   ├── hooks/
    │   │   ├── use-event-seats.tsx
    │   │   ├── use-seat-availability.tsx
    │   │   ├── use-price-levels.tsx
    │   │   └── use-holds.tsx
    │   ├── components/
    │   │   ├── seat-map/
    │   │   │   ├── interactive-seat-map.tsx    # Main seat selection UI
    │   │   │   ├── seat-status-legend.tsx
    │   │   │   └── seat-tooltip.tsx
    │   │   ├── price-levels/
    │   │   ├── ownership/
    │   │   └── holds/
    │   └── index.ts
    │
    ├── tickets/
    │   ├── types.ts                    # Ticket, TicketStatus, TicketTransfer
    │   ├── services/
    │   │   ├── ticket-service.ts
    │   │   ├── ticket-scanning-service.ts
    │   │   └── ticket-transfer-service.ts
    │   ├── hooks/
    │   │   ├── use-tickets.tsx
    │   │   ├── use-ticket.tsx
    │   │   ├── use-ticket-scanning.tsx
    │   │   └── use-ticket-transfer.tsx
    │   ├── components/
    │   │   ├── ticket-list/
    │   │   ├── ticket-detail/
    │   │   │   ├── ticket-qr-code.tsx
    │   │   │   └── ticket-barcode.tsx
    │   │   ├── ticket-download/
    │   │   ├── scanning/
    │   │   │   ├── ticket-scanner.tsx        # Mobile scanner interface
    │   │   │   ├── scan-history.tsx
    │   │   │   └── scan-stats.tsx
    │   │   └── transfer/
    │   └── index.ts
    │
    └── providers/
        └── ticketing-provider.tsx
```

**Usage:**

- All event, venue, seating, booking, and ticket pages
- Core customer-facing ticketing flow
- Admin ticketing management

---

### 2. **`packages/purchasing/`** - Purchasing Operations (Consolidated)

**Combines:** Suppliers, Purchase Orders, Payments, Accounts Payable, Notifications

**Structure:**

```
packages/purchasing/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    │
    ├── suppliers/
    │   ├── types.ts                    # Supplier, SupplierType
    │   ├── services/
    │   │   └── supplier-service.ts
    │   ├── hooks/
    │   │   ├── use-suppliers.tsx
    │   │   └── use-supplier.tsx
    │   ├── components/
    │   │   ├── supplier-list/
    │   │   ├── supplier-form/
    │   │   └── supplier-detail/
    │   └── index.ts
    │
    ├── purchase-orders/
    │   ├── types.ts                    # PurchaseOrder, POStatus, POLine
    │   ├── services/
    │   │   ├── purchase-order-service.ts
    │   │   └── supplier-receipt-service.ts
    │   ├── hooks/
    │   │   ├── use-purchase-orders.tsx
    │   │   ├── use-purchase-order.tsx
    │   │   └── use-receipts.tsx
    │   ├── components/
    │   │   ├── po-list/
    │   │   ├── po-detail/
    │   │   │   ├── po-line-items.tsx
    │   │   │   └── po-receipt-form.tsx
    │   │   ├── po-form/
    │   │   └── receipts/
    │   │       ├── receipt-viewer.tsx
    │   │       └── receipt-generator.tsx
    │   └── index.ts
    │
    ├── payments/
    │   ├── types.ts                    # PaymentTransaction, PaymentStatus, Refund
    │   ├── services/
    │   │   ├── payment-service.ts
    │   │   └── refund-service.ts
    │   ├── hooks/
    │   │   ├── use-payment.tsx
    │   │   ├── use-process-payment.tsx
    │   │   └── use-refund.tsx
    │   ├── components/
    │   │   ├── payment-form/
    │   │   │   ├── payment-form.tsx
    │   │   │   ├── payment-method-selector.tsx
    │   │   │   └── payment-summary.tsx
    │   │   ├── payment-status/
    │   │   │   ├── payment-status-badge.tsx
    │   │   │   └── payment-receipt.tsx
    │   │   └── refund/
    │   │       ├── refund-dialog.tsx
    │   │       └── refund-form.tsx
    │   ├── adapters/
    │   │   ├── stripe-adapter.tsx
    │   │   └── paypal-adapter.tsx
    │   └── index.ts
    │
    ├── accounts-payable/
    │   ├── types.ts                    # AccountsPayable
    │   ├── services/
    │   │   └── accounts-payable-service.ts
    │   ├── hooks/
    │   │   └── use-accounts-payable.tsx
    │   ├── components/
    │   │   ├── ap-list/
    │   │   ├── ap-detail/
    │   │   └── pay-invoice-dialog.tsx
    │   └── index.ts
    │
    ├── notifications/
    │   ├── types.ts                    # Notification, NotificationType
    │   ├── services/
    │   │   ├── email-notification-service.ts
    │   │   ├── sms-notification-service.ts
    │   │   └── push-notification-service.ts
    │   ├── hooks/
    │   │   ├── use-notifications.tsx
    │   │   └── use-send-notification.tsx
    │   ├── components/
    │   │   ├── notification-list/
    │   │   ├── notification-settings/
    │   │   │   └── notification-preferences.tsx
    │   │   └── notification-toast/
    │   │       └── notification-toast.tsx
    │   └── index.ts
    │
    └── providers/
        └── purchasing-provider.tsx
```

**Usage:**

- Supplier management pages
- Purchase order creation/receiving
- Payment processing (for both purchasing and sales)
- Accounts payable management
- Notification preferences and in-app notifications

---

### 3. **`packages/sales/`** - Sales & Customer Features (EXISTING - Extend)

**Extend existing `packages/sales/` with:** Bookings, Guests, Promotions, PreSales

**New sub-modules to add:**

```
packages/sales/
├── ... (existing structure)
│
├── bookings/                          # NEW
│   ├── types.ts                       # Booking, BookingItem, BookingStatus
│   ├── services/
│   │   ├── booking-service.ts
│   │   └── seat-selection-service.ts  # Find adjacent, best available
│   ├── hooks/
│   │   ├── use-bookings.tsx
│   │   ├── use-booking.tsx
│   │   ├── use-create-booking.tsx
│   │   └── use-seat-selection.tsx
│   ├── components/
│   │   ├── booking-list/
│   │   ├── booking-detail/
│   │   │   ├── booking-summary.tsx
│   │   │   └── booking-status-badge.tsx
│   │   ├── booking-form/
│   │   ├── seat-selection/
│   │   │   ├── seat-selection-wizard.tsx
│   │   │   ├── seat-selection-summary.tsx
│   │   │   ├── find-adjacent-seats.tsx
│   │   │   └── best-available-selector.tsx
│   │   └── cancellation/
│   │       ├── cancel-booking-dialog.tsx
│   │       └── partial-cancellation-dialog.tsx
│   └── index.ts
│
├── guests/                            # NEW
│   ├── types.ts                       # Guest, GuestType, GuestClassification
│   ├── services/
│   │   ├── guest-service.ts
│   │   └── guest-classification-service.ts
│   ├── hooks/
│   │   ├── use-guests.tsx
│   │   ├── use-guest.tsx
│   │   └── use-guest-classification.tsx
│   ├── components/
│   │   ├── guest-list/
│   │   ├── guest-form/
│   │   │   └── guest-registration-form.tsx
│   │   ├── guest-classification/
│   │   └── guest-checkin/
│   └── index.ts
│
├── promotions/                        # NEW
│   ├── types.ts                       # Promotion, PromotionType, PromotionUsage
│   ├── services/
│   │   ├── promotion-service.ts
│   │   └── promotion-validation-service.ts
│   ├── hooks/
│   │   ├── use-promotions.tsx
│   │   ├── use-promotion.tsx
│   │   └── use-validate-promotion.tsx
│   ├── components/
│   │   ├── promotion-list/
│   │   ├── promotion-form/
│   │   ├── promotion-code/
│   │   │   ├── promotion-code-input.tsx
│   │   │   └── promotion-code-validator.tsx
│   │   └── promotion-usage/
│   └── index.ts
│
└── presales/                          # NEW
    ├── types.ts                       # PreSale, PreSaleAccessCode
    ├── services/
    │   ├── presale-service.ts
    │   └── presale-eligibility-service.ts
    ├── hooks/
    │   ├── use-presales.tsx
    │   ├── use-presale.tsx
    │   └── use-presale-eligibility.tsx
    ├── components/
    │   ├── presale-list/
    │   ├── presale-form/
    │   ├── access-code/
    │   │   ├── access-code-input.tsx
    │   │   └── access-code-validator.tsx
    │   └── presale-gate/
    │       └── presale-gate.tsx        # Wrapper for presale-only content
    └── index.ts
```

**Usage:**

- Extend existing sales functionality
- Booking management (customer checkout flow, admin booking management)
- Guest registration during booking
- Promotion code input during checkout
- Pre-sale access code entry
- Admin management for all customer/sales features

---

### 4. **`packages/analytics/`** - Analytics & Reporting (Optional, Phase 2+)

**Structure:**

```
packages/analytics/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # Analytics types
    ├── services/
    │   ├── analytics-service.ts
    │   ├── forecasting-service.ts
    │   └── recommendation-service.ts
    ├── hooks/
    │   ├── use-analytics.tsx
    │   ├── use-revenue-forecast.tsx
    │   └── use-recommendations.tsx
    ├── components/
    │   ├── charts/
    │   │   ├── revenue-chart.tsx
    │   │   ├── sales-chart.tsx
    │   │   └── profit-margin-chart.tsx
    │   ├── dashboards/
    │   │   ├── analytics-dashboard.tsx
    │   │   └── realtime-metrics.tsx
    │   └── reports/
    │       ├── forecast-report.tsx
    │       └── recommendations-panel.tsx
    └── providers/
        └── analytics-provider.tsx
```

**Usage:**

- Analytics dashboard
- Revenue forecasting
- Sales recommendations

---

## 🗂️ Simplified Directory Structure

```
frontend/
├── packages/
│   ├── ticketing/              # NEW (consolidated: events, venues, seating, tickets)
│   ├── purchasing/             # NEW (consolidated: suppliers, purchase-orders, payments, ap, notifications)
│   ├── sales/                  # EXISTING (extend with: bookings, guests, promotions, presales)
│   ├── analytics/              # NEW (optional, Phase 2+)
│   │
│   ├── account/                # EXISTING (reuse)
│   ├── inventory/              # EXISTING (reuse for general inventory)
│   ├── shared/                 # EXISTING (reuse)
│   ├── custom-ui/              # EXISTING (reuse)
│   ├── ui/                     # EXISTING (reuse)
│   └── utils/                  # EXISTING (reuse)
│
└── apps/
    └── web/
        └── src/
            ├── pages/
            │   ├── events/
            │   ├── venues/
            │   ├── bookings/
            │   ├── tickets/
            │   ├── suppliers/
            │   ├── purchase-orders/
            │   ├── sales/
            │   └── ...
            └── routes/
                └── ... (same structure)
```

---

## 🔄 Package Dependencies

**Core Dependencies:**

- `packages/shared` - Common types, API client, utilities
- `packages/ui` - Base UI components (Button, Dialog, etc.)
- `packages/custom-ui` - Custom components (DataTable, Forms, etc.)

**Feature Dependencies:**

- `packages/ticketing` - Self-contained (events → venues → seating → tickets)
- `packages/purchasing` - May depend on `packages/ticketing` (for EventSeat ownership via PO)
- `packages/sales` - Depends on `packages/ticketing` (for seat selection, tickets) and `packages/purchasing` (for payments)
  - Bookings use ticketing's seat selection
  - Bookings use purchasing's payment processing
- `packages/analytics` - Depends on `packages/ticketing` and `packages/sales` (for data)

---

## ✅ Benefits of Consolidation

1. **Fewer packages** = Less overhead (3 core packages instead of 13)
2. **Logical grouping** = Related features together
3. **Easier imports** = `@truths/ticketing` instead of `@truths/events`, `@truths/venues`, etc.
4. **Better code sharing** = Related components can share utilities within package
5. **Simpler dependency management** = Fewer cross-package dependencies
6. **Reuse existing** = Extend `packages/sales/` instead of creating new package

---

## 📝 Package Export Pattern

Each consolidated package exports sub-modules:

```typescript
// packages/ticketing/src/index.ts
export * from "./events";
export * from "./venues";
export * from "./seating";
export * from "./bookings";
export * from "./tickets";

// Usage in apps/web:
import { useEvents, useVenues, useSeatAvailability } from "@truths/ticketing";
import {
  useSuppliers,
  usePurchaseOrders,
  usePayment,
} from "@truths/purchasing";
import {
  useBookings,
  usePromotions,
  useGuests,
  usePresales,
} from "@truths/sales";
```

---

## 🚀 Implementation Priority (MVP First)

### Phase 1: Foundation

1. ✅ **`packages/ticketing/`** - Start with `events/`, `venues/`, `seating/` sub-modules
2. ✅ **`packages/purchasing/`** - Start with `suppliers/`, `purchase-orders/` sub-modules

### Phase 2: Core Booking Flow

3. ✅ **`packages/ticketing/`** - Add `tickets/` sub-module
4. ✅ **`packages/sales/`** - Add `bookings/` sub-module (depends on ticketing for seat selection)
5. ✅ **`packages/purchasing/`** - Add `payments/` sub-module (for checkout)

### Phase 3: Sales & Customer Features

6. ✅ **`packages/sales/`** - Extend existing package with `guests/`, `promotions/`, `presales/` sub-modules

### Phase 4: Enhanced Features

7. ✅ **`packages/purchasing/`** - Add `notifications/` sub-module

### Phase 5: Advanced (Later)

8. ✅ **`packages/analytics/`** - Reporting, forecasting (optional)

**Structure:**

```
packages/guests/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # Guest, GuestType, GuestClassification
    ├── services/
    │   ├── guest-service.ts
    │   └── guest-classification-service.ts
    ├── hooks/
    │   ├── use-guests.tsx
    │   ├── use-guest.tsx
    │   └── use-guest-classification.tsx
    ├── components/
    │   ├── guest-list/
    │   │   ├── guest-list.tsx
    │   │   └── guest-card.tsx
    │   ├── guest-form/
    │   │   ├── guest-registration-form.tsx
    │   │   └── guest-edit-dialog.tsx
    │   ├── guest-classification/
    │   │   ├── classification-selector.tsx
    │   │   └── classification-rules.tsx
    │   └── guest-checkin/
    │       └── guest-checkin-interface.tsx
    └── providers/
        └── guest-provider.tsx
```

**Usage:**

- Guest registration during booking
- Event check-in interface
- Guest classification management

---

### 7. **`packages/payments/`** - Payment Processing

**Structure:**

```
packages/payments/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # PaymentTransaction, PaymentStatus, Refund
    ├── services/
    │   ├── payment-service.ts
    │   └── refund-service.ts
    ├── hooks/
    │   ├── use-payment.tsx
    │   ├── use-process-payment.tsx
    │   └── use-refund.tsx
    ├── components/
    │   ├── payment-form/
    │   │   ├── payment-form.tsx
    │   │   ├── payment-method-selector.tsx
    │   │   └── payment-summary.tsx
    │   ├── payment-status/
    │   │   ├── payment-status-badge.tsx
    │   │   └── payment-receipt.tsx
    │   └── refund/
    │       ├── refund-dialog.tsx
    │       └── refund-form.tsx
    └── adapters/
        ├── stripe-adapter.tsx      # Stripe integration
        └── paypal-adapter.tsx      # PayPal integration
```

**Usage:**

- Checkout payment form
- Payment status display
- Refund processing UI

---

### 8. **`packages/promotions/`** - Promotions & Discounts

**Structure:**

```
packages/promotions/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # Promotion, PromotionType, PromotionUsage
    ├── services/
    │   ├── promotion-service.ts
    │   └── promotion-validation-service.ts
    ├── hooks/
    │   ├── use-promotions.tsx
    │   ├── use-promotion.tsx
    │   └── use-validate-promotion.tsx
    ├── components/
    │   ├── promotion-list/
    │   │   ├── promotion-list.tsx
    │   │   └── promotion-card.tsx
    │   ├── promotion-form/
    │   │   ├── create-promotion-dialog.tsx
    │   │   └── promotion-form.tsx
    │   ├── promotion-code/
    │   │   ├── promotion-code-input.tsx
    │   │   └── promotion-code-validator.tsx
    │   └── promotion-usage/
    │       └── promotion-usage-stats.tsx
    └── providers/
        └── promotion-provider.tsx
```

**Usage:**

- Promotion code input during checkout
- Admin promotion management
- Promotion usage analytics

---

### 9. **`packages/presales/`** - Pre-Sale Management

**Structure:**

```
packages/presales/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # PreSale, PreSaleAccessCode
    ├── services/
    │   ├── presale-service.ts
    │   └── presale-eligibility-service.ts
    ├── hooks/
    │   ├── use-presales.tsx
    │   ├── use-presale.tsx
    │   └── use-presale-eligibility.tsx
    ├── components/
    │   ├── presale-list/
    │   │   ├── presale-list.tsx
    │   │   └── presale-card.tsx
    │   ├── presale-form/
    │   │   ├── create-presale-dialog.tsx
    │   │   └── presale-form.tsx
    │   ├── access-code/
    │   │   ├── access-code-input.tsx
    │   │   └── access-code-validator.tsx
    │   └── presale-gate/
    │       └── presale-gate.tsx    # Wrapper component for presale-only content
    └── providers/
        └── presale-provider.tsx
```

**Usage:**

- Pre-sale access code entry
- Admin presale management
- Presale-gated seat availability

---

### 10. **`packages/suppliers/`** - Supplier & Purchase Order Management

**Structure:**

```
packages/suppliers/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # Supplier, PurchaseOrder, POStatus, AccountsPayable
    ├── services/
    │   ├── supplier-service.ts
    │   ├── purchase-order-service.ts
    │   ├── accounts-payable-service.ts
    │   └── supplier-receipt-service.ts
    ├── hooks/
    │   ├── use-suppliers.tsx
    │   ├── use-supplier.tsx
    │   ├── use-purchase-orders.tsx
    │   ├── use-purchase-order.tsx
    │   └── use-accounts-payable.tsx
    ├── components/
    │   ├── supplier-list/
    │   │   ├── supplier-list.tsx
    │   │   └── supplier-card.tsx
    │   ├── supplier-form/
    │   │   ├── create-supplier-dialog.tsx
    │   │   └── supplier-form.tsx
    │   ├── purchase-orders/
    │   │   ├── purchase-order-list.tsx
    │   │   ├── purchase-order-detail.tsx
    │   │   ├── create-po-dialog.tsx
    │   │   ├── po-line-items.tsx
    │   │   ├── po-receipt-form.tsx
    │   │   └── po-status-badge.tsx
    │   ├── accounts-payable/
    │   │   ├── ap-list.tsx
    │   │   ├── ap-detail.tsx
    │   │   └── pay-invoice-dialog.tsx
    │   └── receipts/
    │       ├── receipt-viewer.tsx
    │       └── receipt-generator.tsx
    └── providers/
        └── supplier-provider.tsx
```

**Usage:**

- Supplier management pages
- Purchase order creation/receiving
- Accounts payable management
- Receipt generation

---

### 11. **`packages/sales/`** - Sales & Profit Tracking

**Structure:**

```
packages/sales/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # SaleBooking, SalesReport
    ├── services/
    │   ├── sales-service.ts
    │   └── sales-reporting-service.ts
    ├── hooks/
    │   ├── use-sales.tsx
    │   ├── use-sale.tsx
    │   └── use-sales-reports.tsx
    ├── components/
    │   ├── sales-list/
    │   │   ├── sales-list.tsx
    │   │   └── sale-card.tsx
    │   ├── sales-detail/
    │   │   ├── sale-detail.tsx
    │   │   └── profit-breakdown.tsx
    │   └── reports/
    │       ├── revenue-report.tsx
    │       ├── profit-report.tsx
    │       └── sales-analytics.tsx
    └── providers/
        └── sales-provider.tsx
```

**Usage:**

- Sales dashboard
- Profit tracking
- Sales reports

---

### 12. **`packages/notifications/`** - Notifications

**Structure:**

```
packages/notifications/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # Notification, NotificationType
    ├── services/
    │   ├── email-notification-service.ts
    │   ├── sms-notification-service.ts
    │   └── push-notification-service.ts
    ├── hooks/
    │   ├── use-notifications.tsx
    │   └── use-send-notification.tsx
    ├── components/
    │   ├── notification-list/
    │   │   └── notification-list.tsx
    │   ├── notification-settings/
    │   │   └── notification-preferences.tsx
    │   └── notification-toast/
    │       └── notification-toast.tsx
    └── providers/
        └── notification-provider.tsx
```

**Usage:**

- Notification preferences
- In-app notifications
- Email/SMS templates

---

### 13. **`packages/analytics/`** - Analytics & Reporting (Phase 2+)

**Structure:**

```
packages/analytics/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts                    # Analytics types
    ├── services/
    │   ├── analytics-service.ts
    │   ├── forecasting-service.ts
    │   └── recommendation-service.ts
    ├── hooks/
    │   ├── use-analytics.tsx
    │   ├── use-revenue-forecast.tsx
    │   └── use-recommendations.tsx
    ├── components/
    │   ├── charts/
    │   │   ├── revenue-chart.tsx
    │   │   ├── sales-chart.tsx
    │   │   └── profit-margin-chart.tsx
    │   ├── dashboards/
    │   │   ├── analytics-dashboard.tsx
    │   │   └── realtime-metrics.tsx
    │   └── reports/
    │       ├── forecast-report.tsx
    │       └── recommendations-panel.tsx
    └── providers/
        └── analytics-provider.tsx
```

**Usage:**

- Analytics dashboard
- Revenue forecasting
- Sales recommendations

---

## 🗂️ Recommended Directory Structure

```
frontend/
├── packages/
│   ├── events/              # NEW
│   ├── venues/              # NEW
│   ├── event-seating/       # NEW (core)
│   ├── bookings/            # NEW
│   ├── tickets/             # NEW
│   ├── guests/              # NEW
│   ├── payments/            # NEW
│   ├── promotions/          # NEW
│   ├── presales/            # NEW
│   ├── suppliers/          # NEW
│   ├── sales/               # NEW (extends existing?)
│   ├── notifications/      # NEW
│   ├── analytics/           # NEW (Phase 2+)
│   │
│   ├── account/             # EXISTING (reuse)
│   ├── inventory/          # EXISTING (reuse for general inventory)
│   ├── sales/              # EXISTING (may need to extend)
│   ├── shared/             # EXISTING (reuse)
│   ├── custom-ui/          # EXISTING (reuse)
│   ├── ui/                 # EXISTING (reuse)
│   └── utils/              # EXISTING (reuse)
│
└── apps/
    └── web/
        ├── src/
        │   ├── pages/
        │   │   ├── events/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   ├── venues/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   ├── bookings/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   ├── tickets/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   ├── suppliers/
        │   │   │   ├── index.tsx
        │   │   │   ├── $id.tsx
        │   │   │   └── purchase-orders/
        │   │   │       ├── index.tsx
        │   │   │       └── $id.tsx
        │   │   └── ... (other pages)
        │   │
        │   ├── routes/
        │   │   ├── events/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   ├── venues/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   ├── bookings/
        │   │   │   ├── index.tsx
        │   │   │   └── $id.tsx
        │   │   └── ... (other routes)
        │   │
        │   └── providers/
        │       └── domain-providers.tsx  # Add new providers here
```

---

## 🔄 Package Dependencies

**Core Dependencies:**

- `packages/shared` - Common types, API client, utilities
- `packages/ui` - Base UI components (Button, Dialog, etc.)
- `packages/custom-ui` - Custom components (DataTable, Forms, etc.)

**Feature Dependencies:**

- `packages/event-seating` depends on `packages/venues` (for Seat definitions)
- `packages/bookings` depends on `packages/event-seating` (for seat selection)
- `packages/tickets` depends on `packages/bookings` (tickets belong to bookings)
- `packages/payments` depends on `packages/bookings` (payments for bookings)
- `packages/sales` extends `packages/bookings` (sales are bookings with profit)

---

## 📝 Package Template Structure

Each package should follow this pattern:

```typescript
// packages/{module}/package.json
{
  "name": "@truths/{module}",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@truths/shared": "workspace:*",
    "@truths/ui": "workspace:*",
    "@tanstack/react-query": "^5.x",
    "react": "^18.x"
  }
}

// packages/{module}/src/index.ts
export * from './types';
export * from './services';
export * from './hooks';
export * from './components';
export * from './providers';

// packages/{module}/src/types.ts
export interface {Entity} {
  id: string;
  tenant_id: string;
  // ... fields
}

// packages/{module}/src/services/{module}-service.ts
import { apiClient } from '@truths/shared';

export class {Module}Service {
  async fetch{Entity}s(params: FetchParams) {
    return apiClient.get(`/api/{module}`, { params });
  }
  // ... other methods
}

// packages/{module}/src/hooks/use-{module}.tsx
import { useQuery } from '@tanstack/react-query';
import { {Module}Service } from '../services';

export function use{Entity}s() {
  return useQuery({
    queryKey: ['{module}'],
    queryFn: () => {Module}Service.fetch{Entity}s(),
  });
}
```

---

## 🚀 Implementation Priority (MVP First)

### Phase 1: Foundation

1. ✅ **`packages/events/`** - Event CRUD
2. ✅ **`packages/venues/`** - Venue + Seat definitions
3. ✅ **`packages/event-seating/`** - EventSeat, pricing, ownership (CORE)

### Phase 2: Core Booking Flow

4. ✅ **`packages/bookings/`** - Booking lifecycle
5. ✅ **`packages/tickets/`** - Ticket generation, scanning
6. ✅ **`packages/payments/`** - Payment processing

### Phase 3: Brokerage Operations

7. ✅ **`packages/suppliers/`** - Purchase orders, receipts
8. ✅ **`packages/sales/`** - Sales, profit tracking

### Phase 4: Enhanced Features

9. ✅ **`packages/guests/`** - Guest management
10. ✅ **`packages/promotions/`** - Discount codes
11. ✅ **`packages/presales/`** - Access codes
12. ✅ **`packages/notifications/`** - Email/SMS

### Phase 5: Advanced (Later)

13. ✅ **`packages/analytics/`** - Reporting, forecasting

---

## 🎨 Component Patterns

### Service Pattern (like `CompanyAddressServiceAdapter`)

- Services handle API calls
- Adapters transform data between API and UI formats
- Hooks wrap services with React Query

### Component Pattern

- **List Components**: Display collections (with DataTable from `custom-ui`)
- **Form Components**: Create/Edit dialogs
- **Detail Components**: View single entity
- **Provider Components**: Context for module state

### Reusable Components

- Use `packages/custom-ui` components (DataTable, Forms, Dialogs)
- Use `packages/ui` base components (Button, Input, etc.)
- Create module-specific components in each package

---

**Next Steps:**

1. Start with Phase 1 packages (Events, Venues, Event Seating)
2. Create services first, then hooks, then components
3. Add routes/pages in `apps/web/` as you build each module
4. Follow existing patterns from `packages/account/` and `packages/inventory/`
