---
paths:
  - "docs/stories/**"
---

# Story Lifecycle — Detailed Rules

## Status Progression

```
Draft → Ready → InProgress → InReview → Done
```

| Status | Trigger | Agent | Action |
|--------|---------|-------|--------|
| Draft | @own creates story | @own | Story file created |
| Ready | @own validates (GO) | @own | **MUST update status field from Draft → Ready** |
| InProgress | @build starts implementation | @build | Update status field |
| InReview | @build completes, @check reviews | @check | Update status field |
| Done | @check PASS, @ship pushes | @ship | Update status field |

**CRITICAL:** The `Draft → Ready` transition is the responsibility of @own during `*validate`. When verdict is GO, @own MUST update the story's Status field to `Ready` and log the transition in the Change Log. A story left in `Draft` after a GO verdict is a process violation.

---

## Phase 1: Create (@own)

**Command:** `*create`
**Inputs:** PRD, epic context, or user description
**Output:** `docs/stories/{epicNum}.{storyNum}.story.md`

### Story Template Structure

```markdown
# Story {ID}: {Title}

**Status:** Draft
**Epic:** {epic reference}
**Points:** {S/M/L or number}

## Description
{What needs to be built and why}

## Acceptance Criteria
- [ ] AC1: ...
- [ ] AC2: ...

## Scope
**IN:** ...
**OUT:** ...

## Dependencies
- {prerequisite stories or resources}

## File List
{Updated by @build during implementation}

## Change Log
| Date | Agent | Action |
|------|-------|--------|
```

---

## Phase 2: Validate (@own)

**Command:** `*validate`

### 10-Point Validation Checklist

1. Clear and objective title
2. Complete description (problem/need explained)
3. Testable acceptance criteria (Given/When/Then preferred)
4. Well-defined scope (IN and OUT clearly listed)
5. Dependencies mapped (prerequisite stories/resources)
6. Complexity estimate (points or T-shirt sizing)
7. Business value (benefit to user/business clear)
8. Risks documented (potential problems identified)
9. Criteria of Done (clear definition of complete)
10. Alignment with PRD/Epic (consistency with source docs)

**Decision:** GO (≥7/10) → set status Ready | NO-GO (<7/10) → list required fixes

---

## Phase 3: Implement (@build)

**Command:** `*develop`

### Execution Modes

**YOLO (autonomous):**
- 0-1 prompts
- Best for: simple, deterministic tasks

**Interactive (default):**
- Confirmations at key decision points
- Best for: learning, complex decisions

**Pre-Flight (plan-first):**
- All questions upfront, then zero-ambiguity execution
- Best for: ambiguous requirements, critical work

---

## Phase 4: Review (@check)

**Command:** `*review {storyId}`

### 7 Quality Checks

1. **Code review** — patterns, readability, maintainability
2. **Unit tests** — adequate coverage, all passing
3. **Acceptance criteria** — all met per story AC
4. **No regressions** — existing functionality preserved
5. **Performance** — within acceptable limits
6. **Security** — OWASP basics verified
7. **Documentation** — updated if necessary

### Gate Decisions

| Decision | Condition | Action |
|----------|-----------|--------|
| PASS | All checks OK | Approve, proceed to @ship |
| CONCERNS | Minor issues | Approve with observations documented |
| FAIL | HIGH/CRITICAL issues | Return to @build with feedback |
| WAIVED | Issues accepted by stakeholder | Approve with waiver documented |

---

## Story File Update Rules

| Section | Who Can Edit |
|---------|-------------|
| Title, Description, AC, Scope | @own only |
| File List, Dev Notes, checkboxes | @build |
| QA Results | @check only |
| Change Log | Any agent (append only) |
