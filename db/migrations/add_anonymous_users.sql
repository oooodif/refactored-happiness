-- Add anonymous_users table
CREATE TABLE IF NOT EXISTS anonymous_users (
  id SERIAL PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  session_id TEXT,
  ip_address TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups by fingerprint
CREATE INDEX IF NOT EXISTS idx_anonymous_users_fingerprint ON anonymous_users(fingerprint);