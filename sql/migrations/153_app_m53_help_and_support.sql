-- @migration 153 M53 Help and support
-- @table faqs: Help-centre questions and answers shown in the app, by audience.
CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','parent','student','teacher','institute')), -- Who sees it
  category text NOT NULL CHECK (category IN ('getting_started','account','payments','verification','leads_demos','reviews','safety','privacy')), -- Section
  question text NOT NULL, -- Max 160 chars
  answer_md text NOT NULL, -- Markdown answer, max 3,000 chars
  sort_order smallint NOT NULL DEFAULT 0, -- Order within category
  is_published boolean NOT NULL DEFAULT true, -- Hidden when false
  helpful_yes integer NOT NULL DEFAULT 0, -- "Was this helpful?" yes votes
  helpful_no integer NOT NULL DEFAULT 0, -- No votes
  created_by uuid REFERENCES admins(id), -- Author
  created_at timestamptz NOT NULL DEFAULT now(), -- Created
  updated_at timestamptz NOT NULL DEFAULT now(), -- Updated
  deleted_at timestamptz -- Soft delete
);
CREATE INDEX idx_faqs_audience ON faqs (audience, category, sort_order) WHERE is_published AND deleted_at IS NULL;
CREATE INDEX idx_faqs_search ON faqs USING gin (to_tsvector('english', question || ' ' || answer_md));
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE SEQUENCE seq_ticket_number START 10001; -- generates support_tickets.ticket_number
-- @table support_tickets: Support requests raised from the app (not safety reports — those are complaints).
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  ticket_number text NOT NULL DEFAULT ('ST-' || nextval('seq_ticket_number')), -- e.g. ST-10001
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT, -- Requester
  category text NOT NULL CHECK (category IN ('account','payment','verification','technical','lead_demo','feedback','other')), -- Topic
  subject text NOT NULL, -- 5–120 chars
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL, -- Related payment, if any
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','awaiting_user','in_progress','resolved','closed')), -- Lifecycle
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')), -- Set by rules (payment issues = high)
  assigned_admin_id uuid REFERENCES admins(id), -- Support owner
  app_version text, -- Diagnostics captured on create
  device_info jsonb, -- {"platform":"android","os":"14","model":"…"}
  first_response_at timestamptz, -- First admin reply
  resolved_at timestamptz, -- Resolved
  rating smallint CHECK (rating BETWEEN 1 AND 5), -- User satisfaction after resolution
  created_at timestamptz NOT NULL DEFAULT now(), -- Created
  updated_at timestamptz NOT NULL DEFAULT now(), -- Updated
  deleted_at timestamptz -- Soft delete
);
CREATE UNIQUE INDEX uq_support_tickets_number ON support_tickets (ticket_number);
CREATE INDEX idx_support_tickets_user ON support_tickets (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_support_tickets_queue ON support_tickets (status, priority, created_at) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_support_tickets_updated BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- @table support_ticket_messages: Conversation on a support ticket between the user and support staff.
CREATE TABLE support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE, -- Ticket
  author_type text NOT NULL CHECK (author_type IN ('app_user','admin','system')), -- Side
  author_id uuid, -- app_users.id or admins.id
  body text NOT NULL, -- 1–3,000 chars
  attachment_file_ids uuid[] NOT NULL DEFAULT '{}', -- Up to 3 private screenshots (files)
  client_message_id uuid, -- Idempotency for app-sent messages
  created_at timestamptz NOT NULL DEFAULT now() -- Sent
);
CREATE INDEX idx_support_ticket_messages_ticket ON support_ticket_messages (ticket_id, created_at);
CREATE UNIQUE INDEX uq_support_ticket_messages_client ON support_ticket_messages (ticket_id, client_message_id) WHERE client_message_id IS NOT NULL;
