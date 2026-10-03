-- @migration 152 M52 Privacy settings (privacy and consents)
-- @table user_privacy_settings: What a user shows to others and allows the platform to do with their data.
CREATE TABLE user_privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE, -- Owner
  show_last_name boolean NOT NULL DEFAULT false, -- Reviews show "Lakshmi V." when false
  show_area_to_teachers boolean NOT NULL DEFAULT true, -- Teachers see the area on leads
  show_profile_in_search boolean NOT NULL DEFAULT true, -- Teachers/institutes: listed in search (false = paused listing)
  allow_whatsapp_contact boolean NOT NULL DEFAULT true, -- Show a WhatsApp button once contact is unlocked
  allow_personalised_recommendations boolean NOT NULL DEFAULT true, -- Use search history and children for recommendations
  allow_marketing_notifications boolean NOT NULL DEFAULT true, -- Announcements and offers
  allow_analytics boolean NOT NULL DEFAULT true, -- Product analytics events
  updated_at timestamptz NOT NULL DEFAULT now() -- Updated
);
CREATE TRIGGER trg_user_privacy_settings_updated BEFORE UPDATE ON user_privacy_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- @table user_consents: Record of every consent given or withdrawn (terms, privacy policy, parental consent, marketing), as required by the DPDP Act 2023.
CREATE TABLE user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- Data principal
  consent_type text NOT NULL CHECK (consent_type IN ('terms','privacy_policy','marketing','personalisation','parental_consent','data_processing_minor')), -- What
  document_version text NOT NULL, -- e.g. privacy-2026-09
  granted boolean NOT NULL, -- true = given, false = withdrawn
  method text NOT NULL CHECK (method IN ('checkbox','otp','toggle','email_link')), -- How it was captured
  guardian_phone text, -- For parental consent: verified guardian phone
  ip_address inet, -- IP
  install_id uuid, -- Install
  created_at timestamptz NOT NULL DEFAULT now() -- When
);
CREATE INDEX idx_user_consents_user ON user_consents (user_id, consent_type, created_at DESC);
