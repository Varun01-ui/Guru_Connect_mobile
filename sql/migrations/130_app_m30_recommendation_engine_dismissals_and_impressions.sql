-- @migration 130 M30 Recommendation engine (dismissals and impressions)
-- @table recommendation_dismissals: Teachers or institutes a user marked "Not interested" so they stop being recommended.
CREATE TABLE recommendation_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- User
  child_id uuid REFERENCES parent_children(id) ON DELETE CASCADE, -- Scope to one child (NULL = all)
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE, -- Dismissed teacher
  institute_id uuid REFERENCES institutes(id) ON DELETE CASCADE, -- Dismissed institute
  reason text CHECK (reason IN ('too_far','too_expensive','wrong_subject','not_relevant','other')), -- Optional reason
  created_at timestamptz NOT NULL DEFAULT now(), -- When
  CONSTRAINT ck_recommendation_dismissals_target CHECK ((teacher_id IS NULL) <> (institute_id IS NULL))
);
CREATE INDEX idx_recommendation_dismissals_user ON recommendation_dismissals (user_id);

-- @table recommendation_impressions: Recommendations shown to a user (sampled 100% at launch) to measure click-through and avoid showing the same card too often.
CREATE TABLE recommendation_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Viewer
  child_id uuid REFERENCES parent_children(id) ON DELETE SET NULL, -- Child the list was for
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE, -- Recommended teacher
  institute_id uuid REFERENCES institutes(id) ON DELETE CASCADE, -- Recommended institute
  rail text NOT NULL CHECK (rail IN ('recommended_teachers','recommended_institutes','nearby','top_rated','verified','for_you')), -- Dashboard section
  position smallint NOT NULL, -- 1-based position in the rail
  score numeric(6,3) NOT NULL, -- Engine score at the time
  algo_version text NOT NULL, -- e.g. rules-v1
  clicked_at timestamptz, -- Card opened
  shown_at timestamptz NOT NULL DEFAULT now() -- Shown
);
CREATE INDEX idx_recommendation_impressions_user ON recommendation_impressions (user_id, shown_at DESC);
