-- @migration 149 M49 Report user (blocks)
-- @table user_blocks: Users one user has blocked. Blocked users can't contact, message or review the blocker.
CREATE TABLE user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  blocker_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Who blocked
  blocked_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Who is blocked
  complaint_id uuid REFERENCES complaints(id) ON DELETE SET NULL, -- Report filed at the same time, if any
  created_at timestamptz NOT NULL DEFAULT now(), -- Blocked
  deleted_at timestamptz, -- Unblocked (soft delete)
  CONSTRAINT ck_user_blocks_self CHECK (blocker_user_id <> blocked_user_id)
);
CREATE UNIQUE INDEX uq_user_blocks_pair ON user_blocks (blocker_user_id, blocked_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_blocks_blocked ON user_blocks (blocked_user_id) WHERE deleted_at IS NULL;
