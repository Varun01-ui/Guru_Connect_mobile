-- @migration 104 M04 Login (OTP, sessions, sign-in identities)
-- @table otp_challenges: One-time codes sent by SMS or email for login, sign-up, contact changes and account deletion.
CREATE TABLE otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key; returned to the app as challengeId
  channel text NOT NULL CHECK (channel IN ('sms','email','whatsapp')), -- Delivery channel
  destination text NOT NULL, -- E.164 phone or lower-case email
  purpose text NOT NULL CHECK (purpose IN ('login','signup','change_phone','change_email','reset_password','delete_account','parent_consent')), -- Why the code was sent
  code_hash text NOT NULL, -- HMAC-SHA256 of the 6-digit code (never stored in plain text)
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE, -- Known user, if any
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5), -- Wrong-code attempts
  resend_count smallint NOT NULL DEFAULT 0, -- Resends of this challenge
  provider_message_id text, -- SMS/email provider id for delivery tracking
  ip_address inet, -- Requesting IP
  install_id uuid, -- Requesting install
  expires_at timestamptz NOT NULL, -- created_at + 5 minutes
  verified_at timestamptz, -- Successful verification
  consumed_at timestamptz, -- Used to issue a session or token (single use)
  created_at timestamptz NOT NULL DEFAULT now() -- Sent
);
CREATE INDEX idx_otp_challenges_dest ON otp_challenges (destination, created_at DESC);
CREATE INDEX idx_otp_challenges_expiry ON otp_challenges (expires_at) WHERE consumed_at IS NULL;

-- @table app_sessions: Refresh-token sessions for app users, one per signed-in install. Refresh tokens rotate on every use.
CREATE TABLE app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Session id (sid claim in the JWT)
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  device_id uuid REFERENCES user_devices(id) ON DELETE SET NULL, -- Install the session belongs to
  refresh_token_hash text NOT NULL, -- SHA-256 of the current refresh token
  token_family uuid NOT NULL, -- Rotation family; reuse of an old token revokes the family
  auth_method text NOT NULL CHECK (auth_method IN ('otp','password','google','email_otp')), -- How the session started
  ip_address inet, -- IP at creation
  user_agent text, -- App user agent, e.g. GuruConnect/1.2.0 (Android 14)
  last_used_at timestamptz NOT NULL DEFAULT now(), -- Last refresh
  expires_at timestamptz NOT NULL, -- Absolute expiry (created_at + 60 days, sliding 30 days)
  revoked_at timestamptz, -- Logout, reuse detection, password change, account deletion
  revoked_reason text CHECK (revoked_reason IN ('logout','logout_all','reuse_detected','password_changed','account_suspended','account_deleted','expired','admin')), -- Why revoked
  created_at timestamptz NOT NULL DEFAULT now() -- Signed in
);
CREATE UNIQUE INDEX uq_app_sessions_token ON app_sessions (refresh_token_hash);
CREATE INDEX idx_app_sessions_user_active ON app_sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_app_sessions_family ON app_sessions (token_family);

-- @table user_auth_identities: Sign-in methods linked to an account: phone OTP, email + password, Google.
CREATE TABLE user_auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  provider text NOT NULL CHECK (provider IN ('phone','password','google')), -- Method
  provider_subject text NOT NULL, -- E.164 phone, lower-case email, or Google `sub`
  email citext, -- Email reported by Google / used for password login
  password_hash text, -- Argon2id hash (provider = password only)
  password_updated_at timestamptz, -- Last password change
  failed_attempts smallint NOT NULL DEFAULT 0, -- Consecutive wrong passwords
  locked_until timestamptz, -- Lockout after 5 wrong passwords (15 minutes)
  last_used_at timestamptz, -- Last successful sign-in with this method
  created_at timestamptz NOT NULL DEFAULT now(), -- Linked
  updated_at timestamptz NOT NULL DEFAULT now(), -- Updated
  deleted_at timestamptz, -- Unlinked (soft delete)
  CONSTRAINT ck_user_auth_identities_password CHECK ((provider = 'password') = (password_hash IS NOT NULL))
);
CREATE UNIQUE INDEX uq_user_auth_identities_subject ON user_auth_identities (provider, provider_subject) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_auth_identities_user ON user_auth_identities (user_id) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_user_auth_identities_updated BEFORE UPDATE ON user_auth_identities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE UNIQUE INDEX uq_app_users_phone_live ON app_users (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
