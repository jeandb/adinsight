---
paths:
  - "docs/stories/**"
  - ".claude/commands/**"
---

# Agent Authority — Detailed Rules

## Delegation Matrix

### @ship — EXCLUSIVE Authority

| Operation | Exclusive? | Other Agents |
|-----------|-----------|--------------|
| `git push` / `git push --force` | YES | BLOCKED |
| `gh pr create` / `gh pr merge` | YES | BLOCKED |
| MCP add/remove/configure | YES | BLOCKED |
| CI/CD pipeline management | YES | BLOCKED |
| Release management and tags | YES | BLOCKED |

### @own — Story & Backlog Authority

| Operation | Exclusive? | Details |
|-----------|-----------|---------|
| `*create` / `*draft` story | YES | From PRD/epic context |
| Story AC, scope, title edits | YES | Only @own modifies these |
| Backlog prioritization | YES | — |
| Story status transitions | YES | Draft → Ready |

### @build — Implementation Authority

| Allowed | Blocked |
|---------|---------|
| `git add`, `git commit`, `git branch`, `git checkout` | `git push` (delegate to @ship) |
| `git stash`, `git diff`, `git log`, `git status` | `gh pr create/merge` (delegate to @ship) |
| Create, edit, delete project files | MCP management |
| Update story checkboxes `[ ]` → `[x]` and File List | Story AC, scope, or title |

### @check — Quality Authority

| Owns | Does NOT Own |
|------|-------------|
| Quality verdicts (PASS / FAIL / CONCERNS / WAIVED) | Implementation decisions |
| Test execution and coverage analysis | Architecture choices |
| Code review and standards enforcement | Git operations |
| Gate B validation | — |

### @think — Architecture Authority

| Owns | Delegates To |
|------|-------------|
| System architecture decisions | @data (detailed DDL) |
| Technology selection | @build (implementation) |
| Spec writing and requirements | — |
| Research and investigation | — |
| Complexity assessment | — |

### @data — Database Authority

| Owns (delegated from @think) | Does NOT Own |
|------------------------------|-------------|
| Schema design and DDL | System architecture |
| Query optimization | Application code |
| RLS policies | Git operations |
| Index strategy | Frontend/UI |
| Migration planning and execution | — |

---

## Cross-Agent Delegation Patterns

### Git Push Flow
```
ANY agent → delegate to @ship *push
```

### Story Flow
```
@own *create → @build *develop → @check *review → @ship *push
```

### Schema Design Flow
```
@think (decides technology) → @data (implements DDL)
```

### Feature Cycle Flow
```
@own *create → Gate A → @build *develop → Gate B → @ship *push → @ship *pr
```

---

## Escalation Rules

1. Agent cannot complete task → Escalate to user
2. Quality gate fails → Return to @build with specific feedback
3. Constitutional violation detected → BLOCK, require fix before proceed
4. Agent boundary conflict → User mediates
5. External API blocker (2 failed attempts) → @think *investigate
