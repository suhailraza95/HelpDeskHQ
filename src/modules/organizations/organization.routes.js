const express = require("express");
const protect = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const { createUser, listUsers, getMyOrganization } = require("./organization.controller");

const router = express.Router();


/**
 * @swagger
 * /api/organizations/users:
 *   post:
 *     summary: Create an organization user
 *     description: Allows an admin to create an agent or customer within their organization.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Amit
 *               email:
 *                 type: string
 *                 format: email
 *                 example: amit.agent@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestPassword123!
 *               role:
 *                 type: string
 *                 enum: [agent, customer]
 *                 example: agent
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid user details
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Admin access required
 *       409:
 *         description: User already exists
 */
router.post("/users", protect, authorize("admin"), createUser);

/**
 * @swagger
 * /api/organizations/users:
 *   get:
 *     summary: List organization users
 *     description: Returns users belonging to the authenticated admin's organization.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 3
 *                       organization_id:
 *                         type: integer
 *                         example: 2
 *                       name:
 *                         type: string
 *                         example: Amit
 *                       email:
 *                         type: string
 *                         example: amit.agent@example.com
 *                       role:
 *                         type: string
 *                         enum: [admin, agent, customer]
 *                         example: agent
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Admin access required
 */
router.get("/users", protect, authorize("admin"), listUsers);

/**
 * @swagger
 * /api/organizations/me:
 *   get:
 *     summary: Get current organization details
 *     description: Returns the organization associated with the authenticated user.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     name:
 *                       type: string
 *                       example: Tech Support Ltd
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Missing or invalid JWT token
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Organization not found
 */
router.get("/me", protect, getMyOrganization);

module.exports = router;