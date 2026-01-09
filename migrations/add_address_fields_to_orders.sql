-- Add billing and shipping address fields to orders table
-- This migration adds address fields to store order-specific addresses

DO $$
BEGIN
    -- Add billing address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'billing_street') THEN
        ALTER TABLE orders ADD COLUMN billing_street TEXT;
        RAISE NOTICE 'Column billing_street added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'billing_city') THEN
        ALTER TABLE orders ADD COLUMN billing_city TEXT;
        RAISE NOTICE 'Column billing_city added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'billing_state') THEN
        ALTER TABLE orders ADD COLUMN billing_state TEXT;
        RAISE NOTICE 'Column billing_state added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'billing_zip') THEN
        ALTER TABLE orders ADD COLUMN billing_zip TEXT;
        RAISE NOTICE 'Column billing_zip added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'billing_country') THEN
        ALTER TABLE orders ADD COLUMN billing_country TEXT;
        RAISE NOTICE 'Column billing_country added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'billing_phone') THEN
        ALTER TABLE orders ADD COLUMN billing_phone TEXT;
        RAISE NOTICE 'Column billing_phone added to orders table.';
    END IF;

    -- Add shipping address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_street') THEN
        ALTER TABLE orders ADD COLUMN shipping_street TEXT;
        RAISE NOTICE 'Column shipping_street added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_city') THEN
        ALTER TABLE orders ADD COLUMN shipping_city TEXT;
        RAISE NOTICE 'Column shipping_city added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_state') THEN
        ALTER TABLE orders ADD COLUMN shipping_state TEXT;
        RAISE NOTICE 'Column shipping_state added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_zip') THEN
        ALTER TABLE orders ADD COLUMN shipping_zip TEXT;
        RAISE NOTICE 'Column shipping_zip added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_country') THEN
        ALTER TABLE orders ADD COLUMN shipping_country TEXT;
        RAISE NOTICE 'Column shipping_country added to orders table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipping_phone') THEN
        ALTER TABLE orders ADD COLUMN shipping_phone TEXT;
        RAISE NOTICE 'Column shipping_phone added to orders table.';
    END IF;
END $$;
