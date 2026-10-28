const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "HelpDeskHQ API",
      version: "1.0.0",
      description:
        "Multi-tenant Helpdesk Ticket Management API built with Node.js, Express and PostgreSQL"
    },

    servers: [
      {
        url: "http://localhost:5004",
        description: "Local development server"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: ["./src/modules/**/*.routes.js"]
};

const swaggerSpec = swaggerJsdoc(options);
console.log("Swagger servers:", swaggerSpec.servers);

module.exports = swaggerSpec;