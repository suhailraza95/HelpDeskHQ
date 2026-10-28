const pool = require("../../src/config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUser({
  organizationName,
  name,
  email,
  password
}) {
  if (
    typeof organizationName !== "string" ||
    !organizationName.trim() ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    throw new Error("Invalid registration details");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const organizationResult = await client.query(
      `INSERT INTO organizations (name)
       VALUES ($1)
       RETURNING id, name`,
      [organizationName.trim()]
    );

    const organization = organizationResult.rows[0];

    const userResult = await client.query(
      `INSERT INTO users
       (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, email, role`,
      [
        organization.id,
        name.trim(),
        normalizedEmail,
        hashedPassword,
        "admin"
      ]
    );

    await client.query("COMMIT");

    return {
      organization,
      user: userResult.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}



async function loginUser({ organizationId, email, password }) {
  if (!Number.isInteger(organizationId) || organizationId <= 0 ||
      typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password) {
    throw new Error("Valid organizationId, email and password are required");
  }

  const result = await pool.query(
    `SELECT id, organization_id, name, email, role, password_hash
     FROM users
     WHERE organization_id = $1 AND email = $2`,
    [organizationId, email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    }
  };
}

module.exports = { registerUser, loginUser };