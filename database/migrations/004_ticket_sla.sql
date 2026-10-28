ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMP;

UPDATE tickets
SET sla_due_at =
  created_at +
  CASE priority
    WHEN 'CRITICAL' THEN INTERVAL '2 hours'
    WHEN 'HIGH' THEN INTERVAL '8 hours'
    WHEN 'MEDIUM' THEN INTERVAL '24 hours'
    WHEN 'LOW' THEN INTERVAL '72 hours'
  END
WHERE sla_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_org_sla
ON tickets (organization_id, sla_due_at);