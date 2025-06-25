-- Add notes and drawer photo columns to designs table
ALTER TABLE designs 
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS drawer_photo_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN designs.customer_notes IS 'Optional notes from customer about the design or drawer';
COMMENT ON COLUMN designs.drawer_photo_url IS 'URL to uploaded photo of customer''s drawer'; 