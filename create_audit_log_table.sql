-- Create general audit_log table for system actions like impersonation
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user_id ON audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Add comments for documentation
COMMENT ON TABLE audit_log IS 'General audit log for system actions like impersonation, role changes, etc.';
COMMENT ON COLUMN audit_log.action IS 'Type of action performed (e.g., impersonation_started, impersonation_ended, role_changed)';
COMMENT ON COLUMN audit_log.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_log.target_user_id IS 'ID of the user affected by the action (if applicable)';
COMMENT ON COLUMN audit_log.details IS 'JSON object containing additional details about the action';

-- Insert some sample audit entries for testing
INSERT INTO audit_log (action, user_id, target_user_id, details) VALUES
('impersonation_started', 
 (SELECT id FROM users WHERE email = 'rmaradolla@gmail.com' LIMIT 1),
 (SELECT id FROM users WHERE email != 'rmaradolla@gmail.com' LIMIT 1),
 '{"impersonator_email": "rmaradolla@gmail.com", "impersonator_role": "admin", "target_email": "test@example.com", "target_role": "customer", "timestamp": "2024-01-15T10:30:00Z"}'
); 