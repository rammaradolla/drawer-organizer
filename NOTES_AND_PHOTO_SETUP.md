# Notes and Photo Upload Feature Setup

This document outlines the setup required for the new customer notes and drawer photo upload functionality.

## Database Changes

Run the following SQL in your Supabase database to add the required columns:

```sql
-- Add notes and drawer photo columns to designs table
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS drawer_photo_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN designs.customer_notes IS 'Optional notes from customer about the design or drawer';
COMMENT ON COLUMN designs.drawer_photo_url IS 'URL to uploaded photo of customer''s drawer';
```

## Storage Bucket Setup

Ensure your Supabase storage bucket `designs` has the following policies for drawer photo uploads:

```sql
-- Allow authenticated users to upload drawer photos
CREATE POLICY "Allow authenticated users to upload drawer photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'designs' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'drawer-photos'
);

-- Allow authenticated users to view drawer photos
CREATE POLICY "Allow authenticated users to view drawer photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'designs' AND 
  auth.role() = 'authenticated'
);
```

## Features Added

### Customer Side (Cart View)
- **Optional Notes**: Customers can add notes about their drawer or design preferences
- **Drawer Photo Upload**: Customers can upload a photo of their actual drawer
- **Edit Functionality**: Customers can edit notes and photos after adding items to cart
- **Visual Indicators**: Notes and photos are displayed in the cart with clear labels

### Operations Side (Fulfillment View)
- **Notes Display**: Customer notes are prominently displayed in order details
- **Photo Display**: Customer's drawer photos are shown with clickable thumbnails
- **Print Support**: Notes and photos are included in printable order details

## File Changes

### New Files Created:
- `client/src/components/CartItemForm.jsx` - Modal for adding/editing notes and photos
- `client/src/utils/uploadDrawerPhoto.js` - Utility for photo upload and validation

### Files Modified:
- `client/src/components/Cart.jsx` - Added notes/photo display and edit functionality
- `client/src/components/OrderDetailsModal.jsx` - Added notes/photo display in operations view
- `client/src/redux/cartSlice.js` - Added updateCartItem action
- `client/src/utils/createCartItem.js` - Added notes, photo, and designId fields
- `client/src/utils/supabaseDesigns.ts` - Added updateDesignNotesAndPhoto function
- `client/src/components/AddToCartButton.jsx` - Updated to include designId in cart items

## Usage

### For Customers:
1. Add items to cart as usual
2. Click "Add Notes & Photo" button on any cart item
3. Optionally add notes about your drawer or preferences
4. Optionally upload a photo of your drawer
5. Save changes - they will be visible in your cart and sent to operations

### For Operations:
1. View orders in the fulfillment dashboard
2. Click "View" on any order to see details
3. Customer notes and photos will be displayed in the order details modal
4. Notes and photos are also included when printing order details

## Technical Notes

- **File Size Limit**: Photos are limited to 5MB
- **Supported Formats**: JPEG, PNG, WebP
- **Storage Location**: Photos are stored in `designs/drawer-photos/{userId}/` folder
- **Data Persistence**: Notes and photos are stored in Supabase and persist across sessions
- **Optional Fields**: Both notes and photos are completely optional for customers 