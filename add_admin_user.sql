-- This script ensures the 'users' table has timestamp columns and then adds an admin.

-- Step 1: Add 'created_at' and 'updated_at' columns if they don't exist.
DO $$
BEGIN
    -- Add 'created_at'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Column created_at added to users table.';
    END IF;

    -- Add 'updated_at'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Column updated_at added to users table.';
    END IF;
END $$;

-- Step 2: Add rmaradolla@gmail.com as admin user
-- Role Definitions:
-- - 'customer': Can design organizers, place orders, view their own orders
-- - 'operations': Can only access fulfillment dashboard to manage orders
-- - 'admin': Can access all features including admin panel, fulfillment, and customer features

DO $$
BEGIN
    -- Check if user exists
    IF EXISTS (SELECT 1 FROM users WHERE email = 'rmaradolla@gmail.com') THEN
        -- Update existing user to admin role
        UPDATE users
        SET
            role = 'admin',
            updated_at = NOW()
        WHERE email = 'rmaradolla@gmail.com';

        RAISE NOTICE 'User rmaradolla@gmail.com updated to admin role';
    ELSE
        -- Insert new user with admin role.
        -- We set created_at and updated_at explicitly.
        INSERT INTO users (email, role, created_at, updated_at)
        VALUES ('rmaradolla@gmail.com', 'admin', NOW(), NOW());

        RAISE NOTICE 'New admin user rmaradolla@gmail.com created';
    END IF;
END $$;

-- Step 3: Verify the change
SELECT id, email, role, created_at, updated_at
FROM users
WHERE email = 'rmaradolla@gmail.com'; 