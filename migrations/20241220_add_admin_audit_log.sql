-- Create admin audit log table for security monitoring
-- This table tracks all admin actions for security auditing

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  admin_id VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_ip ON admin_audit_log(ip_address);

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Audit log for admin actions and security monitoring';
COMMENT ON COLUMN admin_audit_log.action IS 'The admin action performed (e.g., admin_access, admin_action_success)';
COMMENT ON COLUMN admin_audit_log.admin_id IS 'Admin identifier (usually IP address)';
COMMENT ON COLUMN admin_audit_log.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN admin_audit_log.ip_address IS 'IP address of the admin user';
COMMENT ON COLUMN admin_audit_log.timestamp IS 'When the action occurred';
