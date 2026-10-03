-- @migration 123 M23 Institute dashboard (views and daily stats)
-- @table institute_profile_views: Raw institute profile views from the app (one per viewer per institute per day).
CREATE TABLE institute_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  institute_id uuid NOT NULL REFERENCES institutes(id) ON DELETE CASCADE, -- Viewed institute
  viewer_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL, -- Viewer (NULL for shared-link visitors)
  source text NOT NULL CHECK (source IN ('search','recommendation','dashboard','favorites','share_link','notification','other')), -- Entry point
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL, -- Viewer's city
  viewed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date, -- IST day, for de-duplication
  viewed_at timestamptz NOT NULL DEFAULT now() -- Time
);
CREATE UNIQUE INDEX uq_institute_profile_views_daily ON institute_profile_views (institute_id, viewer_user_id, viewed_on) WHERE viewer_user_id IS NOT NULL;
CREATE INDEX idx_institute_profile_views_inst ON institute_profile_views (institute_id, viewed_at DESC);

-- @table institute_daily_stats: Per-institute daily counters for the institute dashboard (written by the nightly job, today refreshed every 15 minutes).
CREATE TABLE institute_daily_stats (
  institute_id uuid NOT NULL REFERENCES institutes(id) ON DELETE CASCADE, -- Institute
  stat_date date NOT NULL, -- IST day
  profile_views integer NOT NULL DEFAULT 0, -- Unique viewers
  search_impressions integer NOT NULL DEFAULT 0, -- Times shown in search results
  leads integer NOT NULL DEFAULT 0, -- Enquiries received
  leads_responded integer NOT NULL DEFAULT 0, -- Enquiries answered within 24 h
  campus_visits integer NOT NULL DEFAULT 0, -- Demo / visit requests
  favorites_added integer NOT NULL DEFAULT 0, -- Added to favourites
  shares integer NOT NULL DEFAULT 0, -- Profile shares
  computed_at timestamptz NOT NULL DEFAULT now(), -- Last computed
  PRIMARY KEY (institute_id, stat_date)
);
