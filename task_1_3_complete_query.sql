-- Task 1.3: Add Department Assignment Columns to Orders Table
-- Complete query for adding department assignment columns

DO $$
BEGIN
    -- Add current_department_head_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'current_department_head_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN current_department_head_id UUID REFERENCES department_heads(id);
        RAISE NOTICE 'Column current_department_head_id added to orders table.';
    END IF;

    -- Add current_department_member_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'current_department_member_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN current_department_member_id UUID REFERENCES department_members(id);
        RAISE NOTICE 'Column current_department_member_id added to orders table.';
    END IF;

    -- Add assigned_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Column assigned_at added to orders table.';
    END IF;

    -- Add indexes for performance if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_current_department_head_id'
    ) THEN
        CREATE INDEX idx_orders_current_department_head_id ON orders(current_department_head_id);
        RAISE NOTICE 'Index idx_orders_current_department_head_id created.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_current_department_member_id'
    ) THEN
        CREATE INDEX idx_orders_current_department_member_id ON orders(current_department_member_id);
        RAISE NOTICE 'Index idx_orders_current_department_member_id created.';
    END IF;

    -- Add comments for documentation
    COMMENT ON COLUMN orders.current_department_head_id IS 'ID of the department head currently responsible for this order';
    COMMENT ON COLUMN orders.current_department_member_id IS 'ID of the department member assigned to work on this order (nullable)';
    COMMENT ON COLUMN orders.assigned_at IS 'Timestamp when the order was last assigned to a department';

    RAISE NOTICE 'Task 1.3 completed successfully - Department assignment columns added to orders table.';
END $$; 