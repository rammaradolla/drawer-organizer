-- Department Roles Implementation - Database Migration Script
-- This script implements all Phase 1 database schema updates

-- Task 1.1: Create Department Members Table
CREATE TABLE IF NOT EXISTS department_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department_head_id UUID REFERENCES department_heads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_department_members_department_head_id ON department_members(department_head_id);
CREATE INDEX IF NOT EXISTS idx_department_members_email ON department_members(email);

-- Task 1.2: Add Task Status Column to Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS task_status TEXT DEFAULT 'in-progress' CHECK (task_status IN ('in-progress', 'complete', 'blocked'));

-- Task 1.3: Add Department Assignment Columns to Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_department_head_id UUID REFERENCES department_heads(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_department_member_id UUID REFERENCES department_members(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_current_department_head_id ON orders(current_department_head_id);
CREATE INDEX IF NOT EXISTS idx_orders_current_department_member_id ON orders(current_department_member_id);
CREATE INDEX IF NOT EXISTS idx_orders_task_status ON orders(task_status);

-- Task 1.4: Update Users Table for New Roles
-- First, drop the existing constraint if it exists
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

-- Add new constraint with updated roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('customer', 'operations', 'admin', 'department_head', 'department_member'));

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_department_members_updated_at 
    BEFORE UPDATE ON department_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE department_members IS 'Stores department member information and their department head assignments';
COMMENT ON COLUMN orders.task_status IS 'Current task status: in-progress, complete, or blocked';
COMMENT ON COLUMN orders.current_department_head_id IS 'ID of the department head currently responsible for this order';
COMMENT ON COLUMN orders.current_department_member_id IS 'ID of the department member assigned to work on this order (nullable)';
COMMENT ON COLUMN orders.assigned_at IS 'Timestamp when the order was last assigned to a department';

-- Task X: Refactor to single assignee_id column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id);

-- Data migration: set assignee_id to current_department_member_id if present, else current_department_head_id
UPDATE orders SET assignee_id = COALESCE(current_department_member_id, current_department_head_id);

-- (Optional) Remove old columns after migration
-- ALTER TABLE orders DROP COLUMN IF EXISTS current_department_head_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS current_department_member_id;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_assignee_id ON orders(assignee_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.assignee_id IS 'ID of the user (head or member) currently assigned to this order';

-- Verify the changes
SELECT 'Migration completed successfully' as status;

-- Add surrogate primary key to department_heads
ALTER TABLE department_heads ADD COLUMN IF NOT EXISTS row_id UUID DEFAULT gen_random_uuid();

-- Set row_id for existing rows if null
UPDATE department_heads SET row_id = gen_random_uuid() WHERE row_id IS NULL;

-- Drop the current primary key on stage (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'department_heads' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'department_heads_pkey'
  ) THEN
    ALTER TABLE department_heads DROP CONSTRAINT department_heads_pkey;
  END IF;
END $$;

-- Add primary key on row_id
ALTER TABLE department_heads ADD PRIMARY KEY (row_id);

-- Add unique constraint on stage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'department_heads' AND constraint_type = 'UNIQUE' AND constraint_name = 'department_heads_stage_key'
  ) THEN
    ALTER TABLE department_heads ADD CONSTRAINT department_heads_stage_key UNIQUE (stage);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN department_heads.row_id IS 'Surrogate primary key for department_heads'; 