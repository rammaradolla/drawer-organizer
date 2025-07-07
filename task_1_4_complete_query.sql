-- Task 1.4: Update Users Table for New Roles
-- Complete query for adding department_head and department_member roles

DO $$
BEGIN
    -- First, check if the constraint exists and drop it safely
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        RAISE NOTICE 'Existing users_role_check constraint dropped.';
    END IF;

    -- Add new constraint with updated roles including department roles
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('customer', 'operations', 'admin', 'department_head', 'department_member'));
    RAISE NOTICE 'New users_role_check constraint added with department roles.';

    -- Add comments for documentation
    COMMENT ON COLUMN users.role IS 'User role: customer, operations, admin, department_head, or department_member';
    
    -- Add a comment explaining the new roles
    COMMENT ON TABLE users IS 'Users table with extended roles including department_head and department_member for workflow management';

    RAISE NOTICE 'Task 1.4 completed successfully - Users table updated with new department roles.';
    RAISE NOTICE 'New roles available: department_head, department_member';
    RAISE NOTICE 'Existing roles preserved: customer, operations, admin';
END $$;

-- Verify the constraint was applied correctly
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_role_check';

-- Show current valid roles
SELECT unnest(enum_range(NULL::text)) as valid_roles
FROM (
    SELECT 'customer'::text UNION ALL
    SELECT 'operations' UNION ALL
    SELECT 'admin' UNION ALL
    SELECT 'department_head' UNION ALL
    SELECT 'department_member'
) as roles; 