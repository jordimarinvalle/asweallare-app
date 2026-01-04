-- ============================================================================
-- Admin Access Attempts Table
-- Logs unauthorized admin login attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_access_attempts (
  email TEXT PRIMARY KEY,
  first_attempt_at TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  attempts_count INTEGER DEFAULT 1
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_access_attempts_email ON admin_access_attempts(email);
CREATE INDEX IF NOT EXISTS idx_admin_access_attempts_last ON admin_access_attempts(last_attempt_at);

-- ============================================================================
-- Done!
-- ============================================================================
