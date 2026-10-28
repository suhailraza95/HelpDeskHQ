CREATE UNIQUE INDEX users_org_email_unique_idx
ON users (organization_id, LOWER(email));