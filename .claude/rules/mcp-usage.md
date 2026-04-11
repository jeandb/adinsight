# MCP Server Usage Rules — BWGX

## MCP Governance

All MCP infrastructure management is handled **EXCLUSIVELY** by `@ship`.

| Operation | Agent | Command |
|-----------|-------|---------|
| Add MCP server | @ship | `*mcp-add {name}` |
| Remove MCP server | @ship | `*mcp-remove {name}` |
| List enabled MCPs | @ship | `*mcp-list` |
| Configure MCP | @ship | `*mcp-configure {name}` |

Other agents (`@build`, `@check`, `@think`, `@own`, `@data`) are MCP **consumers**, not administrators. If MCP management is needed, delegate to @ship.

---

## Tool Selection Priority

**Always prefer native Claude Code tools over MCP servers:**

| Task | USE THIS | NOT MCP |
|------|----------|---------|
| Read files | `Read` tool | any MCP file tool |
| Write files | `Write` / `Edit` tools | any MCP file tool |
| Run commands | `Bash` tool | any MCP shell tool |
| Search files | `Glob` tool | any MCP search tool |
| Search content | `Grep` tool | any MCP search tool |

Use MCP tools only when the task genuinely requires capabilities unavailable in native tools (e.g., external API access, browser automation, database connections).

---

## Common MCP Categories

### Browser / UI Testing
Use when: user asks for browser automation, screenshots, or web interaction.
Never use for: general file or shell operations.

### Web Search / Research
Use when: up-to-date information from the web is needed.
Never use for: searching local files.

### Library Documentation
Use when: API reference for a package is needed.
Native alternative: `Grep` the installed source or check `node_modules`.

### Database
Use when: direct database connection is required.
@data agent coordinates all database MCP usage.

---

## Graceful Degradation

If an MCP server is unavailable:
1. Fall back to native tools where possible
2. Inform the user if the task cannot be completed without the MCP
3. Never block development — find a workaround or document the gap

---

## Adding a New MCP

Only @ship can add MCPs. When requested by another agent:
1. Document what the MCP provides and why it's needed
2. Delegate to @ship: "Run `@ship *mcp-add {name}` to install this"
3. Do not attempt to modify MCP configuration files directly
