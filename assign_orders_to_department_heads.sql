-- Assign all existing orders to department heads based on their current stage
-- This script uses the new department_head_stages join table to find the correct department head for each stage

-- First, let's see what we're working with
SELECT 
    'Current order assignments' as info,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN assignee_id IS NOT NULL THEN 1 END) as assigned_orders,
    COUNT(CASE WHEN assignee_id IS NULL THEN 1 END) as unassigned_orders
FROM orders;

-- Show current stage distribution
SELECT 
    granular_status,
    COUNT(*) as order_count,
    COUNT(CASE WHEN assignee_id IS NOT NULL THEN 1 END) as assigned_count,
    COUNT(CASE WHEN assignee_id IS NULL THEN 1 END) as unassigned_count
FROM orders 
WHERE granular_status IS NOT NULL
GROUP BY granular_status
ORDER BY order_count DESC;

-- Show department head assignments for each stage
SELECT 
    dhs.stage,
    dh.name as department_head_name,
    dh.email as department_head_email,
    COUNT(o.id) as orders_in_stage
FROM department_head_stages dhs
JOIN department_heads dh ON dhs.department_head_id = dh.id
LEFT JOIN orders o ON o.granular_status = dhs.stage
GROUP BY dhs.stage, dh.name, dh.email
ORDER BY dhs.stage;

-- Update all orders to assign them to the department head for their current stage
UPDATE orders 
SET 
    assignee_id = (
        SELECT dhs.department_head_id 
        FROM department_head_stages dhs 
        WHERE dhs.stage = orders.granular_status
        LIMIT 1
    ),
    last_updated_at = NOW(),
    last_updated_by = (
        SELECT id FROM users WHERE role = 'admin' LIMIT 1
    )
WHERE 
    granular_status IS NOT NULL 
    AND assignee_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM department_head_stages dhs 
        WHERE dhs.stage = orders.granular_status
    );

-- Verify the results
SELECT 
    'After assignment' as info,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN assignee_id IS NOT NULL THEN 1 END) as assigned_orders,
    COUNT(CASE WHEN assignee_id IS NULL THEN 1 END) as unassigned_orders
FROM orders;

-- Show updated stage distribution
SELECT 
    granular_status,
    COUNT(*) as order_count,
    COUNT(CASE WHEN assignee_id IS NOT NULL THEN 1 END) as assigned_count,
    COUNT(CASE WHEN assignee_id IS NULL THEN 1 END) as unassigned_count
FROM orders 
WHERE granular_status IS NOT NULL
GROUP BY granular_status
ORDER BY order_count DESC;

-- Show orders that still don't have a department head assigned (stages without department heads)
SELECT 
    granular_status,
    COUNT(*) as unassigned_orders
FROM orders 
WHERE 
    granular_status IS NOT NULL 
    AND assignee_id IS NULL
GROUP BY granular_status
ORDER BY unassigned_orders DESC;

-- Show final assignment summary
SELECT 
    o.granular_status,
    dh.name as department_head_name,
    dh.email as department_head_email,
    COUNT(o.id) as assigned_orders
FROM orders o
JOIN department_heads dh ON o.assignee_id = dh.id
WHERE o.granular_status IS NOT NULL
GROUP BY o.granular_status, dh.name, dh.email
ORDER BY o.granular_status; 