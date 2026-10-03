-- @migration 129 M29 Advanced filters (saved searches)
-- @table saved_searches: Named filter sets a user saved, with optional alerts when new matching teachers are approved.
CREATE TABLE saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  name text NOT NULL, -- e.g. Physics · Class 12 · Koramangala
  target text NOT NULL CHECK (target IN ('teacher','institute')), -- Search type
  filters jsonb NOT NULL, -- Same shape as the search API filters
  alert_enabled boolean NOT NULL DEFAULT false, -- Notify when new matches appear
  last_alerted_at timestamptz, -- Last alert sent (max one per day)
  created_at timestamptz NOT NULL DEFAULT now(), -- Created
  updated_at timestamptz NOT NULL DEFAULT now(), -- Updated
  deleted_at timestamptz -- Soft delete
);
CREATE INDEX idx_saved_searches_user ON saved_searches (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_saved_searches_alerts ON saved_searches (target) WHERE alert_enabled AND deleted_at IS NULL;
CREATE TRIGGER trg_saved_searches_updated BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
