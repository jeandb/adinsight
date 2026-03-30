# AdInsight — Monorepo Root

## What is AdInsight

AdInsight is an internal SaaS dashboard for Prof Jaque Mendes that centralizes:
- **Ad campaign performance** from Meta, Google, TikTok, and Pinterest
- **WooCommerce revenue** from Loja das Profs, Clube das Profs, and Tudo de Prof
- **AI-powered analysis** via a multi-skill agent (AdInsight Analyst)

**PRD:** `PRD.md` — requisitos completos do produto.
**Roadmap:** `docs/ROADMAP.md` — divisão do PRD em etapas de implementação com status de cada uma.

---

## Monorepo Structure

```
adinsight/
├── CLAUDE.md                        ← this file — global context
├── apps/
│   ├── api/                         ← backend (Node.js + TypeScript + Express)
│   │   └── CLAUDE.md                ← backend-specific context
│   └── web/                         ← frontend (React + TypeScript + Vite)
│       └── CLAUDE.md                ← frontend-specific context
├── packages/
│   └── shared-types/                ← TypeScript interfaces used by both apps
│       └── src/
│           ├── campaign.types.ts
│           ├── user.types.ts
│           ├── platform.types.ts
│           ├── woocommerce.types.ts
│           ├── ai.types.ts
│           └── index.ts
├── .claude/
│   └── skills/                      ← AdInsight Analyst skills (AI product)
│       ├── business-context/
│       ├── campaign-performance-analyst/
│       ├── budget-optimizer/
│       ├── creative-analyzer/
│       ├── copy-reviewer/
│       ├── report-generator/
│       ├── period-comparator/
│       └── cross-data-analyst/
├── docs/
│   ├── PRD_AdInsight_ProfJaqueMendes.md
│   └── SPEC_AdInsight.md
├── docker-compose.yml               ← local dev: API + Web + PostgreSQL + Redis
├── docker-compose.prod.yml
├── package.json                     ← pnpm workspace root
└── pnpm-workspace.yaml
```

---

## CLAUDE.md Hierarchy

This file is the **first** CLAUDE.md Claude Code reads. Each app also has its own,
read in addition to this one when working inside that app:

| When working in... | Claude Code reads... |
|---|---|
| Anywhere in the monorepo | `adinsight/CLAUDE.md` (this file) |
| `apps/api/` | This file + `apps/api/CLAUDE.md` |
| `apps/web/` | This file + `apps/web/CLAUDE.md` |

**Always read the app-specific CLAUDE.md before working in that app.**
This file provides global context; the app-specific files provide operational detail.

---

## Two Types of Skills — Do Not Confuse Them

This monorepo contains two completely different uses of the word "skill":

### 1. AdInsight Analyst Skills (AI product — `.claude/skills/`)
These are the skills that power the AI module inside the AdInsight product.
They are `SKILL.md` files loaded at runtime by the `skill-composer` to guide
the LLM when analyzing campaigns, creatives, copy, and budgets.

```
.claude/skills/
  business-context/SKILL.md        ← always injected
  campaign-performance-analyst/    ← activated by intent
  budget-optimizer/
  creative-analyzer/
  copy-reviewer/
  report-generator/
  period-comparator/
  cross-data-analyst/
```

**These are the product.** They live in the root `.claude/skills/` because they
are part of the AdInsight system, not development tooling.

### 2. Development Skills (`apps/api/.claude/skills/` and `apps/web/.claude/skills/`)
These are skills that help Claude Code write better code for this project.
They contain context about the WooCommerce integrations, the LLM Adapter pattern,
security requirements, and so on.

**These are development tools.** They live inside each app's `.claude/skills/`.

---

## Global Architecture Decisions

These decisions apply to both apps and must not be reversed without a formal
change request documented in the PRD:

| Decision | Rule |
|---|---|
| **Language** | All code, variables, functions, routes, and comments in English |
| **Shared types** | TypeScript interfaces used by both apps live in `packages/shared-types` |
| **LLM calls** | Always via `apps/api/src/modules/ai/llm-adapter/` — never import LLM SDKs directly elsewhere |
| **Skill prompts** | Always built via `apps/api/src/modules/ai/skill-composer/` — never inline |
| **API keys** | Always encrypted with AES-256 before storing in the database |
| **Real-time updates** | WebSocket only — no frontend polling |
| **Dashboard filters** | Always persisted in the URL as query params |
| **Cache first** | Campaign data served from PostgreSQL cache — no live calls to ad platform APIs during user requests |

---

## Shared Types (`packages/shared-types`)

Interfaces defined once, imported by both `apps/api` and `apps/web`.
This is the **single source of truth** for the data contracts between frontend and backend.

```typescript
// Import in either app
import type { Campaign, CampaignStatus, UserRole } from '@adinsight/shared-types'
```

**Rule:** if a TypeScript interface is used in both apps, it belongs in `packages/shared-types`.
If it is only used in one app, it stays local to that app.

When adding a new shared type:
1. Add to the appropriate file in `packages/shared-types/src/`
2. Export from `packages/shared-types/src/index.ts`
3. Import via `@adinsight/shared-types` in both apps

---

## Local Development

```bash
# Install all dependencies (root + all apps + packages)
pnpm install

# Start everything (API + Web + PostgreSQL + Redis)
docker-compose up -d        # starts PostgreSQL and Redis
pnpm --filter api dev       # starts backend on :3000
pnpm --filter web dev       # starts frontend on :5173

# Or start all apps at once
pnpm dev

# Build
pnpm build                  # build all apps
pnpm --filter api build
pnpm --filter web build

# Type checking and linting
pnpm type-check             # TypeScript check across all workspaces
pnpm lint                   # ESLint across all workspaces

# Tests
pnpm --filter api test              # all backend tests (Jest)
pnpm --filter api test [path]       # single file or folder
pnpm --filter web test              # all frontend tests (Vitest)

# Database (run from apps/api)
pnpm --filter api db:migrate        # apply pending SQL migrations
pnpm --filter api db:rollback       # revert last migration
pnpm --filter api db:seed           # populate with sample data
pnpm --filter api db:status         # list applied migrations
```

**Ports:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## Business Context (for code decisions)

Prof Jaque Mendes operates:
- **Loja das Profs** — WooCommerce store selling pedagogical PDF infoproducts
- **Clube das Profs** — Annual subscription (WooCommerce + YITH) for full catalog access
- **Tudo de Prof** — Pedagogical marketplace (WooCommerce + WCFM), Prof Jaque is admin and seller
- **Mentoria Do Giz ao Digital** — Training program, no payment integration yet

Target audience: Brazilian elementary school teachers, 25–45 years old.
All user-facing output from the AI module must be in Brazilian Portuguese (pt-BR).
All code must be in English.

---

## Slash Commands Available

| Comando            | Descrição                                      |
|--------------------|------------------------------------------------|
| `/migrar-db`       | Aplicar migrações SQL pendentes                |
| `/seed-db`         | Popular banco com dados de exemplo             |
| `/status-projeto`  | Resumo do estado atual do projeto              |
| `/revisar-codigo`  | Revisão de código de um arquivo ou pasta       |

---

## What NOT to Do (global rules)

- Do not import LLM SDKs (Anthropic, OpenAI, Google) outside `apps/api/src/modules/ai/llm-adapter/`
- Do not duplicate TypeScript interfaces that exist in `packages/shared-types`
- Do not hardcode credentials, API keys, or secrets anywhere in the codebase
- Do not add new dependencies to the workspace root `package.json` — add to the specific app
- Do not modify `.claude/skills/` (AI product skills) when working on development tooling
- Do not confuse `apps/api/.claude/skills/` (dev tools) with `.claude/skills/` (AI product)
