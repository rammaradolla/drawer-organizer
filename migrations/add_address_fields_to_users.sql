-- Add billing and shipping address fields to users table
-- This migration adds address fields and profile completion status

DO $$
BEGIN
    -- Add billing address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_street') THEN
        ALTER TABLE users ADD COLUMN billing_street TEXT;
        RAISE NOTICE 'Column billing_street added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_city') THEN
        ALTER TABLE users ADD COLUMN billing_city TEXT;
        RAISE NOTICE 'Column billing_city added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_state') THEN
        ALTER TABLE users ADD COLUMN billing_state TEXT;
        RAISE NOTICE 'Column billing_state added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_zip') THEN
        ALTER TABLE users ADD COLUMN billing_zip TEXT;
        RAISE NOTICE 'Column billing_zip added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_country') THEN
        ALTER TABLE users ADD COLUMN billing_country TEXT DEFAULT 'US';
        RAISE NOTICE 'Column billing_country added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_phone') THEN
        ALTER TABLE users ADD COLUMN billing_phone TEXT;
        RAISE NOTICE 'Column billing_phone added to users table.';
    END IF;

    -- Add shipping address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shipping_street') THEN
        ALTER TABLE users ADD COLUMN shipping_street TEXT;
        RAISE NOTICE 'Column shipping_street added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shipping_city') THEN
        ALTER TABLE users ADD COLUMN shipping_city TEXT;
        RAISE NOTICE 'Column shipping_city added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shipping_state') THEN
        ALTER TABLE users ADD COLUMN shipping_state TEXT;
        RAISE NOTICE 'Column shipping_state added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shipping_zip') THEN
        ALTER TABLE users ADD COLUMN shipping_zip TEXT;
        RAISE NOTICE 'Column shipping_zip added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shipping_country') THEN
        ALTER TABLE users ADD COLUMN shipping_country TEXT DEFAULT 'US';
        RAISE NOTICE 'Column shipping_country added to users table.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'shipping_phone') THEN
        ALTER TABLE users ADD COLUMN shipping_phone TEXT;
        RAISE NOTICE 'Column shipping_phone added to users table.';
    END IF;

    -- Add profile completion status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_complete') THEN
        ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column profile_complete added to users table.';
    END IF;
END $$;
