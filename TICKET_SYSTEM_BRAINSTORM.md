# Ticket Management System - Brainstorming & Feature Ideas

## Executive Summary

This document outlines ideas and features for building a **ticket brokerage system** where an **agency company acts as a broker** between event organizers/venues and end customers. The agency:

1. **Purchases tickets in bulk** from event organizers/venues at wholesale prices
2. **Manages inventory** of tickets they own
3. **Resells tickets** to end customers at retail prices (with markup)
4. **Handles all transactions** - payments, refunds, transfers

The system is designed **FOR the agency** to manage their brokerage operations, inventory, sales, and customer relationships.

**Key Business Model:**

- Agency = System Operator (you/your company)
- Event Organizers/Venues = Suppliers (sell tickets to agency)
- End Customers = Buyers (purchase tickets from agency)

### ✅ Broker Model (but Agency Controls Seat Maps + Visualization)

Even though the company is a **broker**, the system will still:

- **Control venues and seat maps** (the agency manages the venue layout and seating map data in the platform)
- **Visualize seat status** on a seat map UI (available / held / reserved / sold / blocked)
- **Sell only seats the agency owns** (the supplier relationship determines _which seats/quantities the agency has acquired_, but the platform is the system-of-record for seat visualization and customer selling)

**Important Principle (Source of Truth for Seat Visualization):**

- `EventSeat` is the canonical record for **what the seat “looks like” on the map** and its current **sellability status**
- Agency ownership is represented as an attribute of `EventSeat` (see `ownership_status` below) rather than a separate “inventory universe”

---

## 🎯 Core Domain Models & Entities

### 1. **Event Management**

Based on your existing `Item` model, extend to support events:

#### Event Entity

- **Event** (extends/relates to Item)
  - `event_id` (UUID)
  - `tenant_id` (multi-tenancy)
  - `title` (string)
  - `description` (text)
  - `event_type` (enum: CONCERT, THEATER, SPORTS, CONFERENCE, etc.)
  - `category_id` (reference to ItemCategory)
  - `venue_id` (reference to Venue)
  - `organizer_id` (reference to Customer/Organizer)
  - `start_datetime` (timestamp)
  - `end_datetime` (timestamp)
  - `timezone` (string)
  - `status` (enum: DRAFT, PUBLISHED, ON_SALE, SOLD_OUT, CANCELLED, COMPLETED)
  - `is_featured` (boolean)
  - `image_urls` (array)
  - `metadata` (JSON for flexible attributes)
  - `created_at`, `updated_at`

#### Venue Entity

- **Venue** (new domain)
  - `venue_id` (UUID)
  - `tenant_id`
  - `name` (string)
  - `address_id` (reference to Address - reuse existing)
  - `capacity` (integer)
  - `venue_type` (enum: STADIUM, THEATER, ARENA, OUTDOOR, etc.)
  - `seating_configuration` (JSON - flexible seating layouts)
  - `amenities` (array)
  - `contact_info` (JSON)
  - `is_active` (boolean)

#### Seating & Inventory

- **Seat** (new domain)

  - `seat_id` (UUID)
  - `venue_id` (reference)
  - `section` (string, e.g., "Section A")
  - `row` (string, e.g., "Row 5")
  - `seat_number` (string, e.g., "12")
  - `seat_type` (enum: STANDARD, VIP, WHEELCHAIR, COMPANION)
  - `x_coordinate`, `y_coordinate` (for seat map visualization)
  - `is_active` (boolean)

- **EventSeat** (junction table for event-specific pricing + brokerage ownership + seat-map visualization)

  - `event_seat_id` (UUID)
  - `event_id` (reference)
  - `seat_id` (reference)
  - `price_level_id` (reference to PriceLevel)
  - `base_price` (decimal)
  - `status` (enum: AVAILABLE, RESERVED, SOLD, BLOCKED, HELD)
  - `ownership_status` (enum: NOT_OWNED, OWNED, RETURNED_TO_SUPPLIER)
  - `supplier_id` (reference to Supplier, nullable)
  - `purchase_order_id` (reference to PurchaseOrder, nullable)
  - `purchase_price` (decimal, nullable - wholesale price for this seat)
  - `retail_price` (decimal, nullable - agency sell price for this seat)
  - `hold_reason` (string, nullable)
  - `hold_until` (timestamp, nullable)

**Seat Map Visualization Rules (recommended):**

- Show ALL seats on the venue map, but visually distinguish by `ownership_status`:
  - `NOT_OWNED`: greyed out / not purchasable
  - `OWNED`: purchasable depending on `status`
  - `RETURNED_TO_SUPPLIER`: not purchasable
- A seat is **sellable to customers** iff:

  - `ownership_status = OWNED` AND `status = AVAILABLE`

- **PriceLevel** (new domain)
  - `price_level_id` (UUID)
  - `tenant_id`
  - `event_id` (reference)
  - `name` (string, e.g., "Premium", "Standard", "Economy")
  - `base_price` (decimal)
  - `currency` (string)
  - `description` (text)
  - `sort_order` (integer)

### 2. **Ticket & Booking Management**

#### Ticket Entity

- **Ticket** (new domain - core booking entity)
  - `ticket_id` (UUID)
  - `tenant_id`
  - `event_id` (reference)
  - `event_seat_id` (reference)
  - `booking_id` (reference to Booking)
  - `ticket_number` (string, unique, e.g., "TM-2024-001234")
  - `barcode` (string, unique - reuse barcode system)
  - `qr_code` (string, unique)
  - `status` (enum: RESERVED, CONFIRMED, CANCELLED, TRANSFERRED, USED)
  - `price_paid` (decimal)
  - `currency` (string)
  - `transfer_token` (string, nullable - for ticket transfers)
  - `issued_at` (timestamp)
  - `reserved_at` (timestamp, nullable)
  - `reserved_until` (timestamp, nullable)
  - `expires_at` (timestamp, nullable)
  - `scanned_at` (timestamp, nullable - for entry validation)

**📋 TICKET CREATION LIFECYCLE - Detailed Explanation**

Tickets are created in **TWO STAGES** during the booking process:

✅ **Decision (MVP): Tickets are created at reservation time.**

**Stage 1: Reservation Phase (BEFORE Payment)**

- **When**: Immediately when customer selects seats and clicks "Reserve"
- **Action**: Create ticket records with `status = RESERVED`
- **Purpose**: Lock seats to prevent double-booking
- **Duration**: Temporary hold (typically 5-15 minutes)
- **Fields Set**:
  - `ticket_id`, `booking_id`, `event_id`, `event_seat_id`
  - `ticket_number` (temporary or permanent - your choice)
  - `barcode` and `qr_code` (generated immediately)
  - `status = RESERVED`
  - `reserved_at` = current timestamp
  - `reserved_until` = current timestamp + reservation timeout
  - `price_paid` = calculated price (not yet charged)
- **What Happens**: Seats are marked as unavailable in inventory cache

**Stage 2: Confirmation Phase (AFTER Payment Success)**

- **When**: After payment gateway confirms successful payment
- **Action**: Update ticket `status = CONFIRMED`
- **Purpose**: Activate tickets for entry
- **Fields Updated**:
  - `status = CONFIRMED`
  - `issued_at` = current timestamp
  - `reserved_until` = NULL (no longer needed)
  - Payment details linked via `booking_id`
- **What Happens**:
  - Tickets become valid for entry
  - Confirmation email sent with ticket download link
  - Digital tickets delivered

**If Payment Fails:**

- Background job checks `reserved_until` timestamp
- If expired and still `RESERVED`, auto-release:
  - Update ticket `status = CANCELLED`
  - Release seat back to inventory
  - Update `event_seat.status = AVAILABLE`

**Alternative Approach (Simpler):**
Some systems only create tickets AFTER payment confirmation:

- Use `SeatReservation` table for temporary holds (separate from tickets)
- Only create `Ticket` records when payment succeeds
- **Pros**: Cleaner ticket table, only confirmed tickets exist
- **Cons**: Need separate reservation tracking, less complete audit trail

**Recommended Approach:**
Create tickets at reservation time because:

1. ✅ Better audit trail (see all reservation attempts)
2. ✅ Easier to track abandoned carts
3. ✅ Simpler code (one entity instead of two)
4. ✅ Can reuse ticket numbers/barcodes (no regeneration needed)
5. ✅ Better analytics (conversion rates, abandonment reasons)

#### Booking Entity

- **Booking** (new domain - aggregates tickets)
  - `booking_id` (UUID)
  - `tenant_id`
  - `customer_id` (reference to Customer - reuse existing)
  - `event_id` (reference)
  - `booking_number` (string, unique)
  - `status` (enum: PENDING, RESERVED, CONFIRMED, PAID, CANCELLED, REFUNDED)
  - `total_amount` (decimal)
  - `currency` (string)
  - `service_fee` (decimal)
  - `tax_amount` (decimal)
  - `discount_amount` (decimal)
  - `payment_method` (enum: CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER)
  - `payment_status` (enum: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
  - `payment_transaction_id` (string, nullable)
  - `reserved_until` (timestamp - auto-release if not paid)
  - `created_at`, `updated_at`
  - `cancelled_at` (timestamp, nullable)
  - `cancellation_reason` (string, nullable)

#### BookingItem (ticket line items)

- `booking_item_id` (UUID)
- `booking_id` (reference)
- `ticket_id` (reference)
- `quantity` (integer, typically 1)
- `unit_price` (decimal)
- `total_price` (decimal)
- `seat_number` (string, nullable - for reference)
- `section` (string, nullable - for reference)
- `row` (string, nullable - for reference)

**📋 MULTI-TICKET BOOKING BEHAVIOR**

A single booking can contain **one or multiple tickets**. Here's how it works:

**Key Design Decisions:**

1. **One Booking = Multiple Tickets**

   - A booking aggregates multiple tickets
   - Each ticket is a separate line item in `BookingItem`
   - All tickets in a booking share the same:
     - Customer
     - Payment transaction
     - Reservation timeout
     - Booking number

2. **Seat Selection Scenarios:**

   - **Adjacent Seats**: Customer wants seats next to each other
   - **Same Section**: Customer wants seats in same section (not necessarily adjacent)
   - **Best Available**: System suggests best available seats for quantity
   - **Specific Seats**: Customer selects exact seats

3. **Pricing Variations:**

   - Each ticket can have different prices (different price levels)
   - Booking total = sum of all ticket prices + service fees + taxes
   - Discounts can apply to entire booking or individual tickets

4. **Reservation Behavior:**

   - All tickets reserved together (atomic operation)
   - If ANY seat becomes unavailable, entire booking fails
   - Reservation timeout applies to entire booking
   - All tickets released together if payment fails

5. **Payment Processing:**

   - Single payment transaction for entire booking
   - If payment fails, all tickets released
   - Partial payment NOT supported (all or nothing)

6. **Ticket Generation:**

   - All tickets generated together after payment
   - Each ticket gets unique barcode/QR code
   - All tickets sent in single confirmation email

7. **Cancellation Behavior:**
   - **Full Cancellation**: Cancel entire booking (all tickets)
   - **Partial Cancellation**: Cancel some tickets (if policy allows)
   - Refund calculated per ticket based on cancellation policy

### 3. **Customer & Supplier Management**

**Important:** In this brokerage model:

- **Suppliers** = Event Organizers/Venues (sell tickets TO your agency)
- **Customers** = End Customers (buy tickets FROM your agency)

#### Supplier Entity (Event Organizers/Venues)

- **Supplier** (extends Customer - these are your suppliers)
  - Inherits all Customer fields
  - `supplier_type` (enum: EVENT_ORGANIZER, VENUE_OWNER, PROMOTER, PRODUCTION_COMPANY)
  - `tax_id` (string, nullable)
  - `wholesale_discount_rate` (decimal, e.g., 0.20 = 20% discount from retail)
  - `credit_limit` (decimal, nullable - credit you extend to supplier)
  - `payment_terms` (enum: NET_30, NET_60, IMMEDIATE)
  - `contract_start_date` (timestamp)
  - `contract_end_date` (timestamp, nullable)
  - `contact_person` (string)
  - `business_license` (string, nullable)
  - `is_active` (boolean)
  - `notes` (text, nullable)

#### End Customer Entity (extends Customer)

- **Customer** (end customers who buy from your agency)
  - Inherits all Customer fields
  - `customer_type` (enum: INDIVIDUAL, CORPORATE, GROUP_LEADER)
  - `preferred_contact_method`
  - `loyalty_points` (for rewards program)
  - `marketing_opt_in` (boolean)
  - `preferred_payment_method`
  - `purchase_history_count` (integer)
  - `total_spent` (decimal)
  - `customer_tier` (enum: BRONZE, SILVER, GOLD, PLATINUM)

### 3.5. **Agency Inventory & Resale System**

**Note:** Since the agency IS the system operator, inventory management is core to the system.

✅ **Important (Broker + Seat Map Controlled by Agency):**

- The platform controls **venue + seat map data** and visualizes seat status from `EventSeat`.
- “Inventory” for a broker is **the set of EventSeats the agency owns** for an event.
- Therefore, **ownership should live on `EventSeat`** (via `ownership_status`, `purchase_price`, `retail_price`, etc.).
- **Decision (MVP simplification): Drop `AgencyInventory` entirely** and treat `EventSeat` as inventory:
  - “Owned inventory seats” = `EventSeat` where `ownership_status = OWNED`
  - “Available inventory seats” = `EventSeat` where `ownership_status = OWNED` and `status = AVAILABLE`
  - Sale lifecycle = `EventSeat.status` transitions + `Ticket`/`Booking` records (no duplicate inventory table)

#### Purchase Order (from Supplier)

- **PurchaseOrder** (your agency buys tickets from suppliers)

  - `purchase_order_id` (UUID)
  - `tenant_id` (your agency)
  - `supplier_id` (reference to Supplier)
  - `fulfillment_method` (enum: ELECTRONIC_TRANSFER, MOBILE_TRANSFER, PDF_DELIVERY, WILL_CALL, PAPER_SHIPMENT)
  - `fulfillment_notes` (text, nullable - instructions, login/account details, pickup window, etc.)
  - `po_number` (string, unique per tenant)
  - `status` (enum: DRAFT, PENDING, CONFIRMED, PARTIALLY_RECEIVED, COMPLETED, CANCELLED)
  - `currency` (string, default: "USD")
  - `expected_date` (date, nullable - expected delivery date)
  - `submitted_at` (timestamp, nullable)
  - `submitted_by` (string, nullable - user who submitted)
  - `approved_at` (timestamp, nullable)
  - `approved_by` (string, nullable - user who approved)
  - `closed_at` (timestamp, nullable)
  - `cancelled_at` (timestamp, nullable)
  - `reference` (string, nullable - external reference)
  - `notes` (text, nullable)
  - `created_by` (string, nullable)
  - `payment_terms` (string, nullable - e.g., "NET_30", "NET_60", "IMMEDIATE")
  - `shipping_address_id` (reference to Address, nullable)
  - `version` (integer - for optimistic locking)
  - `created_at`, `updated_at`

- **PurchaseOrderLine** (line items - supports multiple ticket types/products per PO)

  - `line_id` (UUID)
  - `tenant_id` (your agency)
  - `purchase_order_id` (reference to PurchaseOrder)
  - `item_id` (reference to Ticket/TicketType - the ticket being purchased)
  - `item_code` (string, nullable - ticket code/SKU)
  - `item_name` (string, nullable - ticket name/description)
  - `description` (text, nullable - additional details)
  - `quantity` (decimal - number of tickets of this type)
  - `uom` (string - unit of measure, e.g., "TICKET", "UNIT")
  - `unit_price` (decimal - wholesale price per ticket)
  - `status` (enum: PENDING, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED)
  - `expected_date` (date, nullable - when this line item is expected)
  - `received_quantity` (decimal - quantity received so far)
  - `cancelled_quantity` (decimal - quantity cancelled)
  - `created_at`, `updated_at`

  **Note:** Each PurchaseOrder can have multiple PurchaseOrderLine items, allowing you to purchase different ticket types (VIP, General Admission, etc.) with different prices in a single purchase order.

#### Customer Sale Booking

- **SaleBooking** (extends Booking - when customers buy from you)
  - Inherits all Booking fields
  - `booking_type` = "CUSTOMER_SALE"
  - `customer_id` (reference to Customer - end customer)
  - `purchase_price` (decimal - what you paid supplier)
  - `retail_price` (decimal - what customer paid you)
  - `your_profit` (decimal - retail_price - purchase_price)
  - `markup_percentage` (decimal)
  - `service_fee` (decimal - additional fee charged to customer)

### 4. **Payment & Financial Management**

#### Payment Transaction

- **PaymentTransaction** (new domain)
  - `transaction_id` (UUID)
  - `tenant_id`
  - `booking_id` (reference)
  - `customer_id` (reference)
  - `amount` (decimal)
  - `currency` (string)
  - `payment_method` (enum)
  - `payment_provider` (string, e.g., "stripe", "paypal")
  - `provider_transaction_id` (string)
  - `status` (enum: PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED)
  - `failure_reason` (string, nullable)
  - `processed_at` (timestamp, nullable)
  - `refund_amount` (decimal, nullable)
  - `refunded_at` (timestamp, nullable)

### 4.5. **Guest Management & Classification**

#### Guest Entity

- **Guest** (new domain - for event entry management)
  - `guest_id` (UUID)
  - `tenant_id`
  - `ticket_id` (reference to Ticket)
  - `booking_id` (reference to Booking)
  - `event_id` (reference)
  - `first_name` (string)
  - `last_name` (string)
  - `email` (string, nullable)
  - `phone` (string, nullable)
  - `guest_type` (enum: PRIMARY, COMPANION, CHILD, VIP, STAFF, PRESS)
  - `classification` (enum: INDIVIDUAL, GROUP_LEADER, CORPORATE, MEMBER)
  - `age_group` (enum: CHILD, YOUTH, ADULT, SENIOR)
  - `special_requirements` (array, e.g., ["wheelchair", "hearing_assistance"])
  - `registration_date` (timestamp)
  - `checked_in` (boolean)
  - `checked_in_at` (timestamp, nullable)
  - `notes` (text, nullable)
  - `metadata` (JSON, nullable - flexible attributes)

#### Guest Classification Rules

- **ClassificationRule** (new domain)
  - `rule_id` (UUID)
  - `tenant_id`
  - `event_id` (reference, nullable - event-specific or global)
  - `rule_name` (string)
  - `classification_criteria` (JSON - conditions for classification)
  - `guest_type` (enum - what type to assign)
  - `priority` (integer - rule priority)
  - `is_active` (boolean)

#### Refund Entity

- **Refund** (new domain)
  - `refund_id` (UUID)
  - `tenant_id`
  - `booking_id` (reference)
  - `payment_transaction_id` (reference)
  - `amount` (decimal)
  - `reason` (enum: CUSTOMER_REQUEST, EVENT_CANCELLED, DUPLICATE, FRAUD)
  - `status` (enum: PENDING, PROCESSING, COMPLETED, FAILED)
  - `processed_at` (timestamp, nullable)

### 5. **Promotions & Offers**

#### Promotion Entity

- **Promotion** (new domain)
  - `promotion_id` (UUID)
  - `tenant_id`
  - `code` (string, unique, e.g., "SUMMER2024")
  - `name` (string)
  - `description` (text)
  - `promotion_type` (enum: PERCENTAGE_DISCOUNT, FIXED_DISCOUNT, BUY_ONE_GET_ONE, FREE_SHIPPING)
  - `discount_value` (decimal)
  - `min_purchase_amount` (decimal, nullable)
  - `max_discount_amount` (decimal, nullable)
  - `applicable_event_types` (array)
  - `applicable_price_levels` (array)
  - `start_date` (timestamp)
  - `end_date` (timestamp)
  - `usage_limit` (integer, nullable - total uses)
  - `usage_limit_per_customer` (integer, nullable)
  - `is_active` (boolean)

#### CustomerPromotionUsage

- `usage_id` (UUID)
- `promotion_id` (reference)
- `customer_id` (reference)
- `booking_id` (reference)
- `discount_applied` (decimal)
- `used_at` (timestamp)

### 6. **Pre-Sales & Holds**

#### PreSale Entity

- **PreSale** (new domain)
  - `presale_id` (UUID)
  - `tenant_id`
  - `event_id` (reference)
  - `name` (string)
  - `access_code` (string, nullable)
  - `start_datetime` (timestamp)
  - `end_datetime` (timestamp)
  - `price_level_ids` (array - which price levels available)
  - `max_tickets_per_customer` (integer)
  - `is_active` (boolean)

**Presale design notes (broker + owned seats):**

- Goal: limited-visibility on-sale before general release, often code-gated.
- Eligibility:
  - `access_code` or customer allowlist (e.g., loyalty tier, partner list).
  - Optional per-code usage caps (total + per-customer).
- Seat scope:
  - Limit to specific `price_level_ids` and/or `EventSeat` subsets (mark those seats as presale-allocable).
  - Presale seats still must have `ownership_status = OWNED` and `status = AVAILABLE`.
- Timing: enforce `start_datetime`/`end_datetime` in availability checks; fall back to general sale after end.
- Rate limits / abuse controls: per-customer ticket cap (`max_tickets_per_customer`), per-code usage limit, IP/user rate limit.
- UX flow:
  1. Customer enters code (or is auto-eligible).
  2. System validates eligibility/time window.
  3. Availability query returns only seats/price levels in scope.
  4. Reservation/booking proceeds as normal (tickets created at reservation).
- Analytics: track presale conversion, code usage, and sell-through of the allocated seat block.

#### Hold Entity (for artist/promoter holds)

- **Hold** (new domain)
  - `hold_id` (UUID)
  - `tenant_id`
  - `event_id` (reference)
  - `hold_type` (enum: ARTIST, PROMOTER, VENUE, COMPLIMENTARY, PRESS)
  - `seat_ids` (array) or `price_level_ids` (array)
  - `quantity` (integer)
  - `reason` (string)
  - `released_at` (timestamp, nullable)
  - `is_active` (boolean)

---

## 🏗️ System Architecture & Services

### Microservices Structure (based on your existing architecture)

#### 1. **Event Service**

- Create, update, delete events
- Event search and discovery
- Event status management
- Event templates (reusable configurations)
- Event metadata management

**API Endpoints:**

```
POST   /api/events
GET    /api/events
GET    /api/events/{event_id}
PUT    /api/events/{event_id}
DELETE /api/events/{event_id}
GET    /api/events/search?query=...
GET    /api/events/{event_id}/availability
POST   /api/events/templates
```

#### 2. **Venue Service**

- Venue CRUD operations
- Seat map management
- Venue capacity management
- Seating configuration

**API Endpoints:**

```
POST   /api/venues
GET    /api/venues
GET    /api/venues/{venue_id}
GET    /api/venues/{venue_id}/seats
GET    /api/venues/{venue_id}/seatmap
```

#### 3. **Inventory Service** (extend existing inventory)

- Real-time seat availability
- Seating allocation and planning
- Seat reservation management
- Inventory holds and releases
- Price level management
- Dynamic pricing (optional)

**API Endpoints:**

```
# Seat Availability
GET    /api/inventory/events/{event_id}/seats
GET    /api/inventory/events/{event_id}/availability
GET    /api/inventory/events/{event_id}/availability/realtime  # WebSocket

# Reservation Management
POST   /api/inventory/reserve
POST   /api/inventory/release
POST   /api/inventory/reserve/batch              # Batch reservation

# Seating Allocation & Planning
POST   /api/inventory/allocation/plan            # Create seating allocation plan
GET    /api/inventory/allocation/plans           # List allocation plans
GET    /api/inventory/allocation/plans/{plan_id} # Get allocation plan
PUT    /api/inventory/allocation/plans/{plan_id} # Update allocation plan
POST   /api/inventory/allocation/apply           # Apply allocation plan
GET    /api/inventory/allocation/visualization   # Visual seating map

# Holds Management
POST   /api/inventory/holds
GET    /api/inventory/holds
GET    /api/inventory/holds/{hold_id}
DELETE /api/inventory/holds/{hold_id}
PUT    /api/inventory/holds/{hold_id}/release     # Release hold
```

#### 4. **Booking Service** (new)

- Create bookings (single or multi-ticket)
- Manage booking lifecycle
- Booking confirmation
- Booking cancellation (full or partial)
- Booking transfers
- Seat selection helpers

**API Endpoints:**

```
# Booking Management
POST   /api/bookings                          # Create booking (single or multi-ticket)
GET    /api/bookings/{booking_id}             # Get booking details
GET    /api/bookings/customer/{customer_id}    # List customer's bookings
PUT    /api/bookings/{booking_id}              # Update booking
DELETE /api/bookings/{booking_id}             # Cancel entire booking

# Multi-Ticket Operations
POST   /api/bookings/{booking_id}/tickets/cancel  # Cancel specific tickets (partial)
GET    /api/bookings/{booking_id}/tickets         # List all tickets in booking
GET    /api/bookings/{booking_id}/summary         # Booking summary with totals

# Seat Selection Helpers
POST   /api/events/{event_id}/seats/find-adjacent    # Find adjacent seats
POST   /api/events/{event_id}/seats/best-available   # Find best available seats
POST   /api/events/{event_id}/seats/validate         # Validate seat selection
```

#### 5. **Ticket Service** (new)

- Ticket generation
- Ticket validation
- Visual ticketing entry (scanner interface)
- Ticket scanning (entry validation)
- Ticket transfer
- Digital ticket delivery
- Guest information registration and classification

**API Endpoints:**

```
# Ticket Management
POST   /api/tickets/generate
GET    /api/tickets/{ticket_id}
GET    /api/tickets/validate/{barcode}
POST   /api/tickets/{ticket_id}/transfer
GET    /api/tickets/{ticket_id}/download

# Visual Ticketing Entry (Scanner Interface)
POST   /api/tickets/scan                          # Scan ticket for entry
GET    /api/tickets/scan/history                  # Scan history
GET    /api/tickets/scan/stats                    # Scanning statistics
POST   /api/tickets/scan/batch                    # Batch scanning
GET    /api/tickets/scan/realtime                 # Real-time scan feed

# Guest Registration & Classification
POST   /api/guests/register                       # Register guest information
GET    /api/guests/{guest_id}                    # Get guest details
PUT    /api/guests/{guest_id}                    # Update guest info
GET    /api/guests/classify                       # Classify guests
GET    /api/guests/categories                     # Guest categories
POST   /api/guests/{guest_id}/classify           # Classify specific guest
GET    /api/guests/events/{event_id}             # Guests for event
```

#### 6. **Payment Service** (new)

- Payment processing
- Payment gateway integration (Stripe, PayPal, etc.)
- Refund processing
- Payment webhooks

**API Endpoints:**

```
POST   /api/payments/process
GET    /api/payments/{transaction_id}
POST   /api/payments/{transaction_id}/refund
POST   /api/payments/webhooks/stripe
POST   /api/payments/webhooks/paypal
```

#### 7. **Promotion Service** (new)

- Promotion management
- Promotion code validation
- Discount calculation

**API Endpoints:**

```
POST   /api/promotions
GET    /api/promotions
GET    /api/promotions/{promotion_id}
POST   /api/promotions/validate
PUT    /api/promotions/{promotion_id}
```

#### 8. **Notification Service** (new)

- Email notifications (booking confirmations, reminders)
- SMS notifications
- Push notifications
- In-app notifications

**API Endpoints:**

```
POST   /api/notifications/send
GET    /api/notifications/user/{user_id}
POST   /api/notifications/preferences
```

#### 9. **Reporting & Analytics Service** (new)

- Real-time sales data
- Expected box office revenue forecasting
- Performance cost statistics
- Precision statistics
- Multi-dimensional big data statistics
- Box office sales recommendations
- Local performance industry data records
- Comprehensive data retention

**API Endpoints:**

```
# Real-time Analytics
GET    /api/analytics/realtime/sales              # Real-time sales data
GET    /api/analytics/realtime/revenue            # Real-time revenue
GET    /api/analytics/realtime/events/{event_id}  # Real-time event metrics
WS     /api/analytics/realtime/stream             # WebSocket for live updates

# Revenue Forecasting
GET    /api/analytics/forecast/revenue            # Expected box office revenue
GET    /api/analytics/forecast/events/{event_id}   # Event revenue forecast
POST   /api/analytics/forecast/calculate          # Calculate forecast

# Performance & Cost Statistics
GET    /api/analytics/performance/costs           # Performance cost statistics
GET    /api/analytics/performance/events/{event_id}/costs
GET    /api/analytics/performance/profit-margin   # Profit margin analysis

# Precision Statistics
GET    /api/analytics/precision/sales             # Detailed sales statistics
GET    /api/analytics/precision/revenue           # Detailed revenue breakdown
GET    /api/analytics/precision/customers         # Customer analytics

# Multi-dimensional Analytics
GET    /api/analytics/multi-dimensional           # Multi-dimensional analysis
POST   /api/analytics/multi-dimensional/query     # Custom query builder
GET    /api/analytics/multi-dimensional/dimensions # Available dimensions

# Recommendations
GET    /api/analytics/recommendations/sales       # Box office sales recommendations
GET    /api/analytics/recommendations/pricing     # Pricing recommendations
GET    /api/analytics/recommendations/inventory   # Inventory recommendations

# Industry Data
GET    /api/analytics/industry/records            # Local performance industry data
GET    /api/analytics/industry/benchmarks         # Industry benchmarks
GET    /api/analytics/industry/trends             # Industry trends

# Data Retention
GET    /api/analytics/retention/policy            # Data retention policies
GET    /api/analytics/retention/status            # Retention status
POST   /api/analytics/retention/archive          # Archive old data
```

#### 10. **Supplier Management Service** (new)

- Supplier (event organizers/venues) management
- Purchase order processing
- Supplier relationship management
- Accounts payable

**API Endpoints:**

```
# Supplier Management
POST   /api/suppliers                    # Add new supplier
GET    /api/suppliers                    # List suppliers
GET    /api/suppliers/{supplier_id}      # Get supplier details
PUT    /api/suppliers/{supplier_id}      # Update supplier
DELETE /api/suppliers/{supplier_id}      # Deactivate supplier

# Purchase Orders (Your agency buys from suppliers)
POST   /api/purchase-orders              # Create purchase order
GET    /api/purchase-orders              # List purchase orders
GET    /api/purchase-orders/{po_id}      # Get PO details
PUT    /api/purchase-orders/{po_id}      # Update PO
POST   /api/purchase-orders/{po_id}/confirm # Confirm PO with supplier
POST   /api/purchase-orders/{po_id}/receive # Receive tickets
POST   /api/purchase-orders/{po_id}/pay   # Pay supplier
POST   /api/purchase-orders/{po_id}/cancel # Cancel PO

# Accounts Payable
GET    /api/accounts-payable             # List outstanding invoices
GET    /api/accounts-payable/{invoice_id} # Get invoice details
POST   /api/accounts-payable/{invoice_id}/pay # Pay invoice
```

#### 11. **Inventory Management Service** (new)

- Your agency's owned-seat inventory (backed by `EventSeat`)
- Inventory tracking and valuation
- Pricing management
- Stock levels

**API Endpoints:**

```
# Inventory Management
GET    /api/inventory/events/{event_id}                     # Owned EventSeats for event
GET    /api/inventory/events/{event_id}/available           # Owned + AVAILABLE EventSeats
GET    /api/inventory/events/{event_id}/seats/{event_seat_id} # EventSeat inventory details
PUT    /api/inventory/events/{event_id}/seats/{event_seat_id}/price # Set retail price
POST   /api/inventory/events/{event_id}/seats/{event_seat_id}/return # Return seat to supplier
GET    /api/inventory/reports/value      # Inventory valuation report
GET    /api/inventory/reports/movement   # Inventory movement report
```

#### 12. **Sales Service** (extends Booking Service)

- Customer sales (your agency sells to end customers)
- Sales reporting
- Profit tracking

**API Endpoints:**

```
# Customer Sales (extends booking endpoints)
POST   /api/sales                        # Create sale to customer
GET    /api/sales                        # List sales
GET    /api/sales/{sale_id}              # Get sale details
GET    /api/sales/reports/profit         # Profit reports
GET    /api/sales/reports/revenue        # Revenue reports
```

---

## 🔄 Key Workflows

### 1. **Event Creation Workflow**

```
1. Organizer creates event
2. Select venue (or create new)
3. Configure seating and price levels
4. Set event dates/times
5. Upload images/media
6. Configure pre-sales (optional)
7. Set holds (artist, promoter, etc.)
8. Publish event
9. Event goes on sale
```

### 2. **Ticket Purchase Workflow** (Single or Multi-Ticket)

```
1. Customer searches/browses events
2. Select event and view seat map
3. Customer selects quantity (1 or more tickets)
4. Seat selection options:
   → Option A: Select specific seats (one by one)
   → Option B: "Best Available" - system suggests seats
   → Option C: "Adjacent Seats" - system finds seats together
   → Option D: "Same Section" - system finds seats in same section
5. System validates availability:
   → Check ALL selected seats are available
   → If ANY seat unavailable, show error and suggest alternatives
   → If all available, proceed to reservation
6. Reserve seats (temporary hold - 5-15 minutes)
   → 🎫 TICKETS CREATED HERE (status = RESERVED)
   → Create Booking record (status = RESERVED)
     - booking.total_amount = sum of all ticket prices
     - booking.ticket_count = number of tickets
   → Create Ticket records for EACH seat (status = RESERVED)
   → Create BookingItem for EACH ticket:
     - booking_item.ticket_id = ticket.id
     - booking_item.unit_price = ticket price
     - booking_item.total_price = ticket price
   → Generate barcode/QR code for each ticket
   → Lock ALL seats in inventory (mark as RESERVED)
   → Set reserved_until timestamp (e.g., +15 minutes)
   → All tickets share same reservation timeout
7. Apply promotion code (optional)
   → Can apply to entire booking or specific tickets
   → Calculate discount on total_amount
8. Review order summary:
   → Show all tickets with seat details
   → Show individual prices
   → Show subtotal, fees, taxes, total
9. Enter payment details
10. Process payment (single transaction for entire booking)
   → Payment gateway processes charge for TOTAL amount
   → If successful:
     → 🎫 ALL TICKETS CONFIRMED HERE (status = CONFIRMED)
     → Update Booking (status = CONFIRMED, payment_status = COMPLETED)
     → Update ALL Tickets (status = CONFIRMED, issued_at = now)
     → Create PaymentTransaction record
   → If failed:
     → Keep ALL tickets as RESERVED (will auto-release after timeout)
     → Show payment error to customer
     → Customer can retry payment (if within timeout)
11. Send confirmation email/SMS (only if payment succeeded)
    → Include ALL tickets in single email
    → Each ticket as separate attachment or combined PDF
12. Deliver digital tickets (only if payment succeeded)
    → All tickets available for download
    → Each ticket has unique barcode/QR code
13. Background job: Auto-release expired reservations
    → Check bookings with status = RESERVED and reserved_until < now
    → Release ALL tickets in booking
    → Update all tickets status = CANCELLED
    → Release ALL seats back to inventory
```

### 3. **Ticket Validation Workflow** (Event Day)

```
1. Customer arrives at venue
2. Present ticket (QR code/barcode)
3. Scanner validates ticket
4. Check if already scanned (prevent duplicates)
5. Mark ticket as used
6. Grant entry
7. Update attendance records
```

### 4. **Cancellation & Refund Workflow** (Single or Multi-Ticket)

**Full Cancellation (All Tickets):**

```
1. Customer requests cancellation for entire booking
2. Check cancellation policy:
   → Is cancellation allowed?
   → What's the refund percentage?
   → Any cancellation fees?
3. Calculate refund amount:
   → Refund per ticket based on policy
   → Total refund = sum of all ticket refunds
   → Deduct cancellation fees if applicable
4. Process refund through payment gateway:
   → Single refund transaction for total amount
   → Or multiple refunds (one per ticket) if gateway requires
5. Release ALL seats back to inventory:
   → Update all tickets: status = CANCELLED
   → Update all BookingItems: mark as cancelled
   → Release all seats: status = AVAILABLE
6. Update booking:
   → status = CANCELLED
   → cancelled_at = now
7. Send cancellation confirmation (all tickets)
8. Update booking status
```

**Partial Cancellation (Some Tickets):**

```
1. Customer requests cancellation for specific tickets only
2. Check if partial cancellation is allowed:
   → Policy may require cancelling entire booking
   → Or allow cancelling individual tickets
3. Identify tickets to cancel:
   → Customer selects which tickets to cancel
   → System validates selection
4. Calculate refund for selected tickets:
   → Refund per ticket based on policy
   → Total refund = sum of cancelled ticket refunds
5. Process partial refund:
   → Refund only for cancelled tickets
   → Original payment transaction remains for kept tickets
6. Update cancelled tickets:
   → status = CANCELLED
   → Release seats back to inventory
7. Update kept tickets:
   → Remain CONFIRMED
   → Still valid for entry
8. Update booking:
   → Recalculate total_amount (subtract cancelled tickets)
   → Update ticket_count
   → Keep booking status = CONFIRMED
9. Send updated confirmation:
   → Show cancelled tickets
   → Show remaining valid tickets
10. Issue refund confirmation
```

### 5. **Purchase from Supplier Workflow** (Your Agency Buys Tickets)

```
1. Your agency identifies event/opportunity
2. Contact supplier (event organizer/venue) to negotiate:
   - Quantity of tickets
   - Wholesale price per ticket
   - Discount rate
   - Payment terms
3. Create PurchaseOrder in system:
   - Select supplier
   - Set payment terms (NET_30, NET_60, or IMMEDIATE)
   - Add PurchaseOrderLine items (one per ticket type/product):
     * Select ticket/item (by item_id - references Ticket/TicketType)
     * Enter quantity for this ticket type
     * Enter unit price (wholesale price per ticket)
     * System calculates line total = quantity × unit_price
   - System calculates PurchaseOrder totals:
     * Total amount = sum of all line item totals
     * Expected profit margin (if you know your retail price)
4. Submit PurchaseOrder to supplier (status = PENDING)
5. Supplier confirms (status = CONFIRMED)
6. Process payment to supplier:
   → If IMMEDIATE: Pay supplier now
   → If NET_30/60: Create accounts payable, pay later
7. Allocate supplier inventory to specific seats (required for seat-map visualization):
   → Option A (preferred): supplier provides exact seat list (section/row/seat)
   → Option B: supplier provides seat blocks (e.g., "Section A rows 1-5, any seat")
   → System action:
     * Map the supplier-provided seats/blocks to `EventSeat` rows for the event
     * Mark those `EventSeat` rows as agency-owned inventory:
       - `ownership_status = OWNED`
       - set `supplier_id`, `purchase_order_id`
       - set `purchase_price` (wholesale) and `retail_price` (your sell price)
     * Any seats not purchased remain visible on the map but not purchasable:
       - `ownership_status = NOT_OWNED`
8. Receive tickets/confirm delivery from supplier (per line item):
   → For each PurchaseOrderLine:
     * Receive quantity (update received_quantity)
     * Reconcile: ensure number of `EventSeat` marked `OWNED` matches received quantity
     * (Optional) Create internal `Ticket` records only if you need pre-issued barcodes
       - Otherwise, create `Ticket` records at customer reservation time
   → Update line status (PENDING → PARTIALLY_RECEIVED → RECEIVED)
9. Seats now available for sale to customers:
   → Seat map shows live `EventSeat.status`
   → Customer can only buy seats where `ownership_status = OWNED` and `status = AVAILABLE`
10. Update PurchaseOrder status:
   → If all lines fully received: status = COMPLETED
   → If some lines received: status = PARTIALLY_RECEIVED
```

**Ticket receipt / delivery record (after PO confirmed or completed):**

- Purpose: have an auditable receipt of what was delivered by the supplier and mapped to `EventSeat`s.
- Create a `SupplierDeliveryReceipt` (or reuse a PO “receipt” record) that stores:
  - `purchase_order_id`, `supplier_id`
  - `event_id`
  - `delivery_reference` (supplier doc/id), `delivered_at`
  - `line_items`: list of `event_seat_id` (or seat ranges), quantity, `unit_price` (wholesale), optional `retail_price`
  - `fulfillment_method` + any electronic transfer info (account/email/links)
  - `received_by` (user) and timestamps
- PDF/email: generate a simple PDF/HTML receipt summarizing seats delivered (sections/rows/seats or counts by price level), totals, and PO reference; email internally and optionally to supplier.
- Validation: receipt generation should only happen after PO is CONFIRMED and after you’ve marked the seats `ownership_status = OWNED`.

### 6. **Customer Sale Workflow** (Your Agency Sells to Customers)

```
1. End customer browses events on your website/app
2. Customer views available seats (from your owned inventory):
   → Seats where `ownership_status = OWNED` and `status = AVAILABLE`
3. Customer selects tickets and adds to cart
4. Customer sees your retail price (may include markup)
5. Customer checks out:
   → Create SaleBooking (status = RESERVED)
   → Reserve selected EventSeats (set `EventSeat.status = RESERVED`)
   → Create Ticket records for EACH selected EventSeat (status = RESERVED)
6. Customer pays retail price (+ service fees)
7. Process payment:
   → Charge customer's payment method
   → Calculate your profit (retail_price - purchase_price)
   → Record sale
8. Confirm sale:
   → Update Tickets: status = CONFIRMED, issued_at = now
   → Update EventSeats: status = SOLD
   → Update SaleBooking: status = CONFIRMED
9. Generate and send tickets to customer
10. Update your profit/loss records
11. Send sale confirmation to customer
```

### 7. **Inventory Management Workflow**

```
1. Monitor inventory levels:
   → Track available owned seats (`ownership_status = OWNED`, `status = AVAILABLE`)
   → Identify slow-moving inventory
   → Identify high-demand events
2. Adjust pricing:
   → Increase markup for high-demand events
   → Reduce markup for slow-moving inventory
   → Set dynamic pricing based on demand
3. Return unsold tickets to supplier (if contract allows):
   → Create return request
   → Process refund from supplier
   → Update `EventSeat.ownership_status = RETURNED_TO_SUPPLIER`
4. Generate reports:
   → Inventory value
   → Profit margins
   → Sales velocity
   → Supplier performance
```

---

## 🎨 Frontend Features

### Public-Facing Features

#### 1. **Event Discovery**

- Event search with filters (date, location, category, price)
- Featured events carousel
- Event categories/genres
- Map view of events
- Event recommendations
- Trending events

#### 2. **Event Detail Page**

- Event information and description
- Interactive seat map
- Price level visualization
- Date/time selection
- Social sharing
- Related events

#### 3. **Seat Selection**

- Interactive seat map (SVG/Canvas)
- Real-time availability (WebSocket)
- Price display per seat
- Zoom and pan functionality
- Accessibility indicators
- Best available option

#### 4. **Checkout Process**

- Shopping cart
- Customer information form
- Promotion code entry
- Payment form (secure)
- Order review
- Confirmation page

#### 5. **Customer Portal**

- My bookings/tickets
- Ticket download
- Transfer tickets
- Cancellation requests
- Payment history
- Profile management

### Admin/Organizer Features

#### 1. **Event Management Dashboard**

- Create/edit events
- Event templates
- Real-time sales dashboard
- Revenue tracking
- Inventory management
- Hold management

#### 2. **Venue Management**

- Venue CRUD
- Seat map editor
- Seating configuration
- Capacity management

#### 3. **Sales & Reporting Dashboard**

- **Real-time Sales Data**

  - Live ticket sales counter
  - Real-time revenue tracking
  - Current inventory levels
  - Conversion rate monitoring
  - Sales velocity metrics

- **Expected Box Office Revenue**

  - Revenue forecasting dashboard
  - Projected vs actual revenue
  - Confidence intervals
  - Multiple forecast models
  - Historical comparison

- **Performance Cost Statistics**

  - Cost breakdown by category
  - Profit margin analysis
  - Cost per ticket sold
  - ROI calculations
  - Budget vs actual

- **Precision Statistics**

  - Detailed sales breakdowns
  - Revenue by price level
  - Sales by channel
  - Customer segmentation
  - Time-based analysis

- **Multi-dimensional Big Data Statistics**

  - Cross-dimensional analysis
  - Custom query builder
  - Drill-down capabilities
  - Data visualization
  - Export to BI tools

- **Box Office Sales Recommendations**

  - AI-powered pricing suggestions
  - Inventory optimization tips
  - Marketing recommendations
  - Sales strategy insights
  - Actionable insights

- **Local Performance Industry Data Records**
  - Industry benchmarks
  - Local market trends
  - Competitive analysis
  - Historical performance data
  - Market share analysis

#### 4. **Visual Ticketing Entry System**

- **Scanner Interface**

  - QR code / barcode scanner
  - Mobile scanning app
  - Batch scanning support
  - Real-time validation
  - Duplicate detection

- **Entry Management**

  - Visual entry dashboard
  - Real-time attendance tracking
  - Entry statistics
  - Guest check-in interface
  - VIP lane management

- **Guest Information Display**
  - Guest details on scan
  - Classification display
  - Special requirements alerts
  - Entry history
  - Photo verification (optional)

#### 5. **Promotion Management**

- Create promotions
- Track usage
- Performance analytics

---

## 🔐 Security & Compliance

### Security Features

1. **Payment Security**

   - PCI-DSS compliance
   - Tokenization for card data
   - Secure payment gateway integration
   - Fraud detection

2. **Ticket Security**

   - Unique barcode/QR code generation
   - Cryptographic ticket validation
   - Transfer token security
   - Duplicate scan prevention

3. **API Security**

   - Rate limiting (prevent abuse)
   - API key authentication
   - OAuth 2.0 for user authentication
   - CORS configuration
   - Input validation and sanitization

4. **Data Protection**
   - GDPR compliance
   - Data encryption at rest
   - Secure data transmission (HTTPS)
   - PII handling
   - Audit logging (reuse existing audit_logs)

### Anti-Fraud Measures

- Bot detection (CAPTCHA)
- Rate limiting per IP/user
- Duplicate booking detection
- Suspicious activity monitoring
- Account verification

---

## 📊 Scalability Considerations

### High Concurrency Handling

1. **Seat Reservation System**

   - Use Redis for real-time availability cache
   - Implement distributed locking (Redis/Zookeeper)
   - Queue-based reservation processing
   - Optimistic locking for seat updates
   - Reservation timeout (auto-release)

2. **Caching Strategy**

   - Cache event data (Redis)
   - Cache seat availability (Redis with TTL)
   - CDN for static assets (images, seat maps)
   - Application-level caching

3. **Database Optimization**

   - Read replicas for search queries
   - Database sharding by event or tenant
   - Indexing strategy
   - Connection pooling

4. **Message Queue**

   - Use message queue (RabbitMQ/Kafka) for:
     - Ticket generation (async)
     - Email/SMS notifications
     - Payment processing
     - Inventory updates
     - Analytics events

5. **Load Balancing**
   - Multiple application servers
   - Load balancer (nginx/HAProxy)
   - Health checks
   - Auto-scaling based on load

---

## 🔌 Integration Points

### External Integrations

1. **Payment Gateways**

   - Stripe
   - PayPal
   - Square
   - Local payment providers

2. **Email Service**

   - SendGrid
   - AWS SES
   - Mailgun

3. **SMS Service**

   - Twilio
   - AWS SNS
   - Local SMS providers

4. **Maps & Location**

   - Google Maps API
   - Mapbox

5. **Analytics**

   - Google Analytics
   - Custom analytics
   - Business intelligence tools

6. **Social Media**
   - Facebook Events API
   - Twitter API
   - Instagram API

---

## 📱 Platform Support: Web & Mobile Apps

### Web Version Features

- **Responsive Design**: Works on desktop, tablet, mobile browsers
- **Admin Dashboard**: Full-featured management interface
- **Customer Portal**: Self-service ticket management
- **Real-time Updates**: Live sales data, inventory updates
- **Advanced Analytics**: Comprehensive reporting and statistics
- **Visual Seat Map**: Interactive seating selection
- **Guest Management**: Registration and classification interface

### Mobile App Features (Native iOS/Android)

- **Native Performance**: Fast, smooth user experience
- **Push Notifications**: Booking confirmations, reminders, updates
- **Mobile Ticket Wallet**: Store tickets in app
- **Offline Access**: View tickets without internet
- **Mobile Scanning**: QR/barcode scanning for entry (venue staff)
- **Quick Booking**: Streamlined purchase flow
- **Location Services**: Find nearby events
- **Biometric Auth**: Face ID / Fingerprint login

### Progressive Web App (PWA)

- **Installable**: Add to home screen
- **Offline Support**: Basic functionality without internet
- **Push Notifications**: Browser-based notifications
- **Fast Loading**: Optimized performance
- **Cross-platform**: Works on all devices

### Platform-Specific Features

**Web Version:**

- Full admin capabilities
- Advanced analytics dashboard
- Bulk operations
- Data export/import
- Multi-tab support
- Keyboard shortcuts

**Mobile App:**

- Touch-optimized UI
- Camera integration (scanning)
- GPS location services
- Native sharing
- App store distribution
- In-app purchases (if applicable)

---

## 🎯 Advanced Features (Future Enhancements)

### 1. **Dynamic Pricing**

- Demand-based pricing
- Surge pricing for popular events
- Last-minute discounts
- A/B testing for pricing strategies

### 2. **Waitlist System**

- Join waitlist for sold-out events
- Automatic notification when tickets available
- Priority queue based on join time

### 3. **Season Tickets / Subscriptions**

- Multi-event packages
- Subscription management
- Auto-renewal
- Package discounts

### 4. **Resale Marketplace**

- Ticket resale platform
- Price controls
- Transfer fees
- Buyer/seller protection

### 5. **Loyalty Program**

- Points accumulation
- Rewards redemption
- Tiered membership
- Exclusive access

### 6. **Group Bookings**

- Bulk ticket purchases
- Group discounts
- Seat block reservations
- Group management tools

### 7. **Accessibility Features**

- Wheelchair-accessible seat filtering
- Companion seat booking
- Audio description availability
- Sign language interpreter requests

### 8. **Multi-Language Support**

- Internationalization (i18n)
- Multi-currency support
- Localized payment methods
- Regional compliance

---

## 🗄️ Database Schema Highlights

### Key Tables (extending your existing schema)

### Analytics & Reporting Tables

```sql
-- Real-time Sales Data (for fast queries)
CREATE TABLE realtime_sales (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    tickets_sold INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL NOT NULL DEFAULT 0,
    tickets_available INTEGER NOT NULL,
    tickets_reserved INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL,
    avg_ticket_price DECIMAL,
    INDEX idx_realtime_event_time (tenant_id, event_id, timestamp)
);

-- Revenue Forecasts
CREATE TABLE revenue_forecasts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    forecast_date DATE NOT NULL,
    expected_revenue DECIMAL NOT NULL,
    confidence_level DECIMAL,  -- 0-1
    forecast_method VARCHAR(50),  -- 'historical', 'trend', 'ml'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, event_id, forecast_date)
);

-- Performance Cost Statistics
CREATE TABLE performance_costs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    cost_category VARCHAR(50) NOT NULL,  -- 'venue', 'artist', 'marketing', etc.
    cost_amount DECIMAL NOT NULL,
    cost_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-dimensional Analytics Data
CREATE TABLE analytics_dimensions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    dimension_name VARCHAR(100) NOT NULL,  -- 'time', 'location', 'event_type', etc.
    dimension_value VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,  -- 'revenue', 'tickets_sold', etc.
    metric_value DECIMAL NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_analytics_dimensions (tenant_id, dimension_name, period_start)
);

-- Sales Recommendations
CREATE TABLE sales_recommendations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    recommendation_type VARCHAR(50) NOT NULL,  -- 'pricing', 'inventory', 'marketing'
    recommendation_text TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    confidence_score DECIMAL,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Industry Data Records
CREATE TABLE industry_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    record_type VARCHAR(50) NOT NULL,  -- 'local_performance', 'benchmark', 'trend'
    event_type VARCHAR(50),
    location VARCHAR(255),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_industry_records (tenant_id, record_type, period_start)
);

-- Data Retention Policies
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    data_type VARCHAR(50) NOT NULL,  -- 'bookings', 'tickets', 'transactions', etc.
    retention_period_days INTEGER NOT NULL,
    archive_after_days INTEGER,  -- Archive before deletion
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Archived Data (for long-term storage)
CREATE TABLE archived_data (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    original_table VARCHAR(100) NOT NULL,
    original_id UUID NOT NULL,
    data JSONB NOT NULL,  -- Full record data
    archived_at TIMESTAMP DEFAULT NOW(),
    retention_until TIMESTAMP,
    INDEX idx_archived_data (tenant_id, original_table, archived_at)
);

-- Guest Information
CREATE TABLE guests (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    event_id UUID NOT NULL REFERENCES events(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    guest_type VARCHAR(50) NOT NULL,
    classification VARCHAR(50),
    age_group VARCHAR(50),
    special_requirements VARCHAR(50)[],
    registration_date TIMESTAMP DEFAULT NOW(),
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP,
    notes TEXT,
    metadata JSONB,
    INDEX idx_guests_event (tenant_id, event_id),
    INDEX idx_guests_ticket (tenant_id, ticket_id)
);
```

### Key Tables (extending your existing schema)

```sql
-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    category_id UUID REFERENCES item_categories(id),
    venue_id UUID REFERENCES venues(id),
    organizer_id UUID REFERENCES customers(id),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    timezone VARCHAR(50),
    status VARCHAR(50),
    is_featured BOOLEAN DEFAULT FALSE,
    image_urls JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Venues
CREATE TABLE venues (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    address_id UUID REFERENCES addresses(id),
    capacity INTEGER,
    venue_type VARCHAR(50),
    seating_configuration JSONB,
    amenities TEXT[],
    contact_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seats
CREATE TABLE seats (
    id UUID PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES venues(id),
    section VARCHAR(50),
    row VARCHAR(50),
    seat_number VARCHAR(50),
    seat_type VARCHAR(50),
    x_coordinate DECIMAL,
    y_coordinate DECIMAL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Event Seats (junction with pricing)
CREATE TABLE event_seats (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id),
    seat_id UUID NOT NULL REFERENCES seats(id),
    price_level_id UUID REFERENCES price_levels(id),
    base_price DECIMAL NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    hold_reason VARCHAR(255),
    hold_until TIMESTAMP,
    UNIQUE(event_id, seat_id)
);

-- Bookings (supports single or multiple tickets)
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    event_id UUID NOT NULL REFERENCES events(id),
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    ticket_count INTEGER NOT NULL DEFAULT 1,  -- Number of tickets in booking
    total_amount DECIMAL NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    service_fee DECIMAL DEFAULT 0,
    tax_amount DECIMAL DEFAULT 0,
    discount_amount DECIMAL DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    reserved_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Booking Items (line items - one per ticket)
CREATE TABLE booking_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    quantity INTEGER NOT NULL DEFAULT 1,  -- Typically 1 per ticket
    unit_price DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    seat_number VARCHAR(50),  -- For reference
    section VARCHAR(50),       -- For reference
    row VARCHAR(50),          -- For reference
    is_cancelled BOOLEAN DEFAULT FALSE,  -- For partial cancellations
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_booking_items_booking ON booking_items(tenant_id, booking_id);
CREATE INDEX idx_booking_items_ticket ON booking_items(tenant_id, ticket_id);

-- Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    event_seat_id UUID NOT NULL REFERENCES event_seats(id),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(255) UNIQUE NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    price_paid DECIMAL NOT NULL,
    currency VARCHAR(3),
    transfer_token VARCHAR(255),
    issued_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    scanned_at TIMESTAMP
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    amount DECIMAL NOT NULL,
    currency VARCHAR(3),
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    provider_transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    processed_at TIMESTAMP,
    refund_amount DECIMAL,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    promotion_type VARCHAR(50) NOT NULL,
    discount_value DECIMAL NOT NULL,
    min_purchase_amount DECIMAL,
    max_discount_amount DECIMAL,
    applicable_event_types VARCHAR(50)[],
    applicable_price_levels UUID[],
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    usage_limit INTEGER,
    usage_limit_per_customer INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers (Event organizers/venues who sell tickets to your agency)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,  -- Your agency's tenant
    customer_id UUID NOT NULL REFERENCES customers(id),  -- Supplier as customer
    supplier_type VARCHAR(50) NOT NULL,
    wholesale_discount_rate DECIMAL NOT NULL DEFAULT 0.20,
    credit_limit DECIMAL,
    payment_terms VARCHAR(50) DEFAULT 'NET_30',
    contract_start_date TIMESTAMP,
    contract_end_date TIMESTAMP,
    contact_person VARCHAR(255),
    business_license VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders (Your agency buys tickets from suppliers)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    warehouse_id UUID REFERENCES store_locations(id),
    po_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    currency VARCHAR(10) DEFAULT 'USD',
    expected_date DATE,
    submitted_at TIMESTAMP,
    submitted_by VARCHAR(255),
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    closed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    reference VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    payment_terms VARCHAR(50),
    shipping_address_id UUID REFERENCES addresses(id),
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, po_number) WHERE po_number IS NOT NULL
);

-- Purchase Order Lines (supports multiple ticket types/products per PO)
CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
    item_id UUID NOT NULL,  -- References Ticket/TicketType
    item_code VARCHAR(255),
    item_name VARCHAR(255),
    description TEXT,
    quantity DECIMAL NOT NULL,
    uom VARCHAR(50) NOT NULL DEFAULT 'TICKET',
    unit_price DECIMAL NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expected_date DATE,
    received_quantity DECIMAL DEFAULT 0,
    cancelled_quantity DECIMAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory (MVP simplification)
-- No separate `agency_inventory` table. The agency's inventory is represented by columns on `event_seats`:
--   - ownership_status: NOT_OWNED | OWNED | RETURNED_TO_SUPPLIER
--   - supplier_id, purchase_order_id
--   - purchase_price, retail_price
-- Seat sellability remains: ownership_status=OWNED AND status=AVAILABLE

-- Accounts Payable (What your agency owes suppliers)
CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    invoice_number VARCHAR(255),
    amount DECIMAL NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    payment_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for brokerage operations
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_active ON suppliers(tenant_id, is_active);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(tenant_id, supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(tenant_id, status);
CREATE INDEX idx_purchase_order_lines_po ON purchase_order_lines(tenant_id, purchase_order_id);
CREATE INDEX idx_purchase_order_lines_item ON purchase_order_lines(tenant_id, item_id);
CREATE INDEX idx_purchase_order_lines_status ON purchase_order_lines(tenant_id, status);
CREATE INDEX idx_accounts_payable_supplier ON accounts_payable(tenant_id, supplier_id);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(tenant_id, status);
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

- [ ] Design database schema
- [ ] Create core domain models (Event, Venue, Seat, Booking, Ticket)
- [ ] Set up basic API endpoints
- [ ] Implement authentication/authorization
- [ ] Basic event CRUD operations
- [ ] Basic venue management

### Phase 2: Core Booking (Weeks 5-8)

- [ ] Seat availability system
- [ ] Reservation system (with timeout)
- [ ] Booking creation workflow
- [ ] Payment integration (Stripe)
- [ ] Ticket generation
- [ ] Basic email notifications

### Phase 3: User Experience (Weeks 9-12)

- [ ] Event discovery/search
- [ ] Interactive seat map
- [ ] Checkout flow
- [ ] Customer portal
- [ ] Ticket download/transfer
- [ ] Mobile-responsive design

### Phase 4: Advanced Features (Weeks 13-16)

- [ ] Promotions system
- [ ] Pre-sales management
- [ ] Hold management
- [ ] Reporting & analytics
- [ ] Admin dashboard
- [ ] Ticket scanning/validation

### Phase 5: Scale & Optimize (Weeks 17-20)

- [ ] Caching implementation
- [ ] Message queue integration
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security hardening
- [ ] Documentation

---

## 📚 Technical Stack Recommendations

### Backend (Current Stack)

- **Framework**: FastAPI (already using)
- **Database**: PostgreSQL (already using)
- **ORM**: SQLModel (already using)
- **Caching**: Redis
- **Message Queue**: RabbitMQ or Apache Kafka
- **Task Queue**: Celery (for async tasks)

### Frontend

- **Framework**: React/Next.js (if not already using)
- **State Management**: Zustand or Redux
- **UI Library**: shadcn/ui (if using)
- **Maps**: Mapbox GL JS or Google Maps
- **Charts**: Recharts or Chart.js

### Infrastructure

- **Containerization**: Docker (already using)
- **Orchestration**: Docker Compose / Kubernetes
- **CDN**: CloudFlare or AWS CloudFront
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki

---

## 💡 Key Design Patterns

### 1. **Domain-Driven Design (DDD)**

Your existing architecture already follows DDD principles. Continue with:

- Aggregate roots (Booking, Event)
- Value objects (Price, Address)
- Domain events (BookingConfirmed, TicketScanned)
- Repositories pattern

### 2. **CQRS (Command Query Responsibility Segregation)**

- Separate read and write models
- Optimize reads with denormalized views
- Use event sourcing for audit trail

### 3. **Saga Pattern**

For distributed transactions:

- Booking creation saga
- Payment processing saga
- Cancellation saga

### 4. **Circuit Breaker**

- Protect payment service calls
- Handle external API failures gracefully

### 5. **Outbox Pattern**

- Reliable event publishing
- Ensure eventual consistency

---

## 🎓 Learning Resources

### Ticketmaster Documentation

- Ticketmaster Developer APIs
- TM1 Events documentation
- Partner API documentation

### System Design

- High-concurrency systems
- Distributed locking
- Event-driven architecture
- Microservices patterns

### Industry Best Practices

- PCI-DSS compliance
- GDPR compliance
- Accessibility standards (WCAG)

---

## 📝 Next Steps

1. **Review & Prioritize**: Review this document and prioritize features based on your business needs
2. **Technical Design**: Create detailed technical design documents for each service
3. **Proof of Concept**: Build a small POC for critical workflows (booking, payment)
4. **Database Design**: Finalize database schema and create migrations
5. **API Design**: Design RESTful APIs with OpenAPI/Swagger specs
6. **UI/UX Design**: Create wireframes and mockups for key user flows
7. **Security Review**: Plan security measures and compliance requirements
8. **Infrastructure Planning**: Plan deployment and scaling strategy

---

## 🤝 Questions to Consider

1. **Business Model**

   - Will you charge service fees per ticket?
   - Commission-based model?
   - Subscription model for organizers?

2. **Target Market**

   - B2C (direct to consumers)?
   - B2B (venues/organizers)?
   - Both?

3. **Geographic Scope**

   - Single country?
   - Multi-country?
   - Multi-currency support?

4. **Event Types**

   - All event types?
   - Focus on specific types initially?

5. **Competitive Differentiation**
   - What makes your platform unique?
   - Lower fees?
   - Better UX?
   - Specialized features?

---

## 📞 Support & Resources

- Your existing codebase structure
- FastAPI documentation
- PostgreSQL documentation
- Redis documentation
- Payment gateway documentation (Stripe, PayPal)

---

## 💻 Code Example: Multi-Ticket Booking Flow

Here's a comprehensive Python example showing multi-ticket booking behavior:

```python
# ============================================================
# MULTI-TICKET BOOKING RESERVATION
# ============================================================

async def create_booking_with_multiple_tickets(
    event_id: str,
    customer_id: str,
    seat_selections: List[dict],  # [{"seat_id": "s1", "price_level_id": "pl1"}, ...]
    quantity: int = None  # If None, use len(seat_selections)
):
    """
    Create booking with one or multiple tickets

    Args:
        seat_selections: List of seat selections with optional price levels
        quantity: Number of tickets (if None, inferred from seat_selections)
    """

    # 1. Validate all seats are available (ATOMIC CHECK)
    unavailable_seats = []
    seat_prices = {}

    for selection in seat_selections:
        seat_id = selection["seat_id"]
        is_available = await inventory_service.check_seat_availability(event_id, seat_id)

        if not is_available:
            unavailable_seats.append(seat_id)
        else:
            # Get price for this seat
            price_level_id = selection.get("price_level_id")
            price = await get_seat_price(event_id, seat_id, price_level_id)
            seat_prices[seat_id] = price

    # If ANY seat unavailable, fail entire booking
    if unavailable_seats:
        raise BusinessRuleError(
            f"Seats no longer available: {', '.join(unavailable_seats)}. "
            "Please select different seats."
        )

    # 2. Calculate totals
    total_amount = sum(seat_prices.values())
    ticket_count = len(seat_selections)

    # 3. Create Booking record (aggregates all tickets)
    booking = Booking(
        tenant_id=tenant_id,
        customer_id=customer_id,
        event_id=event_id,
        booking_number=generate_booking_number(),
        status=BookingStatus.RESERVED,
        total_amount=total_amount,
        ticket_count=ticket_count,  # Number of tickets in booking
        reserved_until=datetime.now() + timedelta(minutes=15)
    )
    booking = await booking_repo.save(booking)

    # 4. CREATE TICKET RECORDS for EACH seat (status = RESERVED)
    tickets = []
    booking_items = []

    for idx, selection in enumerate(seat_selections):
        seat_id = selection["seat_id"]
        price = seat_prices[seat_id]

        # Create ticket
        ticket = Ticket(
            tenant_id=tenant_id,
            booking_id=booking.id,
            event_id=event_id,
            event_seat_id=seat_id,
            ticket_number=generate_ticket_number(),  # Unique per ticket
            barcode=generate_barcode(),              # Unique barcode
            qr_code=generate_qr_code(),              # Unique QR code
            status=TicketStatus.RESERVED,
            price_paid=price,
            reserved_at=datetime.now(),
            reserved_until=booking.reserved_until  # Same timeout for all
        )
        ticket = await ticket_repo.save(ticket)
        tickets.append(ticket)

        # Create booking item (line item)
        booking_item = BookingItem(
            tenant_id=tenant_id,
            booking_id=booking.id,
            ticket_id=ticket.id,
            quantity=1,  # Each ticket is quantity 1
            unit_price=price,
            total_price=price,
            seat_number=await get_seat_number(seat_id),
            section=await get_seat_section(seat_id),
            row=await get_seat_row(seat_id)
        )
        booking_item = await booking_item_repo.save(booking_item)
        booking_items.append(booking_item)

        # Lock seat in inventory (ATOMIC - all or nothing)
        try:
            await inventory_service.reserve_seat(event_id, seat_id)
        except Exception as e:
            # If ANY seat fails to reserve, rollback entire booking
            await rollback_booking(booking.id)
            raise BusinessRuleError(f"Failed to reserve seat {seat_id}: {str(e)}")

    return {
        "booking": booking,
        "tickets": tickets,
        "booking_items": booking_items,
        "total_amount": total_amount,
        "ticket_count": ticket_count
    }


# ============================================================
# CONFIRM BOOKING (PAYMENT SUCCESS)
# ============================================================

async def confirm_booking(booking_id: str, payment_info: dict):
    """Confirm booking after successful payment - CONFIRMS ALL TICKETS"""

    # 1. Get booking with all tickets
    booking = await booking_repo.get_by_id(booking_id)
    if booking.status != BookingStatus.RESERVED:
        raise BusinessRuleError("Booking not in reserved state")

    # Check if reservation expired
    if booking.reserved_until < datetime.now():
        await release_expired_booking(booking_id)
        raise BusinessRuleError("Reservation expired")

    # 2. Process payment for TOTAL amount
    payment_result = await payment_service.process_payment(
        booking_id=booking_id,
        amount=booking.total_amount,  # Total for all tickets
        customer_id=booking.customer_id,
        payment_info=payment_info
    )

    if payment_result.success:
        # 3. Get ALL tickets in booking
        tickets = await ticket_repo.list_by_booking(booking_id)

        # 4. CONFIRM ALL TICKETS (atomic operation)
        for ticket in tickets:
            ticket.status = TicketStatus.CONFIRMED
            ticket.issued_at = datetime.now()
            ticket.reserved_until = None
            await ticket_repo.save(ticket)

        # 5. Update booking
        booking.status = BookingStatus.CONFIRMED
        booking.payment_status = PaymentStatus.COMPLETED
        booking.payment_transaction_id = payment_result.transaction_id
        await booking_repo.save(booking)

        # 6. Send confirmation with ALL tickets
        await notification_service.send_booking_confirmation(
            booking_id=booking_id,
            include_all_tickets=True
        )

        return {"success": True, "booking": booking, "tickets": tickets}
    else:
        # Payment failed - tickets remain RESERVED
        # Will auto-release after timeout
        raise PaymentError("Payment processing failed")


# ============================================================
# PARTIAL CANCELLATION
# ============================================================

async def cancel_tickets_partially(
    booking_id: str,
    ticket_ids_to_cancel: List[str],
    cancellation_reason: str = None
):
    """Cancel specific tickets from a booking"""

    # 1. Get booking
    booking = await booking_repo.get_by_id(booking_id)
    if booking.status != BookingStatus.CONFIRMED:
        raise BusinessRuleError("Can only cancel confirmed bookings")

    # 2. Get all tickets
    all_tickets = await ticket_repo.list_by_booking(booking_id)
    tickets_to_cancel = [t for t in all_tickets if t.id in ticket_ids_to_cancel]
    tickets_to_keep = [t for t in all_tickets if t.id not in ticket_ids_to_cancel]

    if len(tickets_to_cancel) == 0:
        raise BusinessRuleError("No tickets selected for cancellation")

    if len(tickets_to_cancel) == len(all_tickets):
        # All tickets cancelled - use full cancellation instead
        return await cancel_booking_fully(booking_id, cancellation_reason)

    # 3. Check cancellation policy
    cancellation_policy = await get_cancellation_policy(booking.event_id)
    if not cancellation_policy.allow_partial_cancellation:
        raise BusinessRuleError("Partial cancellation not allowed. Must cancel entire booking.")

    # 4. Calculate refunds
    total_refund = decimal.Decimal(0)
    for ticket in tickets_to_cancel:
        refund_amount = calculate_refund(
            ticket.price_paid,
            cancellation_policy
        )
        total_refund += refund_amount

    # 5. Process partial refund
    refund_result = await payment_service.process_refund(
        booking_id=booking_id,
        amount=total_refund,
        ticket_ids=ticket_ids_to_cancel
    )

    if refund_result.success:
        # 6. Cancel selected tickets
        for ticket in tickets_to_cancel:
            ticket.status = TicketStatus.CANCELLED
            ticket.cancelled_at = datetime.now()
            await ticket_repo.save(ticket)

            # Release seat
            await inventory_service.release_seat(
                ticket.event_id,
                ticket.event_seat_id
            )

        # 7. Update booking
        booking.total_amount -= total_refund
        booking.ticket_count = len(tickets_to_keep)
        booking.discount_amount += total_refund  # Track refund as discount
        await booking_repo.save(booking)

        # 8. Update booking items
        for ticket in tickets_to_cancel:
            booking_item = await booking_item_repo.get_by_ticket(ticket.id)
            booking_item.is_cancelled = True
            await booking_item_repo.save(booking_item)

        # 9. Send updated confirmation
        await notification_service.send_partial_cancellation_confirmation(
            booking_id=booking_id,
            cancelled_tickets=tickets_to_cancel,
            remaining_tickets=tickets_to_keep,
            refund_amount=total_refund
        )

        return {
            "success": True,
            "cancelled_tickets": len(tickets_to_cancel),
            "remaining_tickets": len(tickets_to_keep),
            "refund_amount": total_refund
        }
    else:
        raise RefundError("Refund processing failed")


# ============================================================
# SEAT SELECTION HELPERS
# ============================================================

async def find_adjacent_seats(
    event_id: str,
    quantity: int,
    preferred_section: str = None
):
    """Find adjacent seats for multiple tickets"""

    available_seats = await inventory_service.get_available_seats(
        event_id=event_id,
        section=preferred_section
    )

    # Group seats by row
    seats_by_row = {}
    for seat in available_seats:
        row = seat.row
        if row not in seats_by_row:
            seats_by_row[row] = []
        seats_by_row[row].append(seat)

    # Find rows with enough adjacent seats
    for row, seats in seats_by_row.items():
        seats.sort(key=lambda s: int(s.seat_number))

        # Check for consecutive seats
        for i in range(len(seats) - quantity + 1):
            consecutive = seats[i:i+quantity]
            if all(
                int(consecutive[j].seat_number) == int(consecutive[0].seat_number) + j
                for j in range(quantity)
            ):
                return [s.id for s in consecutive]

    return None  # No adjacent seats found


async def find_best_available_seats(
    event_id: str,
    quantity: int,
    price_level_id: str = None
):
    """Find best available seats for quantity"""

    available_seats = await inventory_service.get_available_seats(
        event_id=event_id,
        price_level_id=price_level_id
    )

    # Sort by quality (e.g., section, row, seat number)
    available_seats.sort(key=lambda s: (
        s.section_priority,
        s.row_priority,
        int(s.seat_number)
    ))

    # Return first N seats
    return [s.id for s in available_seats[:quantity]]


# Stage 2: Payment Confirmation (Tickets Confirmed Here)
async def confirm_booking(booking_id: str, payment_info: dict):
    """Confirm booking after successful payment - CONFIRMS TICKETS"""

    # 1. Process payment
    payment_result = await payment_service.process_payment(
        booking_id=booking_id,
        payment_info=payment_info
    )

    if payment_result.success:
        # 2. Get existing tickets (already created in reservation)
        tickets = await ticket_repo.list_by_booking(booking_id)

        # 3. UPDATE TICKETS TO CONFIRMED
        for ticket in tickets:
            ticket.status = TicketStatus.CONFIRMED  # ⚠️ Change to CONFIRMED
            ticket.issued_at = datetime.now()      # Set issued timestamp
            ticket.reserved_until = None            # Clear reservation timeout
            await ticket_repo.save(ticket)

        # 4. Update Booking
        booking = await booking_repo.get_by_id(booking_id)
        booking.status = BookingStatus.CONFIRMED
        booking.payment_status = PaymentStatus.COMPLETED
        await booking_repo.save(booking)

        # 5. Send confirmation email with tickets
        await notification_service.send_booking_confirmation(booking_id)

        return {"success": True, "tickets": tickets}
    else:
        # Payment failed - tickets remain RESERVED
        # Will auto-release after reserved_until timeout
        return {"success": False, "error": payment_result.error}


# Background Job: Auto-release expired reservations
async def release_expired_reservations():
    """Cleanup job - releases seats if payment not completed"""

    expired_tickets = await ticket_repo.find_expired_reservations(
        status=TicketStatus.RESERVED,
        before=datetime.now()
    )

    for ticket in expired_tickets:
        # Cancel ticket
        ticket.status = TicketStatus.CANCELLED
        await ticket_repo.save(ticket)

        # Release seat
        await inventory_service.release_seat(
            ticket.event_id,
            ticket.event_seat_id
        )

        # Update booking
        booking = await booking_repo.get_by_id(ticket.booking_id)
        booking.status = BookingStatus.CANCELLED
        await booking_repo.save(booking)
```

**Key Points:**

- ✅ Tickets are **CREATED** at reservation time (Stage 1)
- ✅ Tickets are **CONFIRMED** after payment (Stage 2)
- ✅ If payment fails, tickets remain RESERVED and auto-release after timeout
- ✅ This prevents double-booking while allowing payment processing time

---

## 💼 Code Example: Brokerage Operations Flow

Here's how your agency operates as a broker:

```python
# ============================================================
# PURCHASE FROM SUPPLIER WORKFLOW
# Your agency buys tickets from event organizers/venues
# ============================================================

async def create_purchase_order(
    supplier_id: str,
    event_id: str,
    quantity: int,
    unit_price: decimal.Decimal,
    payment_terms: str = "NET_30"
):
    """Your agency creates a purchase order to buy tickets from supplier"""

    # 1. Get supplier details
    supplier = await supplier_repo.get_by_id(supplier_id)
    if not supplier.is_active:
        raise BusinessRuleError("Supplier is not active")

    # 2. Get event details
    event = await event_repo.get_by_id(event_id)

    # 3. Create Purchase Order header
    po = PurchaseOrder(
        tenant_id=tenant_id,  # Your agency's tenant
        supplier_id=supplier_id,
        po_number=generate_po_number(),
        status=PurchaseOrderStatus.PENDING,
        currency="USD",
        payment_terms=payment_terms,
        expected_date=event.start_datetime.date() - timedelta(days=7)  # 1 week before event
    )
    po = await purchase_order_repo.save(po)

    # 4. Add line items (supports multiple ticket types/products)
    total_amount = Decimal('0')
    for line_item in line_items:  # line_items = [{"item_id": "...", "quantity": 100, "unit_price": 50.00}, ...]
        item = await ticket_repo.get_by_id(line_item["item_id"])
        line_total = line_item["quantity"] * line_item["unit_price"]
        total_amount += line_total

        po_line = PurchaseOrderLine(
            tenant_id=tenant_id,
            purchase_order_id=po.id,
            item_id=line_item["item_id"],
            item_code=item.code,
            item_name=item.name,
            quantity=line_item["quantity"],
            uom="TICKET",
            unit_price=line_item["unit_price"],
            status=PurchaseOrderLineStatus.PENDING,
            expected_date=po.expected_date
        )
        await purchase_order_line_repo.save(po_line)

    # 5. If immediate payment, process payment to supplier
    if payment_terms == "IMMEDIATE":
        payment_result = await payment_service.process_payment_to_supplier(
            supplier_id=supplier_id,
            amount=total_amount,
            purchase_order_id=po.id
        )

        if payment_result.success:
            po.status = PurchaseOrderStatus.CONFIRMED
    else:
        # Create accounts payable entry
        await create_accounts_payable(
            supplier_id=supplier_id,
            purchase_order_id=po.id,
            amount=total_amount,
            due_date=calculate_due_date(payment_terms)
        )

    await purchase_order_repo.save(po)

    return po


async def receive_tickets_from_supplier(
    purchase_order_id: str,
    line_receipts: List[dict]  # [{"line_id": "...", "quantity": 50, "seat_data": [...]}, ...]
):
    """Receive supplier allocation and mark owned `EventSeat`s (per line item)."""

    # 1. Get purchase order
    po = await purchase_order_repo.get_by_id(purchase_order_id)
    if po.status != PurchaseOrderStatus.CONFIRMED:
        raise BusinessRuleError("Purchase order not confirmed")

    # 2. Process receipts for each line item
    all_lines_complete = True
    for receipt in line_receipts:
        po_line = await purchase_order_line_repo.get_by_id(receipt["line_id"])

        # Update received quantity
        po_line.received_quantity += receipt["quantity"]

        # Mark owned seats for this line item (seat-map driven inventory)
        for seat_info in receipt["seat_data"]:
            event_seat_id = seat_info["event_seat_id"]
            retail_price = seat_info.get("retail_price")

            event_seat = await event_seat_repo.get_by_id(event_seat_id)
            event_seat.ownership_status = OwnershipStatus.OWNED
            event_seat.supplier_id = po.supplier_id
            event_seat.purchase_order_id = po.id
            event_seat.purchase_price = po_line.unit_price
            event_seat.retail_price = retail_price
            await event_seat_repo.save(event_seat)

        # Update line status
        if po_line.received_quantity >= po_line.quantity:
            po_line.status = PurchaseOrderLineStatus.RECEIVED
        elif po_line.received_quantity > 0:
            po_line.status = PurchaseOrderLineStatus.PARTIALLY_RECEIVED
            all_lines_complete = False
        else:
            all_lines_complete = False

        await purchase_order_line_repo.save(po_line)

    # 3. Update purchase order status
    if all_lines_complete:
        po.status = PurchaseOrderStatus.COMPLETED
        po.closed_at = datetime.now()
    else:
        po.status = PurchaseOrderStatus.PARTIALLY_RECEIVED

    await purchase_order_repo.save(po)

    return {"purchase_order": po}


# ============================================================
# CUSTOMER SALE WORKFLOW
# Your agency sells tickets to end customers
# ============================================================

async def create_customer_sale(
    customer_id: str,
    event_seat_ids: List[str],  # Seats from your owned inventory
    retail_price: decimal.Decimal
):
    """Your agency sells tickets to end customer"""

    # 1. Get customer
    customer = await customer_repo.get_by_id(customer_id)

    # 2. Get owned EventSeats and calculate totals
    event_seats = []
    total_purchase_cost = decimal.Decimal(0)

    for event_seat_id in event_seat_ids:
        event_seat = await event_seat_repo.get_by_id(event_seat_id)
        if event_seat.ownership_status != OwnershipStatus.OWNED or event_seat.status != EventSeatStatus.AVAILABLE:
            raise BusinessRuleError(f"Seat {event_seat_id} not available")

        event_seats.append(event_seat)
        total_purchase_cost += event_seat.purchase_price

    # Calculate service fee
    service_fee_rate = 0.10  # 10% service fee
    service_fee = retail_price * service_fee_rate
    total_amount = retail_price + service_fee

    # Calculate your profit
    your_profit = retail_price - total_purchase_cost
    markup_percentage = (your_profit / total_purchase_cost) * 100 if total_purchase_cost > 0 else 0

    # 3. Create SaleBooking
    sale_booking = SaleBooking(
        tenant_id=tenant_id,
        customer_id=customer_id,
        event_id=event_seats[0].event_id,  # All seats from same event
        booking_type="CUSTOMER_SALE",
        status=BookingStatus.RESERVED,
        total_amount=total_amount,
        service_fee=service_fee,
        payment_status=PaymentStatus.PENDING
    )
    sale_booking = await booking_repo.save(sale_booking)

    # 4. Reserve seats (inventory) AND create Ticket records (MVP decision)
    per_seat_retail = retail_price / len(event_seat_ids)  # Split price
    reserved_until = datetime.now() + timedelta(minutes=15)
    for event_seat in event_seats:
        event_seat.status = EventSeatStatus.RESERVED
        event_seat.retail_price = per_seat_retail
        await event_seat_repo.save(event_seat)

        ticket = Ticket(
            tenant_id=tenant_id,
            booking_id=sale_booking.id,
            event_id=event_seat.event_id,
            event_seat_id=event_seat.id,
            ticket_number=generate_ticket_number(),
            barcode=generate_barcode(),
            qr_code=generate_qr_code(),
            status=TicketStatus.RESERVED,
            price_paid=per_seat_retail,
            reserved_at=datetime.now(),
            reserved_until=reserved_until
        )
        await ticket_repo.save(ticket)

    # 5. Process payment from customer
    payment_result = await payment_service.process_payment(
        booking_id=sale_booking.id,
        amount=total_amount,
        customer_id=customer_id
    )

    if payment_result.success:
        # 6. Confirm sale: mark seats as sold AND confirm all tickets in the booking
        for event_seat in event_seats:
            event_seat.status = EventSeatStatus.SOLD
            await event_seat_repo.save(event_seat)

        tickets = await ticket_repo.list_by_booking(sale_booking.id)
        for ticket in tickets:
            ticket.status = TicketStatus.CONFIRMED
            ticket.issued_at = datetime.now()
            ticket.reserved_until = None
            await ticket_repo.save(ticket)

        # 7. Update sale booking
        sale_booking.status = BookingStatus.CONFIRMED
        sale_booking.payment_status = PaymentStatus.COMPLETED
        sale_booking.your_profit = your_profit
        sale_booking.markup_percentage = markup_percentage
        await booking_repo.save(sale_booking)

        # 8. Send tickets to customer
        await notification_service.send_ticket_confirmation(
            customer_id=customer_id,
            booking_id=sale_booking.id
        )

        # 9. Record sale for reporting
        await record_sale(
            booking_id=sale_booking.id,
            profit=your_profit,
            revenue=retail_price
        )

        return sale_booking
    else:
        # Payment failed - release reservations
        for event_seat in event_seats:
            event_seat.status = EventSeatStatus.AVAILABLE
            await event_seat_repo.save(event_seat)

        tickets = await ticket_repo.list_by_booking(sale_booking.id)
        for ticket in tickets:
            ticket.status = TicketStatus.CANCELLED
            await ticket_repo.save(ticket)

        sale_booking.status = BookingStatus.CANCELLED
        await booking_repo.save(sale_booking)
        raise PaymentError("Payment processing failed")
```

**Key Points for Brokerage System:**

1. ✅ **Purchase from Suppliers**: Your agency buys tickets from event organizers/venues at wholesale prices
2. ✅ **Inventory Management (MVP)**: Seats you own are represented in `EventSeat` (`ownership_status = OWNED`)
3. ✅ **Retail Sales**: You set retail prices (with markup) and sell to end customers
4. ✅ **Profit Tracking**: System tracks your profit (retail_price - purchase_price)
5. ✅ **Purchase Orders**: Manage purchases from suppliers with PO system
6. ✅ **Accounts Payable**: Track what you owe suppliers (if payment terms are NET_30/60)
7. ✅ **Ticket Transfer**: Ownership transfers from your inventory to end customer on sale
8. ✅ **Pricing Control**: You control retail pricing and markup

---

## 🎫 Multi-Ticket Booking: Key Considerations Summary

### Design Principles:

1. **Atomic Operations**

   - All tickets in a booking reserved/released together
   - If ANY seat unavailable, entire booking fails
   - Prevents partial bookings and inventory inconsistencies

2. **Single Payment Transaction**

   - One payment for entire booking (all tickets)
   - Simpler payment processing
   - Easier refund handling

3. **Flexible Seat Selection**

   - Support specific seat selection
   - Support "best available" algorithms
   - Support adjacent seat finding
   - Support same-section grouping

4. **Partial Cancellation Support**

   - Allow cancelling individual tickets (if policy permits)
   - Calculate refunds per ticket
   - Update booking totals accordingly
   - Keep remaining tickets valid

5. **Booking Aggregation**
   - `Booking` = Container for multiple tickets
   - `BookingItem` = One line item per ticket
   - `Ticket` = Individual ticket record
   - All share same booking_number, customer, payment

### Database Design:

- `bookings.ticket_count` - Track number of tickets
- `booking_items` table - One row per ticket (line items)
- `booking_items.is_cancelled` - Support partial cancellations
- Indexes on `booking_id` for fast lookups

### API Design:

- `POST /api/bookings` - Accept array of seat selections
- `POST /api/bookings/{id}/tickets/cancel` - Cancel specific tickets
- Helper endpoints for seat finding (adjacent, best available)

### Business Rules:

- Reservation timeout applies to entire booking
- Payment must cover all tickets (no partial payments)
- Cancellation policy can allow/deny partial cancellations
- Refunds calculated per ticket based on policy
- All tickets in booking share same status (mostly)

### Edge Cases to Handle:

1. **Seat Availability Race Condition**

   - Check all seats atomically before reserving
   - If any unavailable, fail entire booking
   - Suggest alternatives if possible

2. **Payment Timeout**

   - If payment fails, release ALL tickets
   - Don't leave partial reservations

3. **Partial Cancellation**

   - Update booking totals
   - Recalculate service fees if needed
   - Keep booking active if tickets remain

4. **Group Bookings**
   - Consider group discounts
   - Track group leader
   - Support group payment methods

---

**Document Version**: 1.1  
**Last Updated**: 2024-12-13  
**Author**: AI Assistant  
**Status**: Draft - For Review & Discussion
