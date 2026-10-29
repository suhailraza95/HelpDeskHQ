# HelpDeskHQ

A multi-tenant helpdesk REST API built with **Node.js, Express.js, PostgreSQL, and Docker**. Designed to demonstrate backend engineering concepts including authentication, role-based access control, relational database design, transactions, ticket management, SLA tracking, automated testing, and CI.

## Features

- **Multi-Tenant Architecture:** Organizations manage their own users and tickets, with organization-level data isolation.
- **Authentication:** Password hashing with bcrypt and JWT-based authentication.
- **Role-Based Access Control:** Three roles — Admin, Agent, and Customer.
- **Ticket Management:** Create, assign, view, and update support tickets.
- **Ticket Lifecycle:** OPEN → IN_PROGRESS → RESOLVED → CLOSED.
- **Comments and Audit History:** Track conversations and ticket status changes.
- **Search and Pagination:** Filter tickets by status, priority, and search terms.
- **SLA Management:** Priority-based deadlines for support tickets.
- **Escalation:** Escalate overdue tickets.
- **Analytics:** Organization-level ticket statistics.
- **API Documentation:** Interactive Swagger UI.
- **Containerization:** Docker Compose runs the API and PostgreSQL together.
- **Continuous Integration:** GitHub Actions runs database migrations and Jest tests on pushes and pull requests.

## Technology Stack

| Category | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| Testing | Jest, Supertest |
| API Documentation | Swagger / OpenAPI |
| Containerization | Docker, Docker Compose |
| CI | GitHub Actions |
| Version Control | Git, GitHub |

## Architecture

```text
Client / Postman / Swagger
           |
           v
      Express API
           |
           v
   Authentication + RBAC
           |
           v
   Routes → Controllers
           |
           v
        Services
           |
           v
     PostgreSQL
```

The application uses a modular architecture to separate API routing, request handling, business logic, and database access.

## Database Design

The PostgreSQL database contains five primary tables:

| Table | Purpose |
|---|---|
| organizations | Stores tenant organizations |
| users | Stores organization users and roles |
| tickets | Stores support tickets, assignments, status, and SLA information |
| ticket_comments | Stores ticket conversations |
| ticket_history | Records ticket status changes |

Foreign keys maintain relationships between organizations, users, and tickets.

Database migrations are stored in `database/migrations/`.

## User Roles

| Permission | Admin | Agent | Customer |
|---|---|---|---|
| Create tickets | Yes | Yes | Yes |
| View permitted tickets | Yes | Yes | Yes |
| Create organization users | Yes | No | No |
| Assign tickets | Yes | No | No |
| Update assigned ticket status | Yes | Yes | No |
| View analytics | Yes | No | No |
| Escalate overdue tickets | Yes | No | No |

Ticket visibility is scoped by organization and role.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register an organization and its admin |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get authenticated user |

### Organizations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/organizations/me` | Get organization details |
| POST | `/api/organizations/users` | Create an organization user |
| GET | `/api/organizations/users` | List organization users |

### Tickets

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets` | List and filter tickets |
| GET | `/api/tickets/overdue` | List overdue tickets |
| GET | `/api/tickets/analytics` | Get ticket analytics |
| GET | `/api/tickets/:id` | Get ticket details |
| PATCH | `/api/tickets/:id/assign` | Assign ticket to agent |
| PATCH | `/api/tickets/:id/status` | Update ticket status |
| POST | `/api/tickets/:id/comments` | Add ticket comment |
| GET | `/api/tickets/:id/comments` | Get ticket comments |
| GET | `/api/tickets/:id/history` | Get ticket status history |
| PATCH | `/api/tickets/:id/escalate` | Escalate overdue ticket |

Protected endpoints require a JWT bearer token.

## Run Locally with Docker

### Prerequisites

- Docker Desktop
- Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/suhailraza95/HelpDeskHQ.git
cd HelpDeskHQ
```

### 2. Configure environment variables

Create a `.env` file in the project root with a strong JWT secret:

```env
JWT_SECRET=replace_with_a_long_random_secret
```

Docker Compose supplies the development database connection settings.

### 3. Start the application

```bash
docker compose up --build -d
```

On first initialization of an empty database volume, PostgreSQL executes the SQL migration scripts.

### 4. Access the application

- API: http://localhost:5004
- Health check: http://localhost:5004/health
- Swagger UI: http://localhost:5004/api-docs

### 5. Stop the application

```bash
docker compose down
```

This stops the containers while retaining the PostgreSQL data volume.

## Run Without Docker

Install Node.js and PostgreSQL, create a database, and configure the `.env` file with the required connection settings:

```env
PORT=5004
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=helpdeskhq
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Install dependencies:

```bash
npm ci
```

Apply the SQL migrations in `database/migrations/` in numerical order, then start the application:

```bash
npm start
```

## Testing

The project uses Jest and Supertest for automated API tests.

```bash
npm test
```

Current automated coverage includes the health endpoint and authentication error handling.

Additional end-to-end API flows can be exercised using Postman or Swagger UI.

## Continuous Integration

The GitHub Actions workflow at `.github/workflows/ci.yml` automatically:

1. Checks out the repository.
2. Installs Node.js and dependencies.
3. Starts a PostgreSQL test database.
4. Applies database migrations.
5. Runs the Jest test suite.

The CI workflow runs on pushes and pull requests targeting the configured branches.

## SLA Rules

Ticket deadlines are calculated from their priority.

| Priority | SLA Deadline |
|---|---|
| CRITICAL | 2 hours |
| HIGH | 8 hours |
| MEDIUM | 24 hours |
| LOW | 72 hours |

Overdue, unresolved tickets can be escalated by an administrator.

## Project Status

- Backend API implemented
- PostgreSQL migrations implemented
- Docker Compose configured and tested locally
- Swagger API documentation implemented
- GitHub Actions CI passing
- Full end-to-end verification in progress
- Public cloud deployment not yet configured

## Author

**Suhail Raza**

GitHub: https://github.com/suhailraza95