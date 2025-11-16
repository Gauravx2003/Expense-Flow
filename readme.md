# 💼 Expense Management System (MERN + Prisma + PostgreSQL)

An end-to-end expense tracking and approval platform for modern teams. Employees submit expenses with receipts, managers collaborate on approvals, finance validates reimbursements, and administrators oversee policies, workflows, and audits. The system is production-ready, extensible, and designed to be easy to run locally or deploy to the cloud.

---

## 📚 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture at a Glance](#-architecture-at-a-glance)
3. [Key Features](#-key-features)
4. [Domain Glossary](#-domain-glossary)
5. [Monorepo Layout](#-monorepo-layout)
6. [Data Model](#-data-model)
7. [User Roles & Permissions](#-user-roles--permissions)
8. [Core Workflows](#-core-workflows)
9. [Tech Stack](#-tech-stack)
10. [Prerequisites](#-prerequisites)
11. [Quick Start (5 Minutes)](#-quick-start-5-minutes)
12. [Configuration & Environment Variables](#-configuration--environment-variables)
13. [Running the Apps](#-running-the-apps)
14. [Backend Overview](#-backend-overview)
15. [Frontend Overview](#-frontend-overview)
16. [API Primer](#-api-primer)
17. [Testing & Quality](#-testing--quality)
18. [Extensibility & Integrations](#-extensibility--integrations)
19. [Deployment Guide](#-deployment-guide)
20. [Monitoring & Troubleshooting](#-monitoring--troubleshooting)
21. [FAQ](#-faq)
22. [Contributing](#-contributing)
23. [License](#-license)
24. [Appendix: Helpful Commands](#-appendix-helpful-commands)

---

## 🌍 Project Overview

- **Goal:** Centralize expense submissions, automate approvals, and maintain auditable financial records.
- **Audience:** Growing organizations that need configurable flows, role-based access, and integration-ready services.
- **Principles:** Clean architecture, clear separation of concerns, type-safe DB access with Prisma, and modern UX with React + Tailwind.

---

## 🏗️ Architecture at a Glance

```
[Client (React, Vite)]
     |
     | REST / JWT
     v
[Server (Express + Prisma)]
     |
     | SQL via Prisma Client
     v
[PostgreSQL]
```

- **Authentication:** JWT stateless auth with role enforcement.
- **Services:** Modular controllers, services, and middleware.
- **Storage:** Pluggable receipt storage (local, S3, Cloudinary).
- **OCR:** Optional OCR integration via service wrapper (cloud-ready).

---

## 🧩 Key Features

- **Expense Lifecycle:** Draft → Submit → Multi-step Approval → Reimbursement → Archive.
- **Dynamic Approval Flows:** Configure per-company rule sets and hierarchies.
- **Receipts & OCR:** Upload multiple receipts; optionally auto-extract data.
- **Dashboards:** Employee, manager, and admin-tailored experiences.
- **Audit Logging:** Every action is recorded with metadata.
- **Notifications Ready:** Service stubs for email/SMS/webhook updates.

---

## 🗂️ Domain Glossary

- **Company:** Tenant-level context containing users and policies.
- **User:** Represents employees, managers, or administrators.
- **Expense:** Financial request composed of line items and receipts.
- **Approval Flow:** Template describing ordered review steps.
- **Approval Instance:** Runtime execution of a flow for a specific expense.
- **Audit Log:** Immutable record of system actions.

---

## 📦 Monorepo Layout

```
.
├─ client/expense-manager/           # React app (Vite)
│  ├─ src/
│  │  ├─ components/                 # UI components, layouts, widgets
│  │  ├─ pages/                      # Route-driven pages
│  │  ├─ lib/                        # Contexts, hooks, utilities
│  │  └─ services/                   # API clients
│  └─ public/                        # Static assets
└─ server/
   ├─ prisma/                        # Prisma schema, migrations, seed
   └─ src/
      ├─ controllers/                # HTTP handlers
      ├─ middleware/                 # Auth, error handling, validation
      ├─ routes/                     # Express routers per domain
      ├─ services/                   # Business logic (approval engine, OCR)
      ├─ utils/                      # Helpers (logger, response wrappers)
      └─ app.js                      # Express app bootstrap
```

---

## 🗄️ Data Model

- **Company**
  - Fields: name, domain, policies.
  - Relations: has many users, expenses, approval flows.
- **User**
  - Fields: name, email, role, password hash, companyId.
  - Relations: belongs to company, owns expenses, participates in approvals.
- **Expense**
  - Fields: title, description, amount, currency, status, submittedAt.
  - Relations: createdBy user, has receipts, has approval instances.
- **Receipt**
  - Fields: fileUrl, mimeType, extractedData (JSON), expenseId.
  - Storage driver decided at runtime.
- **ApprovalFlow & ApprovalStep**
  - Template specifying ordered approvers, rules, escalation.
- **ApprovalInstance & ApprovalInstanceStep**
  - Runtime tracking; steps record decisions, assignees, timestamps.
- **ApprovalStepDecision**
  - Snapshot of approve/reject action with reason.
- **AuditLog**
  - Generic entity storing actor, action type, payload, timestamp.

---

## 🔐 User Roles & Permissions

- **EMPLOYEE**
  - Draft, submit, and view own expenses.
  - Upload receipts, view approval status, respond to feedback.
- **MANAGER**
  - Review assigned approval steps, request changes, approve/reject.
  - Access team dashboards and reporting.
- **ADMIN**
  - Manage companies, flows, users, system configuration.
  - View full audit history, override approvals if required.

Server enforces RBAC through `auth` and `roleCheck` middleware; frontend mirrors via protected routes and context-driven UI.

---

## 🔄 Core Workflows

### Expense Lifecycle

```
[Draft] --submit--> [Pending Step 1] --approve--> ... --approve--> [Approved]
     |                                    |
     +--delete--> [Archived]         --reject--> [Needs Revision]
```

- Draft created by employee with mandatory fields and receipts.
- Submission creates an approval instance and locks edits.
- Managers approve or reject at each step; rejections unlock the expense.
- Final approval marks expense for reimbursement and triggers finance handoff.

### Approval Flow Management

- Admin defines templates (e.g., Manager → Finance → Admin).
- Supports conditional steps (amount thresholds, department matching).
- Flow versioning keeps historical approvals intact.

### Audit & Notifications

- Every state change persists to `AuditLog`.
- Notification service hook in `services/notifications` can push emails, Slack, etc.

---

## 🚀 Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| **Frontend** | React (Vite), React Router, Axios, Tailwind CSS, Radix UI |
| **Backend**  | Node.js, Express.js                                       |
| **ORM**      | Prisma                                                    |
| **Database** | PostgreSQL                                                |
| **Auth**     | JWT (server-side)                                         |
| **Storage**  | Local/Cloud (pluggable; e.g. Cloudinary/S3)               |
| **OCR**      | Custom OCR service wrapper (extensible)                   |

---

## ⚙️ Prerequisites

- Node.js 18+
- npm 9+ (or pnpm/yarn with matching configs)
- PostgreSQL 14+ (local or remote)
- Optional: Cloud storage credentials, SMTP service

---

## ⚡ Quick Start (5 Minutes)

```bash
git clone https://github.com/<your-username>/expense-management-system.git
cd expense-management-system

# Install root utilities
npm install

# Install backend and frontend dependencies
cd server && npm install && cd ..
cd client/expense-manager && npm install && cd ../..

# Configure environment
cp server/.env.example server/.env
# edit values for DATABASE_URL, JWT_SECRET, etc.

# Run migrations (from server/)
cd server
npm run prisma:migrate
npm run prisma:generate

# Seed sample data (optional, if script exists)
node prisma/seed.js

# Start dev servers
npm run dev          # backend on port 3000
cd ../client/expense-manager
npm run dev          # frontend on port 5173
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

---

## 🔧 Configuration & Environment Variables

Create `server/.env`. Example:

```
DATABASE_URL="postgresql://user:password@localhost:5432/expense_db"
JWT_SECRET="paste-a-long-random-secret"
SMTP_HOST="localhost"
SMTP_PORT="2525"
SMTP_USER=""
SMTP_PASS=""
CLOUDINARY_URL=""
OCR_API_KEY=""
```

- `DATABASE_URL`: Standard Prisma connection string.
- `JWT_SECRET`: Shared secret for signing tokens.
- `SMTP_*`: Required if enabling email notifications.
- `CLOUDINARY_URL` or S3 credentials: Required for remote receipt storage.
- `OCR_API_KEY`: Hook for OCR vendor (optional).

Always restart the server after changing env variables.

---

## 🏃 Running the Apps

- **Backend (`server/`):**

  - `npm run dev`: Nodemon-based development server.
  - `npm start`: Production-mode server.
  - `npm run prisma:migrate`: Apply migrations.
  - `npm run prisma:generate`: Regenerate Prisma client.
  - `npm run prisma:studio`: Visualize data in Prisma Studio.

- **Frontend (`client/expense-manager/`):**
  - `npm run dev`: Start Vite dev server.
  - `npm run build`: Production build output in `dist/`.
  - `npm run preview`: Preview production build locally.
  - `npm run lint`: ESLint checks.

---

## 🧠 Backend Overview

- **Entry Point:** `server/src/app.js` wires Express, middleware, routes.
- **Authentication:** `middleware/auth.js` verifies token; `roleCheck.js` enforces role.
- **Controllers:** `src/controllers/*` responsible for request/response orchestration.
- **Services:** Business logic in `src/services/*`; includes the approval engine and integrations.
- **Validation:** Request payload validation (e.g., using zod/joi-y patterns if implemented).
- **Error Handling:** Centralized error middleware normalizes API responses.
- **Logging:** Pluggable logger (console by default) with correlation IDs ready.

### Approval Engine Highlights

- Loads company-specific flow definition.
- Determines eligible approvers per step (role + custom filters).
- Persists approval instances and step decisions atomically via Prisma transactions.
- Supports escalation hooks (stubbed for customization).

---

## 🖥️ Frontend Overview

- **Routing:** React Router, layouts in `src/components/Layout.jsx`, protected routes.
- **State Management:** Contexts under `src/lib/contexts`, including `AuthContext`.
- **UI:** Tailwind CSS + Radix UI for accessible components.
- **Networking:** Axios wrappers with interceptors for JWT injection and error handling.
- **Pages:** Modular pages for auth, dashboard, expenses, approvals, admin oversight.
- **Forms:** React Hook Form or controlled components (depending on implementation) with inline validation and file uploads.

---

## 🌐 API Primer

- **Base URL:** `http://localhost:3000/api`
- **Auth Flow:** Register/login to receive JWT → include `Authorization: Bearer <token>` header.
- **Error Format:** JSON with `message`, `code`, and optional `details`.

### Common Routes

- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`
- **Company:** `POST /companies`, `GET /companies`, `GET /companies/:id`
- **Users:** `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`
- **Expenses:** `POST /expenses`, `GET /expenses`, `GET /expenses/:id`, `PATCH /expenses/:id`, `POST /expenses/:id/submit`, `DELETE /expenses/:id`
- **Receipts:** `POST /receipts/:expenseId`, `GET /receipts/:expenseId`, `DELETE /receipts/:id`
- **Approvals:** `GET /approvals`, `POST /approvals/:expenseId`
- **Approval Flows:** `GET /approval-flows`, `POST /approval-flows`, `GET /approval-flows/:id`
- **Audit Logs:** `GET /audit-logs`, `GET /audit-logs/:id`

### Sample Request

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Client Dinner",
    "amount": 120.50,
    "currency": "USD",
    "category": "Meals",
    "description": "Dinner with ACME Corp"
  }'
```

---

## 🧪 Testing & Quality

- **Backend:** Jest + Supertest recommended for integration tests (controllers, services).
- **Frontend:** Vitest + React Testing Library for components and hooks.
- **Linting:** ESLint with recommended React and accessibility configs.
- **Type Safety:** Prisma schema ensures DB integrity; consider adding TypeScript for the server if desired.
- **CI Ready:** Add GitHub Actions/CI to run `npm run lint`, backend tests, and frontend tests.

---

## 🔌 Extensibility & Integrations

- **Storage Drivers:** Implement adapters for S3, GCS, Cloudinary through a unified interface.
- **OCR Providers:** Plug new OCR services by adhering to `services/ocrService`.
- **Notification Channels:** Extend `services/notifications` for email, Slack, Teams, or webhooks.
- **Policy Engine:** Enhance approval criteria by adding custom rules in `approvalEngine`.
- **Reporting:** Connect BI tools or export CSV/Excel via dedicated endpoints.

---

## 🚀 Deployment Guide

- **Backend**
  - Set env variables (`DATABASE_URL`, `JWT_SECRET`, SMTP/storage secrets).
  - Build container or run `npm install --production` followed by `npm start`.
  - Run migrations (`npm run prisma:migrate`) on deploy.
- **Frontend**
  - Run `npm run build` → deploy `dist/` to static hosting (Netlify, Vercel, S3 + CloudFront).
  - Configure environment variables for API base URL.
- **Database**
  - Use managed Postgres (e.g., Render, Railway, Supabase).
  - Apply Prisma migrations via CI/CD or manual step.
- **Infrastructure Considerations**
  - HTTPS termination (ingress or load balancer).
  - Secrets management (Vault, environment store).
  - Horizontal scaling by separating frontend, backend, worker tiers.

---

## 🛡️ Monitoring & Troubleshooting

- **Health Checks:** Implement `/health` endpoint (extend `app.js`) for uptime monitoring.
- **Logging:** Forward console output to centralized logging (Datadog, ELK, etc.).
- **Metrics:** Hook into APM tools for response times and error rates.
- **Common Issues**
  - Prisma errors → Check `DATABASE_URL`, run migrations, ensure DB reachable.
  - 401/403 responses → Validate token expiration, role permissions, CORS.
  - File upload failures → Verify storage credentials and allowed MIME types.
  - Build failures → Align Node versions, clear `node_modules`, reinstall dependencies.

---

## ❓ FAQ

- **Can I disable OCR?** Yes. Leave `OCR_API_KEY` empty and the service skips extraction.
- **Is multi-tenancy supported?** Yes via the `Company` model; scopes data per company.
- **How do I add new approval steps?** Update the approval flow template via admin UI or API, then future expenses use the new flow version.
- **Can I integrate payroll?** Use audit logs and approval completion webhooks to trigger payroll systems.

---

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Follow linting/formatting rules.
3. Document changes and add tests where possible.
4. Submit a PR with a detailed description and testing notes.

---

## 📄 License

MIT (or customize to match your organization’s licensing needs).

---

## 📚 Appendix: Helpful Commands

```bash
# Server (from server/)
npm run dev
npm run prisma:migrate
npm run prisma:studio

# Client (from client/expense-manager/)
npm run dev
npm run build && npm run preview
```

Happy shipping!
