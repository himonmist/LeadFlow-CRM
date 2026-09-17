# LeadFlow CRM

**From First Lead to Successful Delivery — All in One Workflow.**

A multi-tenant Lead-to-Service / Lead-to-Training lifecycle SaaS CRM. Companies capture leads, manage every
interaction, convert leads into service or training engagements with their own delivery workflows, schedule
delivery, generate quotations/invoices, and track the full customer lifecycle through to repeat business.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Prisma ORM** — SQLite for zero-config local dev; swap the datasource `provider` to `postgresql` for
  production (every tenant-owned table already carries `tenantId` — add Postgres Row-Level Security policies
  keyed on it for defense in depth beyond the application-layer scoping already enforced in `src/lib/session.ts`).
- **Auth.js (NextAuth v5)** credentials auth, JWT sessions carrying `tenantId` + role + permission matrix.
- Server Actions for mutations (create lead, log activity, generate quotation/invoice, approve, etc.) — each one
  re-derives the tenant from the session server-side, so a request can never act outside its own tenant.
- Recharts for dashboards, lucide-react icons.

## Getting started

```bash
npm install
cp .env.example .env
npm run db:push     # create the SQLite schema
npm run db:seed      # seed two demo tenants with a full populated lifecycle
npm run dev
```

Visit `http://localhost:3000`.

### Demo accounts

Password for every seeded user: **`Passw0rd!`**

| Role | Email |
|---|---|
| Company Admin | admin@brightpharma.com |
| Manager | manager@brightpharma.com |
| Sales Executive | sales@brightpharma.com |
| Marketing Executive | marketing@brightpharma.com |
| Trainer | trainer@brightpharma.com |
| Finance | finance@brightpharma.com |
| Viewer | viewer@brightpharma.com |
| Super Admin (platform) | superadmin@leadflow.com |

A second tenant (`vertexsoft`, on Starter/Trial) exists with the same role emails under `@vertexsoft.com`, to
demonstrate tenant isolation — data never crosses between the two.

## Architecture notes

- **Tenant isolation**: every tenant-scoped Prisma query is filtered by `tenantId` taken from the server-side
  session (`requireTenantSession()` in `src/lib/session.ts`), never from client input. Roles and permissions are
  evaluated server-side (`src/lib/permissions.ts`) before any mutation runs.
- **Lead ≠ Opportunity ≠ Customer**: a `Lead` can spawn multiple `Opportunity` records against the same
  `Customer`, and each Opportunity is either a `SERVICE` or `TRAINING` engagement with its own delivery model
  (`Service` / `TrainingProgram`) — they are not fields bolted onto the lead.
- **Pipeline** stages are per-tenant rows (`PipelineStage`) seeded with sane defaults on registration, so a tenant
  admin can reorder/rename stages without a code change.
- **Full lifecycle audit**: status changes, approvals, invoices and payments write to `AuditLog`.

## Scope

This build implements the Phase 1 MVP scope from the product brief: landing page, registration/auth, multi-tenancy,
RBAC, dashboard, leads, customers/contacts, opportunities, pipeline, activities/follow-ups, calendar, service &
training management, quotations, invoices/payments, approvals, notifications, audit log, reports (with CSV export)
and global search, a Super Admin platform console, with realistic seeded data across the full lead → delivery →
invoice → payment journey. Phase 2 items (automation *execution* engine — the `AutomationRule` model and its rows
exist, but nothing evaluates them yet — real email/SMS/WhatsApp delivery, calendar/Zoom integrations, subscription
billing) and Phase 3 (AI scoring, forecasting) are intentionally out of scope for this pass — the data model
(`AutomationRule`, `Document`, `Approval`) already has room for them.

### Verified end-to-end

Login → create lead → convert to opportunity → drag through the Kanban pipeline → manager approval on a
high-value deal (auto-creates the Service/Training fulfillment record on approval) → quotation → generate
invoice → record payment → customer timeline reflects every step. Tenant isolation was verified by attempting
cross-tenant access by record ID (404s) and confirming the two seeded tenants never share rows.
