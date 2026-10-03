-- @migration 127 M27 Teacher search (search history)
-- @table user_search_history: Searches made by a user, used for "Recent searches" and as a recommendation signal. Kept 180 days.
CREATE TABLE user_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Searcher
  target text NOT NULL CHECK (target IN ('teacher','institute')), -- What was searched
  query_text text, -- Free text, max 100 chars
  filters jsonb NOT NULL DEFAULT '{}'::jsonb, -- Normalised filters, e.g. {"subjectIds":[…],"classId":"…","cityId":"…"}
  child_id uuid REFERENCES parent_children(id) ON DELETE SET NULL, -- Child the parent searched for, if chosen
  result_count integer NOT NULL DEFAULT 0, -- Results returned
  clicked_teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL, -- First result opened
  clicked_institute_id uuid REFERENCES institutes(id) ON DELETE SET NULL, -- First result opened
  created_at timestamptz NOT NULL DEFAULT now(), -- Searched
  deleted_at timestamptz -- Cleared by the user (soft delete)
);
CREATE INDEX idx_user_search_history_user ON user_search_history (user_id, created_at DESC) WHERE deleted_at IS NULL;
