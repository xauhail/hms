# New Features Implementation Summary

## 1. Room Management Module Enhancements

### New Fields Added:
- **Room Capacity**: Numeric input (max number of guests allowed per room)
- **Rate per Night**: Currency input for room-specific pricing

### Files Modified:
- `supabase/schema.sql` - Added columns to rooms table
- `backend/routes/hms.js` - Updated POST and PATCH endpoints
- `frontend/src/pages/dashboard/AllPages.jsx` - Updated Rooms component with new fields
- `supabase/migrations/add_room_capacity_and_rate.sql` - Migration script

### UI Changes:
- Room add form now includes Capacity and Rate/Night fields
- Room cards display capacity and rate information
- Room number dropdown shows rate and capacity info

## 2. Invoice Generator Module Upgrade

### New Features:
- **Dynamic Line Items**: Add/remove line items with description, quantity, rate
- **Auto-calculated Amount**: Amount = Quantity × Rate
- **View Invoice Modal**: See full invoice details with line items

### Files Modified:
- `supabase/schema.sql` - Added invoice_line_items table
- `backend/routes/hms.js` - Updated invoice endpoints with line items support
- `frontend/src/pages/dashboard/AllPages.jsx` - Rewrote Invoices component
- `supabase/migrations/add_invoice_line_items.sql` - Migration script

### API Endpoints:
- `GET /api/hms/invoices` - Returns invoices with line items
- `POST /api/hms/invoices` - Creates invoice with line items
- `POST /api/hms/invoices/:id/line-items` - Add line item to existing invoice
- `DELETE /api/hms/invoices/:invoiceId/line-items/:lineItemId` - Delete line item

## 3. New Booking Module (Front Desk Style)

### Features:
- **Guest Search**: Search existing guests or register new ones
- **Guest Information**: Name, Email, Phone, ID/Passport Number
- **Booking Details**: Check-in/out dates, Room Type → Room Number (dependent dropdown), Adults/Children
- **Payment & Source**: Payment method, Booking source (Direct/Referral/OTAs), Conditional referral name field
- **Auto-calculated Total**: Nights × Room Rate
- **Special Requests**: Multi-line text area

### Files Created:
- `frontend/src/pages/dashboard/NewBooking.jsx` - Complete booking form component
- `frontend/src/App.jsx` - Added NewBooking route

### Route:
- `/dashboard/new-booking` - Access the new booking form

## Database Migrations

Run these SQL files in Supabase SQL Editor:

1. `supabase/migrations/add_room_capacity_and_rate.sql`
2. `supabase/migrations/add_invoice_line_items.sql`

## Usage Instructions

### Room Management:
1. Go to Rooms page
2. Click "+ Add Room"
3. Fill in Room Number, Type, Floor, **Capacity**, and **Rate/Night**
4. Room cards now display capacity and rate

### Invoice Generation:
1. Go to Invoices page
2. Click "+ Generate Invoice"
3. Select Guest and optional Booking
4. Click "+ Add Item" to add line items (Description, Qty, Rate)
5. Amount auto-calculates
6. Add discount, select payment mode and status
7. Click "Save Invoice"
8. Click "View" on any invoice to see details

### New Booking:
1. Navigate to `/dashboard/new-booking`
2. Search for existing guest or click "+ New Guest"
3. Fill guest information (required fields marked with *)
4. Select Check-in/Check-out dates
5. Select Room Type first, then Room Number (filtered by type)
6. Adults/Children counts
7. Select Payment Method, Booking Source, Status
8. If Source = "Referral", enter referral name
9. Room Rate auto-fills from room selection (editable)
10. See Estimated Total calculation
11. Add Special Requests if any
12. Click "Create Booking"

## Technical Notes

- Room Type → Room Number dependency: Room dropdown is disabled until room type is selected
- Room Rate auto-fills when room is selected but can be manually overridden
- Invoice line items support decimal quantities (e.g., 1.5 hours)
- All forms include validation for required fields
- Guest search works across name, phone, and email
