const express = require("express");

const protect = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const {
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
} = require("./ticket.controller");

const router = express.Router();


/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a support ticket
 *     description: Creates a ticket and calculates its SLA deadline based on priority.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Unable to access dashboard
 *               description:
 *                 type: string
 *                 example: Dashboard shows an error after login.
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *                 example: HIGH
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Invalid ticket details
 *       401:
 *         description: Missing or invalid JWT token
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  protect,
  authorize("admin", "agent", "customer"),
  createTicket
);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: List support tickets
 *     description: Returns tickets accessible to the logged-in user, with search, filtering and pagination.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *         description: Filter tickets by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter tickets by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tickets by title or description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tickets per page
 *     responses:
 *       200:
 *         description: Paginated tickets retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Missing or invalid JWT token
 */
router.get(
  "/",
  protect,
  authorize("admin", "agent", "customer"),
  listTickets
);


/**
 * @swagger
 * /api/tickets/overdue:
 *   get:
 *     summary: Get overdue tickets
 *     description: Returns unresolved tickets whose SLA deadlines have passed. Admin access required.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue tickets retrieved successfully
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Admin access required
 */
router.get(
  "/overdue",
  protect,
  authorize("admin"),
  getOverdueTickets
);


/**
 * @swagger
 * /api/tickets/analytics:
 *   get:
 *     summary: Get ticket analytics
 *     description: Returns ticket statistics for the admin's organization, including status counts, overdue tickets, escalations and priorities.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     total_tickets:
 *                       type: integer
 *                     open_tickets:
 *                       type: integer
 *                     in_progress_tickets:
 *                       type: integer
 *                     resolved_tickets:
 *                       type: integer
 *                     closed_tickets:
 *                       type: integer
 *                     overdue_tickets:
 *                       type: integer
 *                     escalated_tickets:
 *                       type: integer
 *                     critical_tickets:
 *                       type: integer
 *                     high_priority_tickets:
 *                       type: integer
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Admin access required
 */
router.get(
  "/analytics",
  protect,
  authorize("admin"),
  getTicketAnalytics
);


/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket details
 *     description: Returns a ticket if it belongs to the user's organization and the user has permission to view it.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details retrieved successfully
 *       400:
 *         description: Invalid ticket ID
 *       401:
 *         description: Missing or invalid JWT token
 *       404:
 *         description: Ticket not found or inaccessible
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "agent", "customer"),
  getTicketById
);


/**
 * @swagger
 * /api/tickets/{id}/assign:
 *   patch:
 *     summary: Assign ticket to an agent
 *     description: Allows an admin to assign a ticket to an agent belonging to the same organization.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       400:
 *         description: Invalid ticket or agent ID
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Ticket or agent not found
 */
router.patch(
  "/:id/assign",
  protect,
  authorize("admin"),
  assignTicket
);


/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status
 *     description: Allows an admin or assigned agent to update a ticket through valid status transitions. Changes are recorded in ticket history.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *                 example: IN_PROGRESS
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *       400:
 *         description: Invalid status or status transition
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ticket not found
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "agent"),
  updateTicketStatus
);


/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Add a ticket comment
 *     description: Allows an authorized user to add a comment to a ticket.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: We are investigating the issue.
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid comment
 *       401:
 *         description: Missing or invalid JWT token
 *       404:
 *         description: Ticket not found or inaccessible
 */
router.post(
  "/:id/comments",
  protect,
  authorize("admin", "agent", "customer"),
  addTicketComment
);


/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   get:
 *     summary: Get ticket comments
 *     description: Returns comments for a ticket accessible to the logged-in user, including comment author details.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket comments retrieved successfully
 *       400:
 *         description: Invalid ticket ID
 *       401:
 *         description: Missing or invalid JWT token
 *       404:
 *         description: Ticket not found or inaccessible
 */
router.get(
  "/:id/comments",
  protect,
  authorize("admin", "agent", "customer"),
  getTicketComments
);


/**
 * @swagger
 * /api/tickets/{id}/history:
 *   get:
 *     summary: Get ticket status history
 *     description: Returns the status change history of a ticket, including who made each change.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket history retrieved successfully
 *       400:
 *         description: Invalid ticket ID
 *       401:
 *         description: Missing or invalid JWT token
 *       404:
 *         description: Ticket not found or inaccessible
 */
router.get(
  "/:id/history",
  protect,
  authorize("admin", "agent", "customer"),
  getTicketHistory
);


/**
 * @swagger
 * /api/tickets/{id}/escalate:
 *   patch:
 *     summary: Escalate an overdue ticket
 *     description: Allows an admin to manually escalate an overdue, unresolved ticket. A ticket can only be escalated once.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket escalated successfully
 *       400:
 *         description: Invalid ticket ID
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Ticket is not eligible for escalation
 */
router.patch(
  "/:id/escalate",
  protect,
  authorize("admin"),
  escalateTicket
);




module.exports = router;