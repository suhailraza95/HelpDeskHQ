ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_tickets_org_escalated
ON tickets (organization_id, is_escalated);