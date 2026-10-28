const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./modules/auth.routes");
const app = express();
const organizationRoutes = require("./modules/organizations/organization.routes");
const ticketRoutes = require("./modules/tickets/ticket.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
console.log("Swagger configuration loaded:", swaggerSpec.servers);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "HelpdeskHQ API is running",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM organizations"
    );

    res.status(200).json({
      success: true,
      organizations: result.rows,
    });
  } catch (error) {
    console.error("Database query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database query failed",
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;