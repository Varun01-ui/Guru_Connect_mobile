-- @migration 100 M00 Mobile app foundation (devices, notification inbox, notification preferences)
ALTER TABLE files ALTER COLUMN storage_provider SET DEFAULT 'r2';
ALTER TABLE app_users ADD COLUMN preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','hi','kn','ta','te','mr','bn')); -- App language chosen by the user
ALTER TABLE app_users ADD COLUMN profile_photo_file_id uuid REFERENCES files(id) ON DELETE SET NULL; -- Avatar for parents, students and institute staff (teachers use teachers.profile_photo_file_id)
ALTER TABLE app_users ADD COLUMN signup_source text CHECK (signup_source IN ('organic','referral','campaign','admin_created','deep_link')); -- How the account was acquired

-- @table user_devices: Every app install a user has signed in on, with its FCM token. One row per (user, install).
CREATE TABLE user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  install_id uuid NOT NULL, -- Random id generated on first launch and kept in secure storage
  platform text NOT NULL CHECK (platform IN ('android','ios')), -- OS
  os_version text, -- e.g. 14
  app_version text NOT NULL, -- Semver of the build, e.g. 1.2.0
  build_number integer, -- Store build number
  device_model text, -- e.g. SM-A546E
  fcm_token text, -- Firebase Cloud Messaging token; NULL when push permission denied
  push_permission text NOT NULL DEFAULT 'not_determined' CHECK (push_permission IN ('granted','denied','not_determined','provisional')), -- OS permission state
  locale text, -- e.g. en-IN
  timezone text NOT NULL DEFAULT 'Asia/Kolkata', -- IANA timezone
  last_seen_at timestamptz NOT NULL DEFAULT now(), -- Last API call from this install
  token_updated_at timestamptz, -- When fcm_token last changed
  revoked_at timestamptz, -- Set on logout / token UNREGISTERED
  created_at timestamptz NOT NULL DEFAULT now(), -- First sign-in on this install
  updated_at timestamptz NOT NULL DEFAULT now() -- Updated
);
CREATE UNIQUE INDEX uq_user_devices_install ON user_devices (user_id, install_id);
CREATE UNIQUE INDEX uq_user_devices_token ON user_devices (fcm_token) WHERE fcm_token IS NOT NULL AND revoked_at IS NULL;
CREATE INDEX idx_user_devices_user_active ON user_devices (user_id) WHERE revoked_at IS NULL;
CREATE TRIGGER trg_user_devices_updated BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- @table user_notifications: The in-app notification inbox for every user: transactional events and copies of admin campaigns.
CREATE TABLE user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Recipient
  category text NOT NULL CHECK (category IN ('account','verification','leads','demos','reviews','payments','subscription','referral','complaints','recommendations','announcements')), -- Preference bucket
  event_type text NOT NULL, -- Machine event, e.g. teacher.approved, lead.received, review.published
  title text NOT NULL, -- Max 65 chars
  body text NOT NULL, -- Max 240 chars
  image_url text, -- Optional rich image (CDN URL)
  deep_link text, -- App route opened on tap, e.g. gc://leads/<id>
  data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Extra payload, e.g. {"leadId":"…"}
  campaign_id uuid REFERENCES notifications(id) ON DELETE SET NULL, -- Set when the item comes from an admin campaign
  dedupe_key text, -- Prevents duplicates when an event is retried, e.g. lead.received:<leadId>
  push_status text NOT NULL DEFAULT 'pending' CHECK (push_status IN ('pending','sent','failed','skipped_pref','skipped_quiet_hours','no_device')), -- Push outcome
  read_at timestamptz, -- Opened in the inbox or via push tap
  expires_at timestamptz, -- Hidden after this (e.g. time-limited offers)
  created_at timestamptz NOT NULL DEFAULT now(), -- Created
  deleted_at timestamptz -- Soft delete (user swiped away)
);
CREATE UNIQUE INDEX uq_user_notifications_dedupe ON user_notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_user_notifications_inbox ON user_notifications (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_notifications_unread ON user_notifications (user_id) WHERE read_at IS NULL AND deleted_at IS NULL;

-- @table user_notification_preferences: Per-category push/email switches. Missing row = defaults (push on, email off).
CREATE TABLE user_notification_preferences (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  category text NOT NULL CHECK (category IN ('account','verification','leads','demos','reviews','payments','subscription','referral','complaints','recommendations','announcements')), -- Bucket
  push_enabled boolean NOT NULL DEFAULT true, -- Send push for this category
  email_enabled boolean NOT NULL DEFAULT false, -- Send email for this category
  quiet_hours_start time, -- Local start of do-not-disturb, e.g. 22:00
  quiet_hours_end time, -- Local end, e.g. 07:00
  updated_at timestamptz NOT NULL DEFAULT now(), -- Updated
  PRIMARY KEY (user_id, category)
);
CREATE TRIGGER trg_user_notification_preferences_updated BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
