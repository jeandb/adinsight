---
paths:
  - "packages/**"
  - "tests/**"
  - "src/**"
---

# CodeRabbit Integration — Detailed Rules

## Self-Healing Configuration

### Build Phase (@build — feature.cycle Wave 2)

```yaml
mode: light
max_iterations: 2
timeout_minutes: 30
severity_filter: [CRITICAL, HIGH]
behavior:
  CRITICAL: auto_fix
  HIGH: auto_fix (iteration < 2) else document_as_debt
  MEDIUM: document_as_debt
  LOW: ignore
```

**Flow:**
```
RUN CodeRabbit → CRITICAL found?
  YES → auto-fix (iteration < 2) → Re-run
  NO → Document HIGH as debt, proceed
After 2 iterations with CRITICAL → HALT, surface to user
```

### Review Phase (@check — review.cycle)

```yaml
mode: full
max_iterations: 3
timeout_minutes: 30
severity_filter: [CRITICAL, HIGH]
behavior:
  CRITICAL: auto_fix
  HIGH: auto_fix
  MEDIUM: document_as_debt
  LOW: ignore
```

**Flow:**
1. Pre-commit review scan
2. Self-healing loop (max 3 iterations)
3. Manual analysis (architectural, traceability, NFR)
4. Gate B decision (PASS / FAIL)

---

## Severity Handling Summary

| Severity | Build Phase | Review Phase |
|----------|-------------|-------------|
| CRITICAL | auto_fix, block if persists | auto_fix, block if persists |
| HIGH | auto_fix, document if fails | auto_fix, document if fails |
| MEDIUM | document_as_tech_debt | document_as_tech_debt |
| LOW | ignore | ignore |

---

## Execution

```bash
# Uncommitted changes scan
coderabbit --prompt-only -t uncommitted

# Compare against base branch
coderabbit --prompt-only --base main

# Self-healing mode (severity filter)
coderabbit --severity CRITICAL,HIGH --auto-fix
```

> **Windows users:** Prefix commands with `wsl bash -c '...'` if CodeRabbit runs in WSL.

---

## Integration Points

| Cycle | Phase | Trigger | Agent |
|-------|-------|---------|-------|
| `feature.cycle` | Wave 2 (build) | After implementation | @build |
| `review.cycle` | Wave 1 (review) | At review start | @check |
| `fix.cycle` | Wave 2 (verify) | After fix applied | @build |
| Any | Manual | `*coderabbit-review` command | Any |

---

## Focus Areas by Story Type

| Story Type | Primary Focus |
|-----------|--------------|
| Feature | Code patterns, test coverage, API design |
| Bug Fix | Regression risk, root cause coverage |
| Refactor | Breaking changes, interface stability |
| Database | SQL injection, RLS coverage, migration safety |

---

## Report Location

CodeRabbit reports saved to: `docs/qa/coderabbit-reports/`
