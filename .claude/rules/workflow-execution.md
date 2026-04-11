# Workflow Execution — Detailed Rules

## 4 Primary Workflows

### 1. Feature Cycle — PRIMARY

**Full 4-phase workflow for all development work.**

#### Phase 1: Create (@own)
- **Inputs:** PRD, epic context, or user description
- **Output:** `{epicNum}.{storyNum}.story.md`
- **Status:** Draft

#### Phase 2: Validate (@own)
- **10-point checklist** (see `story-lifecycle.md`)
- **Decision:** GO (>=7) or NO-GO (required fixes listed)

#### Phase 3: Implement (@build)
- **Modes:** Interactive / YOLO / Pre-Flight
- **CodeRabbit:** Self-healing max 2 iterations
- **Status:** Ready → InProgress

#### Phase 4: QA Gate (@check)
- **7 quality checks** (see `story-lifecycle.md`)
- **Decision:** PASS / CONCERNS / FAIL / WAIVED
- **Status:** InProgress → InReview → Done

---

### 2. QA Loop — ITERATIVE REVIEW

**Automated review-fix cycle after initial QA gate.**

```
@check review → verdict → @build fixes → re-review (max 5)
```

**Commands:**
- `*qa-loop {storyId}` — Start loop
- `*qa-loop-review` — Resume from review
- `*qa-loop-fix` — Resume from fix
- `*stop-qa-loop` — Pause, save state
- `*resume-qa-loop` — Resume from state
- `*escalate-qa-loop` — Force escalation

**Config:**
- Max iterations: 5
- Status file: `qa/loop-status.json`

**Verdicts:**
- APPROVE → Complete, mark Done
- REJECT → @build fixes, re-review
- BLOCKED → Escalate immediately

**Escalation triggers:**
- `max_iterations_reached`
- `verdict_blocked`
- `fix_failure`
- `manual_escalate`

---

### 3. Spec Pipeline — PRE-IMPLEMENTATION

**Transform informal requirements into executable spec.**

| Phase | Agent | Output | Skip If |
|-------|-------|--------|---------|
| 1. Gather | @think | `requirements.json` | Never |
| 2. Assess | @think | `complexity.json` | source=simple |
| 3. Research | @think | `research.json` | SIMPLE class |
| 4. Write Spec | @think | `spec.md` | Never |
| 5. Critique | @check | `critique.json` | Never |
| 6. Plan | @think | `implementation.yaml` | If APPROVED |

**Complexity Classes:**

| Score | Class | Phases |
|-------|-------|--------|
| <= 8 | SIMPLE | gather → spec → critique (3) |
| 9-15 | STANDARD | All 6 phases |
| >= 16 | COMPLEX | 6 phases + revision cycle |

**5 Complexity Dimensions (scored 1-5):**
- **Scope:** Files affected
- **Integration:** External APIs
- **Infrastructure:** Changes needed
- **Knowledge:** Team familiarity
- **Risk:** Criticality level

**Critique Verdicts:**

| Verdict | Average Score | Next Step |
|---------|--------------|-----------|
| APPROVED | >= 4.0 | Plan (Phase 6) |
| NEEDS_REVISION | 3.0-3.9 | Revise (Phase 5b) |
| BLOCKED | < 3.0 | Escalate to @think |

**Constitutional Gate (Article IV — No Invention):**
Every statement in spec.md MUST trace to FR-*, NFR-*, CON-*, or research finding. NO invented features.

---

### 4. Brownfield Discovery — LEGACY ASSESSMENT

**10-phase technical debt assessment for existing codebases.**

**Data Collection (Phases 1-3):**
- Phase 1: @think → `system-architecture.md`
- Phase 2: @data → `SCHEMA.md` + `DB-AUDIT.md` (if DB exists)
- Phase 3: @think → `frontend-spec.md`

**Draft & Validation (Phases 4-7):**
- Phase 4: @think → `technical-debt-DRAFT.md`
- Phase 5: @data → `db-specialist-review.md`
- Phase 6: @think → `ux-specialist-review.md`
- Phase 7: @check → `qa-review.md` (QA Gate: APPROVED | NEEDS WORK)

**Finalization (Phases 8-10):**
- Phase 8: @think → `technical-debt-assessment.md` (final)
- Phase 9: @think → `TECHNICAL-DEBT-REPORT.md` (executive)
- Phase 10: @own → Epic + stories ready for development

**QA Gate (Phase 7):**
- **APPROVED:** All debits validated, no critical gaps, dependencies mapped
- **NEEDS WORK:** Gaps not addressed, return to Phase 4

---

## Workflow Selection Guide

| Situation | Workflow |
|-----------|---------|
| New story from epic | Story Development Cycle |
| QA found issues, need iteration | QA Loop |
| Complex feature needs spec | Spec Pipeline → then SDC |
| Joining existing project | Brownfield Discovery |
| Simple bug fix | SDC only (YOLO mode) |
