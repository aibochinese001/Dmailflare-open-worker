-- Add index on api_keys.prefix for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
