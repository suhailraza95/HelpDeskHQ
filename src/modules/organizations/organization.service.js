const pool = require("../../config/db");
const bcrypt = require("bcryptjs");

async function createUser(organizationId, { name, email, password, role }) {
  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || password.length < 8 ||
    !["agent", "customer"].includes(role)
  ) {
    const error = new Error("Invalid user details or role");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users
       (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, email, role`,
      [organizationId, name.trim(), normalizedEmail, hashedPassword, role]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      const conflict = new Error("Email already exists in this organization");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }
}

async function getOrganizationUsers(organizationId) {
  const result = await pool.query(
    `SELECT id, organization_id, name, email, role, created_at
     FROM users
     WHERE organization_id = $1
     ORDER BY id ASC`,
    [organizationId]
  );

  return result.rows;
}

async function getOrganizationById(organizationId) {
  const result = await pool.query(
    `SELECT id, name, created_at
     FROM organizations
     WHERE id = $1`,
    [organizationId]
  );

  return result.rows[0] || null;
}

module.exports = { createUser, getOrganizationUsers, getOrganizationById };