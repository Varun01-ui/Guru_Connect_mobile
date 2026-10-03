-- @migration 133 M33 Profile sharing
-- @table profile_shares: Each time a user shares a teacher or institute profile, with a short code for attribution.
CREATE TABLE profile_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  short_code text NOT NULL, -- 8-char code in the link, e.g. https://gcnt.in/s/k7Qm2xPa
  sharer_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL, -- Who shared (NULL if signed out)
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE, -- Shared teacher
  institute_id uuid REFERENCES institutes(id) ON DELETE CASCADE, -- Shared institute
  channel text NOT NULL CHECK (channel IN ('whatsapp','copy_link','sms','other')), -- Chosen share target
  opens integer NOT NULL DEFAULT 0, -- Link opens
  installs integer NOT NULL DEFAULT 0, -- Installs attributed
  created_at timestamptz NOT NULL DEFAULT now(), -- Shared
  CONSTRAINT ck_profile_shares_target CHECK ((teacher_id IS NULL) <> (institute_id IS NULL))
);
CREATE UNIQUE INDEX uq_profile_shares_code ON profile_shares (short_code);
CREATE INDEX idx_profile_shares_teacher ON profile_shares (teacher_id, created_at DESC);
CREATE INDEX idx_profile_shares_institute ON profile_shares (institute_id, created_at DESC);
