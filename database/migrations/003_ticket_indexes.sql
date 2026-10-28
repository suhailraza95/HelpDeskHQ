CREATE INDEX IF NOT EXISTS idx_tickets_org_created
ON tickets (organization_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_org_status
ON tickets (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_org_priority
ON tickets (organization_id, priority);

CREATE INDEX IF NOT EXISTS idx_tickets_org_assigned
ON tickets (organization_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_tickets_org_creator
ON tickets (organization_id, created_by);