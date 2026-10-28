const express = require("express");
const { register, login, getMe } = require("./auth.controller");
const protect = require("../../src/middleware/auth.middleware");
const authorize = require("../../src/middleware/role.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new organization
 *     description: Creates an organization and its first admin account.
 *     tags:
 *       - Authentication
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *               - name
 *               - email
 *               - password
 *             properties:
 *               organizationName:
 *                 type: string
 *                 example: Demo Support Ltd
 *               name:
 *                 type: string
 *                 example: Rahul
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rahul@demosupport.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestPassword123!
 *     responses:
 *       201:
 *         description: Organization and admin created successfully
 *       400:
 *         description: Invalid registration details
 *       409:
 *         description: Registration conflict
 *       500:
 *         description: Internal server error
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to HelpDeskHQ
 *     description: Authenticate a user within an organization and receive a JWT access token.
 *     tags:
 *       - Authentication
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - email
 *               - password
 *             properties:
 *               organizationId:
 *                 type: integer
 *                 example: 2
 *               email:
 *                 type: string
 *                 example: rahul.admin@example.com
 *               password:
 *                 type: string
 *                 example: TestPassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing or invalid request fields
 *       401:
 *         description: Invalid login credentials
 */

router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     description: Returns the authenticated user's details using their JWT access token.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     organization_id:
 *                       type: integer
 *                       example: 2
 *                     name:
 *                       type: string
 *                       example: Rahul
 *                     email:
 *                       type: string
 *                       example: rahul.admin@example.com
 *                     role:
 *                       type: string
 *                       enum: [admin, agent, customer]
 *                       example: admin
 *       401:
 *         description: Missing or invalid JWT token
 */
router.get("/me", protect , getMe);

router.get("/admin-test", protect, authorize("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin!",
    user: req.user.name,
  });
});

module.exports = router;