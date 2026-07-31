CREATE TABLE usage_events
(
  event_id UUID PRIMARY KEY,
  anonymous_id UUID NOT NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('app_opened', 'log_clicked')),
  log_id TEXT,
  action TEXT CHECK (action IN ('expand', 'collapse')),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (event_type = 'app_opened' AND log_id IS NULL AND action IS NULL)
    OR
    (event_type = 'log_clicked' AND log_id IS NOT NULL AND action IS NOT NULL)
  )
);

CREATE INDEX usage_events_received_at_idx ON usage_events (received_at DESC);
CREATE INDEX usage_events_anonymous_session_idx
  ON usage_events (anonymous_id, session_id, received_at DESC);
