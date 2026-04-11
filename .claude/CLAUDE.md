# CLAUDE.md

This file configures Claude Code for BWGX.

**BWGX** = **B**uild · **W**ave · **G**ate · e**X**ecute — AI-Orchestrated Development.

---

<!-- BWGX-MANAGED-START: project-context -->
## Project Context

**Description:** Ver PRD em PRD.md
**PRD:** `PRD.md`
<!-- BWGX-MANAGED-END: project-context -->

---

<!-- BWGX-MANAGED-START: agents -->
## Agents

Activate with `@agent-name` (e.g., `@build`, `@check`). Start with `/BWGX:start`.

| Agent | Role | Exclusive Authority |
|-------|------|-------------------|
| `@build` | Implementation, code writing | `git add`, `git commit` |
| `@check` | Tests, quality, code review | Quality verdicts (PASS/FAIL) |
| `@think` | Architecture, planning, research | Architecture decisions |
| `@own` | Stories, backlog, requirements | Story creation & AC |
| `@ship` | CI/CD, deploys, releases | **`git push`, PR/merge** |
| `@data` | Database design, migrations | DDL, RLS, indexes |

**Agent commands** (use `*` prefix):
- `*help` — Show available commands
- `*develop` / `*implement` — Start implementation
- `*status` — Current status (git, story, cycle)
- `*exit` — Exit agent mode
<!-- BWGX-MANAGED-END: agents -->

---

<!-- BWGX-MANAGED-START: cycles -->
## The 6 Cycles

| Cycle | Description |
|-------|-------------|
| `feature.cycle` | Build a new feature (primary flow) |
| `fix.cycle` | Quick bug fix |
| `spec.cycle` | Transform requirements into executable spec |
| `review.cycle` | Iterative QA review loop (max 5×) |
| `discover.cycle` | Assess existing codebase (brownfield) |
| `ship.cycle` | Explicit deploy: push, PR, release |

### Execution Flow

```
User Intent
    │
    ▼
Cycle Selected ──→ Gate A ──FAIL──→ Fix + retry
                       │
                     PASS
                       │
                    Wave 1 ──→ [steps]
                    Wave 2 ──→ [steps]
                       │
                    Gate B ──FAIL──→ @build fixes, retry (max 3×)
                       │
                     PASS
                       │
                   Cycle Complete
```
<!-- BWGX-MANAGED-END: cycles -->

---

<!-- BWGX-MANAGED-START: quality-gates -->
## Quality Gates

**Gate A (Pre-Cycle):**
- Story exists with acceptance criteria defined
- Branch follows convention (`feat/`, `fix/`, `chore/`)
- No uncommitted changes from previous cycle

**Gate B (Post-Cycle):**
```bash
npm run lint       # 0 errors
npm run typecheck  # 0 errors
npm test           # all pass
npm run build      # success
```
<!-- BWGX-MANAGED-END: quality-gates -->

---

<!-- BWGX-MANAGED-START: agent-authority -->
## Agent Authority

| Operation | Authorized Agent | Others |
|-----------|-----------------|--------|
| `git push`, PR create/merge | `@ship` ONLY | BLOCKED |
| Releases and tags | `@ship` ONLY | BLOCKED |
| `git add`, `git commit` | `@build` | Standard |
| Architecture decisions | `@think` | Consult only |
| Quality verdicts | `@check` | Consult only |
| Story creation | `@own` | Consult only |
| DDL / RLS / migrations | `@data` | Consult only |
<!-- BWGX-MANAGED-END: agent-authority -->

---

<!-- BWGX-MANAGED-START: workflow -->
## Development Workflow

1. **Create story** — `@own *create` (in `docs/stories/`)
2. **Gate A** — Story valid? Correct branch? Env ready?
3. **Implement** — `@build *develop`
4. **Gate B** — lint + typecheck + tests + build
5. **Ship** — `@ship *push` then `@ship *pr`

Story status: `Draft → Ready → InProgress → InReview → Done`

**Commit format:**
```
feat: implement login flow
fix: resolve null pointer in auth
docs: update API reference
chore: upgrade dependencies
```
<!-- BWGX-MANAGED-END: workflow -->

---

*BWGX v1.0.0 — CLI First · Agent-Driven · Quality First*
