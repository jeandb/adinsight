# AdInsight — Backend (apps/api)

## Project Overview

AdInsight is an internal SaaS dashboard for Prof Jaque Mendes that centralizes
ad campaign performance data (Meta, Google, TikTok, Pinterest), WooCommerce
revenue from three stores, and AI-powered analysis via a multi-skill agent.

**Stack:** Node.js + TypeScript + Express + PostgreSQL + Redis + BullMQ
**Monorepo path:** `apps/api/` (este arquivo)
**Companion app:** `apps/web/`
**Shared types:** `packages/shared-types/`
**PRD:** `PRD.md` (na raiz do monorepo)
**Root CLAUDE.md:** `CLAUDE.md` (leia primeiro — contém decisões globais)

---

## Directory Structure (within monorepo)

```
adinsight/apps/api/
├── src/
│   ├── modules/                  # Feature modules (main domain logic)
│   │   ├── auth/                 # JWT auth, first-access setup, user management
│   │   ├── users/                # User CRUD, roles, permissions
│   │   ├── channels/             # Business channels (Loja das Profs, Clube, etc.)
│   │   ├── campaigns/            # Campaign data, channel association, sync
│   │   ├── platforms/            # Ad platform credentials and connection status
│   │   │   ├── meta/             # Meta Ads API adapter
│   │   │   ├── google/           # Google Ads API adapter
│   │   │   ├── tiktok/           # TikTok Ads API adapter
│   │   │   └── pinterest/        # Pinterest Ads API adapter
│   │   ├── woocommerce/          # WooCommerce integrations
│   │   │   ├── loja-das-profs/   # lojadasprofs.com.br adapter
│   │   │   ├── clube-das-profs/  # clubedasprofs.com.br + YITH adapter
│   │   │   └── tudo-de-prof/     # tudodeprof.com.br + WCFM adapter
│   │   ├── ai/                   # AI module
│   │   │   ├── llm-adapter/      # Provider abstraction (Claude, OpenAI, Gemini)
│   │   │   ├── skill-composer/   # Builds prompts by combining skills
│   │   │   ├── intent-detector/  # Detects which skills to activate per request
│   │   │   ├── skills/           # Skill .md files (business-context, etc.)
│   │   │   └── history/          # AI interaction history storage
│   │   ├── alerts/               # Alert rules, evaluation, notification dispatch
│   │   └── reports/              # Scheduled reports, PDF/CSV export generation
│   ├── shared/                   # Genuinely cross-module code
│   │   ├── database/             # PostgreSQL client, migrations, seeds
│   │   ├── cache/                # Redis client and cache helpers
│   │   ├── queue/                # BullMQ queue definitions and worker setup
│   │   ├── websocket/            # WebSocket server and event emitters
│   │   ├── crypto/               # AES-256 encryption/decryption for API keys
│   │   ├── mailer/               # Email sending (Nodemailer/SendGrid)
│   │   ├── middleware/           # Auth guard, rate limiter, error handler
│   │   ├── types/                # Global TypeScript interfaces and enums
│   │   └── utils/                # Pure utility functions (date, format, etc.)
│   ├── config/                   # Environment config, constants
│   └── app.ts                    # Express app setup
├── .claude/
│   └── skills/                   # Dev skills for this app (not AI product skills)
├── tests/
│   ├── unit/
│   └── integration/
├── docker-compose.yml
├── CLAUDE.md                     # This file
└── package.json
```

---

## Module Internal Structure

Every module follows the same internal layer pattern:

```
modules/campaigns/
├── campaigns.controller.ts   # HTTP handlers — validates input, calls service
├── campaigns.service.ts      # Business logic — orchestrates repositories and adapters
├── campaigns.repository.ts   # Database queries — raw SQL or query builder
├── campaigns.routes.ts       # Express router — maps HTTP methods to controller
├── campaigns.types.ts        # Module-specific TypeScript interfaces
└── index.ts                  # Public exports for the module
```

**Rules:**
- Controllers never contain business logic — delegate to service immediately
- Services never write raw SQL — delegate to repository
- Repositories never call external APIs — only database operations
- Types file contains only interfaces/types, no logic

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Module files | `[module].[layer].ts` | `campaigns.service.ts` |
| Shared utilities | `kebab-case.ts` | `date-helpers.ts` |
| Type/interface files | `[module].types.ts` | `campaigns.types.ts` |
| Test files | `[filename].test.ts` | `campaigns.service.test.ts` |
| Migration files | `YYYYMMDD_description.sql` | `20250601_create_campaigns.sql` |
| Skill files | `SKILL.md` inside named folder | `skills/business-context/SKILL.md` |

---

## Naming Conventions (Code)

```typescript
// Variables and functions: camelCase
const campaignData = await campaignService.findById(id)
function formatCurrency(value: number): string {}

// Classes and interfaces: PascalCase
class LlmAdapter {}
interface CampaignMetrics {}

// Constants and env vars: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3
process.env.DATABASE_URL

// Database tables: snake_case (plural)
// campaigns, ad_platforms, business_channels, ai_providers, woo_orders

// Database columns: snake_case
// created_at, provider_id, roas_value, access_token_encrypted

// REST routes: kebab-case (plural nouns)
// GET /api/campaigns
// GET /api/business-channels
// POST /api/ai-providers
// GET /api/woo-stores/:id/orders
```

---

## API Design Rules

### Route Structure
```
/api/auth/*           — authentication endpoints
/api/users/*          — user management (admin only)
/api/platforms/*      — ad platform credentials
/api/business-channels/* — channel management
/api/campaigns/*      — campaign data and sync
/api/woo-stores/*     — WooCommerce integrations
/api/ai/*             — AI chat, analysis, providers, history
/api/alerts/*         — alert rules and notifications
/api/reports/*        — report generation and scheduling
/api/dashboard/*      — aggregated dashboard data endpoints
```

### Response Envelope
All API responses must follow this structure:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: { page, total, limit }   // for paginated responses
}

// Error
{
  success: false,
  error: {
    code: string,       // machine-readable: "INVALID_TOKEN", "NOT_FOUND"
    message: string,    // human-readable
    details?: unknown   // validation errors, stack (dev only)
  }
}
```

### HTTP Status Codes
- `200` — success (GET, PUT, PATCH)
- `201` — resource created (POST)
- `204` — success, no content (DELETE)
- `400` — validation error
- `401` — not authenticated
- `403` — authenticated but not authorized
- `404` — resource not found
- `422` — business logic error (e.g., platform connection failed)
- `429` — rate limited
- `500` — unexpected server error

---

## WebSocket Events

The WebSocket server emits real-time events to connected clients:

```typescript
// Sync status updates
'sync:started'    { platformId, platformName }
'sync:completed'  { platformId, recordsUpdated, timestamp }
'sync:failed'     { platformId, error }

// Alert notifications
'alert:triggered' { alertId, type, campaignId, message }

// AI analysis updates
'ai:analysis:ready'  { analysisId, type }

// Dashboard data refresh signals
'dashboard:refresh'  { scope: 'campaigns' | 'revenue' | 'all' }
```

Clients subscribe to events by authenticated user session.
Never send sensitive data (API keys, tokens) over WebSocket.

---

## Database Conventions

### Migrations
- Location: `src/shared/database/migrations/`
- Naming: `YYYYMMDD_HHMMSS_description.sql`
- Always include both `up` and `down` scripts
- Never modify an existing migration — create a new one

### Standard Columns (all tables must have these)
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Encrypted Fields
Any field storing sensitive credentials must:
1. Use column suffix `_encrypted` (e.g., `access_token_encrypted`)
2. Be encrypted via `src/shared/crypto/` before INSERT/UPDATE
3. Never be returned raw in API responses — always masked as `••••••••`

---

## Security Rules

These are non-negotiable and must be applied in every relevant context:

- **Never log API keys, tokens, or passwords** — not even partially
- **Never return encrypted fields** in API responses — mask them
- **Always validate and sanitize** request input before passing to service
- **Always check authorization** in the controller before calling service
- **Rate limit** all auth endpoints: max 5 attempts / 10 min per IP
- **bcrypt cost factor: minimum 12** for all password hashing
- **JWT expiry: 8 hours** for access token, 30 days for refresh token
- **AES-256-GCM** for all stored credentials

---

## Shared Types

Import shared TypeScript interfaces from the monorepo package — never duplicate them:

```typescript
// ✅ CORRECT — use shared types package
import type { Campaign, UserRole, PlatformType } from '@adinsight/shared-types'

// ❌ WRONG — never redefine types that exist in shared-types
interface Campaign { ... }
```

Shared types live in .
When adding a new type needed by both API and Web, add it there.

---

## LLM Adapter — Critical Architecture Rule

The `src/modules/ai/llm-adapter/` is the **only place** that may call external
LLM provider APIs (Anthropic, OpenAI, Google). No other module or service may
import an LLM SDK directly.

```typescript
// ✅ CORRECT — always go through the adapter
import { llmAdapter } from '@/modules/ai/llm-adapter'  // always relative within apps/api/src
const response = await llmAdapter.chat(messages, { scenario: 'chat' })

// ❌ WRONG — never import SDK directly outside the adapter
import Anthropic from '@anthropic-ai/sdk'
```

The active provider for each scenario is read from the database at runtime,
not hardcoded. Changing the LLM requires zero code changes.

---

## Ad Platform Adapters — Pattern

Each platform adapter in `src/modules/platforms/[platform]/` must export:

```typescript
interface PlatformAdapter {
  testConnection(credentials: PlatformCredentials): Promise<ConnectionResult>
  syncCampaigns(credentials: PlatformCredentials, dateRange: DateRange): Promise<CampaignData[]>
  syncMetrics(credentials: PlatformCredentials, campaignIds: string[], dateRange: DateRange): Promise<MetricsData[]>
}
```

Adding a new platform = create a new folder implementing this interface.
No changes to any other module required.

---

## Queue and Jobs

Jobs are defined in `src/shared/queue/` and processors live in their
respective module:

```
Queue: 'sync-campaigns'     → processor: modules/campaigns/campaigns.processor.ts
Queue: 'sync-woocommerce'   → processor: modules/woocommerce/woo.processor.ts
Queue: 'ai-analysis'        → processor: modules/ai/ai.processor.ts
Queue: 'send-report'        → processor: modules/reports/reports.processor.ts
Queue: 'send-alert'         → processor: modules/alerts/alerts.processor.ts
```

Scheduled jobs (cron) are registered in `src/config/scheduler.ts`.

---

## Environment Variables

Required vars (must exist in `.env` and be documented in `.env.example`):

```bash
# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
BCRYPT_ROUNDS=12

# Encryption
ENCRYPTION_KEY=          # 32-byte hex key for AES-256-GCM

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# App
PORT=3000
NODE_ENV=development|production
FRONTEND_URL=            # for CORS
```

LLM API keys and ad platform credentials are stored in the database
(encrypted), not in environment variables.

---

## What NOT to Do

- Do not put business logic in controllers
- Do not write raw SQL outside repository files
- Do not import LLM SDKs outside `modules/ai/llm-adapter/`
- Do not hardcode credentials, API keys, or secrets anywhere
- Do not skip input validation on any endpoint
- Do not return `500` for expected business errors — use `422`
- Do not create a new module without following the standard internal structure
- Do not modify existing database migrations — always create new ones
- Do not send sensitive data over WebSocket
