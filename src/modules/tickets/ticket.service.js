const pool = require("../../config/db");

async function createTicket(organizationId, userId, data) {
  const { title, description, priority = "MEDIUM" } = data;

  const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 200 ||
    (description !== undefined && typeof description !== "string") ||
    !allowedPriorities.includes(priority)
  ) {
    const error = new Error("Invalid ticket details");
    error.status = 400;
    throw error;
  }

const result = await pool.query(
  `INSERT INTO tickets
    (organization_id, created_by, title, description, priority, sla_due_at)
   VALUES (
     $1, $2, $3, $4, $5,
     CURRENT_TIMESTAMP +
     CASE $5::VARCHAR
       WHEN 'CRITICAL' THEN INTERVAL '2 hours'
       WHEN 'HIGH' THEN INTERVAL '8 hours'
       WHEN 'MEDIUM' THEN INTERVAL '24 hours'
       WHEN 'LOW' THEN INTERVAL '72 hours'
     END
   )
   RETURNING *`,
  [
    organizationId,
    userId,
    title.trim(),
    description || null,
    priority
  ]
);

  return result.rows[0];
}

async function listTickets(user, filters = {}) {
  const {
    status,
    priority,
    search,
    page = 1,
    limit = 10
  } = filters;

  const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (
    !Number.isSafeInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isSafeInteger(limitNumber) ||
    limitNumber < 1 ||
    limitNumber > 100 ||
    (status !== undefined && !validStatuses.includes(status)) ||
    (priority !== undefined && !validPriorities.includes(priority)) ||
    (search !== undefined &&
      (typeof search !== "string" || search.length > 100))
  ) {
    const error = new Error("Invalid ticket filters");
    error.status = 400;
    throw error;
  }

  const offset = (pageNumber - 1) * limitNumber;

  if (!Number.isSafeInteger(offset)) {
    const error = new Error("Page number is too large");
    error.status = 400;
    throw error;
  }

  const conditions = ["t.organization_id = $1"];
  const params = [user.organization_id];

  if (user.role === "customer") {
    params.push(user.id);
    conditions.push(`t.created_by = $${params.length}`);
  } else if (user.role === "agent") {
    params.push(user.id);
    conditions.push(
      `(t.assigned_to = $${params.length} OR t.created_by = $${params.length})`
    );
  } else if (user.role !== "admin") {
    const error = new Error("Access denied");
    error.status = 403;
    throw error;
  }

  if (status) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }

  if (priority) {
    params.push(priority);
    conditions.push(`t.priority = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(
      `(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM tickets t
     WHERE ${whereClause}`,
    params
  );

  const total = countResult.rows[0].total;

  params.push(limitNumber);
  const limitPlaceholder = `$${params.length}`;

  params.push(offset);
  const offsetPlaceholder = `$${params.length}`;

  const result = await pool.query(
    `SELECT
       t.id,
       t.title,
       t.description,
       t.status,
       t.priority,
       t.created_at,
       t.updated_at,
       creator.name AS created_by_name,
       agent.name AS assigned_to_name
     FROM tickets t
     JOIN users creator ON t.created_by = creator.id
     LEFT JOIN users agent ON t.assigned_to = agent.id
     WHERE ${whereClause}
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT ${limitPlaceholder}
     OFFSET ${offsetPlaceholder}`,
    params
  );

  return {
    tickets: result.rows,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.ceil(total / limitNumber)
  };
}

async function getTicketById(ticketId, user) {
  if (!Number.isSafeInteger(Number(ticketId)) || Number(ticketId) <= 0) {
    const error = new Error("Invalid ticket ID");
    error.status = 400;
    throw error;
  }

  let query = `
    SELECT
      t.*,
      creator.name AS created_by_name,
      agent.name AS assigned_to_name
    FROM tickets t
    JOIN users creator
      ON t.created_by = creator.id
    LEFT JOIN users agent
      ON t.assigned_to = agent.id
    WHERE t.id = $1
      AND t.organization_id = $2
  `;

  const params = [ticketId, user.organization_id];

  if (user.role === "customer") {
    query += " AND t.created_by = $3";
    params.push(user.id);
  } else if (user.role === "agent") {
    query += " AND (t.assigned_to = $3 OR t.created_by = $3)";
    params.push(user.id);
  } else if (user.role !== "admin") {
    const error = new Error("Access denied");
    error.status = 403;
    throw error;
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    const error = new Error("Ticket not found");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function assignTicket(ticketId, agentId, user) {
  const isValidId = (value) =>
    /^[1-9]\d*$/.test(String(value)) &&
    Number.isSafeInteger(Number(value));

  if (!isValidId(ticketId) || !isValidId(agentId)) {
    const error = new Error("Invalid ticket or agent ID");
    error.status = 400;
    throw error;
  }

  const agentResult = await pool.query(
    `SELECT id
     FROM users
     WHERE id = $1
       AND organization_id = $2
       AND role = 'agent'`,
    [agentId, user.organization_id]
  );

  if (agentResult.rows.length === 0) {
    const error = new Error("Agent not found in your organization");
    error.status = 404;
    throw error;
  }

  const ticketResult = await pool.query(
    `UPDATE tickets
     SET assigned_to = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
       AND organization_id = $3
     RETURNING *`,
    [agentId, ticketId, user.organization_id]
  );

  if (ticketResult.rows.length === 0) {
    const error = new Error("Ticket not found");
    error.status = 404;
    throw error;
  }

  return ticketResult.rows[0];
}

async function updateTicketStatus(ticketId, newStatus, user) {
  const validTransitions = {
    OPEN: ["IN_PROGRESS"],
    IN_PROGRESS: ["RESOLVED"],
    RESOLVED: ["CLOSED"],
    CLOSED: []
  };

  if (
    !/^[1-9]\d*$/.test(String(ticketId)) ||
    !Number.isSafeInteger(Number(ticketId))
  ) {
    const error = new Error("Invalid ticket ID");
    error.status = 400;
    throw error;
  }

  if (
    typeof newStatus !== "string" ||
    !Object.prototype.hasOwnProperty.call(validTransitions, newStatus)
  ) {
    const error = new Error("Invalid ticket status");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ticketResult = await client.query(
      `SELECT id, status, assigned_to
       FROM tickets
       WHERE id = $1
         AND organization_id = $2
       FOR UPDATE`,
      [ticketId, user.organization_id]
    );

    if (ticketResult.rows.length === 0) {
      const error = new Error("Ticket not found");
      error.status = 404;
      throw error;
    }

    const ticket = ticketResult.rows[0];

    if (
      user.role !== "admin" &&
      !(user.role === "agent" && ticket.assigned_to === user.id)
    ) {
      const error = new Error("Access denied");
      error.status = 403;
      throw error;
    }

    if (!validTransitions[ticket.status].includes(newStatus)) {
      const error = new Error(
        `Cannot change status from ${ticket.status} to ${newStatus}`
      );
      error.status = 409;
      throw error;
    }

    const updatedResult = await client.query(
      `UPDATE tickets
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
         AND organization_id = $3
       RETURNING *`,
      [newStatus, ticketId, user.organization_id]
    );

    await client.query(
      `INSERT INTO ticket_history
         (ticket_id, changed_by, old_status, new_status)
       VALUES ($1, $2, $3, $4)`,
      [ticketId, user.id, ticket.status, newStatus]
    );

    await client.query("COMMIT");

    return updatedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function addTicketComment(ticketId, comment, user) {
  if (
    !/^[1-9]\d*$/.test(String(ticketId)) ||
    !Number.isSafeInteger(Number(ticketId))
  ) {
    const error = new Error("Invalid ticket ID");
    error.status = 400;
    throw error;
  }

  if (
    typeof comment !== "string" ||
    !comment.trim() ||
    comment.length > 2000
  ) {
    const error = new Error("Comment must be between 1 and 2000 characters");
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO ticket_comments (ticket_id, user_id, comment)
     SELECT t.id, $2, $3
     FROM tickets t
     WHERE t.id = $1
       AND t.organization_id = $4
       AND (
         $5 = 'admin'
         OR t.created_by = $2
         OR ($5 = 'agent' AND t.assigned_to = $2)
       )
     RETURNING *`,
    [
      ticketId,
      user.id,
      comment.trim(),
      user.organization_id,
      user.role
    ]
  );

  if (result.rows.length === 0) {
    const error = new Error("Ticket not found or access denied");
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function getTicketComments(ticketId, user) {
  // Reuse our existing ticket access checks.
  await getTicketById(ticketId, user);

  const result = await pool.query(
    `SELECT
       tc.id,
       tc.ticket_id,
       tc.comment,
       tc.created_at,
       u.id AS user_id,
       u.name AS commented_by,
       u.role AS user_role
     FROM ticket_comments tc
     JOIN users u ON tc.user_id = u.id
     WHERE tc.ticket_id = $1
       AND u.organization_id = $2
     ORDER BY tc.created_at ASC, tc.id ASC`,
    [ticketId, user.organization_id]
  );

  return result.rows;
}

async function getTicketHistory(ticketId, user) {
  // Verify the user is authorized to view this ticket.
  await getTicketById(ticketId, user);

  const result = await pool.query(
    `SELECT
       th.id,
       th.ticket_id,
       th.old_status,
       th.new_status,
       th.changed_at,
       u.id AS changed_by,
       u.name AS changed_by_name,
       u.role AS changed_by_role
     FROM ticket_history th
     JOIN users u ON th.changed_by = u.id
     WHERE th.ticket_id = $1
       AND u.organization_id = $2
     ORDER BY th.changed_at ASC, th.id ASC`,
    [ticketId, user.organization_id]
  );

  return result.rows;
}

async function getOverdueTickets(user) {
  const result = await pool.query(
    `SELECT
       t.id,
       t.title,
       t.status,
       t.priority,
       t.created_at,
       t.sla_due_at,
       creator.name AS created_by_name,
       agent.name AS assigned_to_name
     FROM tickets t
     JOIN users creator
       ON t.created_by = creator.id
     LEFT JOIN users agent
       ON t.assigned_to = agent.id
     WHERE t.organization_id = $1
       AND t.sla_due_at < CURRENT_TIMESTAMP
       AND t.status NOT IN ('RESOLVED', 'CLOSED')
     ORDER BY t.sla_due_at ASC, t.id ASC`,
    [user.organization_id]
  );

  return result.rows;
}

async function escalateTicket(ticketId, user) {
  if (
    !/^[1-9]\d*$/.test(String(ticketId)) ||
    !Number.isSafeInteger(Number(ticketId))
  ) {
    const error = new Error("Invalid ticket ID");
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    `UPDATE tickets
     SET is_escalated = TRUE,
         escalated_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND organization_id = $2
       AND sla_due_at < CURRENT_TIMESTAMP
       AND status IN ('OPEN', 'IN_PROGRESS')
       AND is_escalated = FALSE
     RETURNING *`,
    [ticketId, user.organization_id]
  );

  if (result.rows.length === 0) {
    const error = new Error(
      "Ticket not found, not overdue, already escalated, or resolved"
    );
    error.status = 409;
    throw error;
  }

  return result.rows[0];
}

async function getTicketAnalytics(user) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_tickets,

       COUNT(*) FILTER (
         WHERE status = 'OPEN'
       )::int AS open_tickets,

       COUNT(*) FILTER (
         WHERE status = 'IN_PROGRESS'
       )::int AS in_progress_tickets,

       COUNT(*) FILTER (
         WHERE status = 'RESOLVED'
       )::int AS resolved_tickets,

       COUNT(*) FILTER (
         WHERE status = 'CLOSED'
       )::int AS closed_tickets,

       COUNT(*) FILTER (
         WHERE sla_due_at < CURRENT_TIMESTAMP
           AND status IN ('OPEN', 'IN_PROGRESS')
       )::int AS overdue_tickets,

       COUNT(*) FILTER (
         WHERE is_escalated = TRUE
       )::int AS escalated_tickets,

       COUNT(*) FILTER (
         WHERE priority = 'CRITICAL'
       )::int AS critical_tickets,

       COUNT(*) FILTER (
         WHERE priority = 'HIGH'
       )::int AS high_priority_tickets

     FROM tickets
     WHERE organization_id = $1`,
    [user.organization_id]
  );

  return result.rows[0];
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  getTicketComments,
  getTicketHistory,
  getOverdueTickets,
  escalateTicket,
  getTicketAnalytics
};