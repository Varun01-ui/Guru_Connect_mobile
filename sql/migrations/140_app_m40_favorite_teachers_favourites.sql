-- @migration 140 M40 Favorite teachers (favourites)
-- @table user_favorites: Teachers and institutes a user saved to their favourites.
CREATE TABLE user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  target_type text NOT NULL CHECK (target_type IN ('teacher','institute')), -- Kind
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE, -- Saved teacher
  institute_id uuid REFERENCES institutes(id) ON DELETE CASCADE, -- Saved institute
  child_id uuid REFERENCES parent_children(id) ON DELETE SET NULL, -- Optional: saved for which child
  note text, -- Private note, max 200 chars
  created_at timestamptz NOT NULL DEFAULT now(), -- Saved
  deleted_at timestamptz, -- Removed (soft delete)
  CONSTRAINT ck_user_favorites_target CHECK ((target_type = 'teacher' AND teacher_id IS NOT NULL AND institute_id IS NULL) OR (target_type = 'institute' AND institute_id IS NOT NULL AND teacher_id IS NULL))
);
CREATE UNIQUE INDEX uq_user_favorites_teacher ON user_favorites (user_id, teacher_id) WHERE teacher_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_favorites_institute ON user_favorites (user_id, institute_id) WHERE institute_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_user_favorites_user ON user_favorites (user_id, target_type, created_at DESC) WHERE deleted_at IS NULL;
