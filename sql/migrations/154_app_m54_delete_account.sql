-- @migration 154 M54 Delete account
-- @table account_deletion_requests: Account deletion requests with a 30-day grace period before data is erased or anonymised.
CREATE TABLE account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT, -- Account
  reason_code text NOT NULL CHECK (reason_code IN ('found_teacher','not_useful','privacy','too_many_notifications','duplicate_account','other')), -- Why
  reason_text text, -- Optional details, max 500 chars
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','processing','completed','blocked')), -- Lifecycle
  blocked_reason text, -- e.g. open complaint against the user, pending payout
  scheduled_for timestamptz NOT NULL, -- created_at + 30 days
  cancelled_at timestamptz, -- User signed back in and cancelled
  completed_at timestamptz, -- Erasure finished
  erasure_report jsonb, -- Tables and row counts erased / anonymised / retained (legal hold)
  created_at timestamptz NOT NULL DEFAULT now(), -- Requested
  updated_at timestamptz NOT NULL DEFAULT now() -- Updated
);
CREATE UNIQUE INDEX uq_account_deletion_live ON account_deletion_requests (user_id) WHERE status IN ('scheduled','processing');
CREATE INDEX idx_account_deletion_due ON account_deletion_requests (scheduled_for) WHERE status = 'scheduled';
CREATE TRIGGER trg_account_deletion_requests_updated BEFORE UPDATE ON account_deletion_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
