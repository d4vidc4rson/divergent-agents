# Plan: Create divergent-agents repo

## Context

We're building a new product that repackages the divergent thinking tools as **domain-specific agents** that work inside existing AI harnesses (Claude, ChatGPT, Gemini) via MCP. The core insight: people don't want "divergent thinking tools" — they want "AI that doesn't give me the same ideas as everyone else." This repo delivers that through two modes and domain agent system prompts.

The new repo lives at `/Volumes/Samsung_T5/divergent-agents`, cloned/adapted from the current `/Volumes/Samsung_T5/divergent-thinking-tools`.

## What We're Building

**Two MCP modes:**
- **Simple mode** — one `divergent_think` front-door tool (uses the Router skill internally). Works in main chat without a Project.
- **Pro mode** — 14 modular tools with clean names (`diagnose_problem`, `generate_diverse`, `audit_diversity`, etc.). Designed for use with domain agent system prompts in Claude Projects.

**One domain agent (MVP):**
- **Product (PM) Agent** — a system prompt users paste into Claude Project Instructions that orchestrates the pro tools for product management work.

## Repo Structure

```
/Volumes/Samsung_T5/divergent-agents/
├── README.md
├── LICENSE                          (MIT, copied)
├── .gitignore
├── railway.json
├── skills/                          (copied from divergent-thinking-tools)
│   ├── router/SKILL.md
│   ├── guilford-engine/SKILL.md
│   ├── think-wrong/SKILL.md
│   ├── anti-homogeneity-check/SKILL.md
│   ├── persona-divergence-engine/SKILL.md
│   ├── blind-spot-scan/SKILL.md
│   ├── wrong-problem-detector/SKILL.md
│   ├── short-think/SKILL.md
│   ├── wild-to-mild/SKILL.md
│   ├── bad-on-purpose/SKILL.md
│   ├── macgyver-mode/SKILL.md
│   ├── random-injection/SKILL.md
│   ├── strip-down/SKILL.md
│   ├── dumb-questions-engine/SKILL.md
│   └── de-slop/SKILL.md
├── agents/
│   └── product.md                   (PM domain agent system prompt)
└── mcp-server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                 (entry point: transport + MODE branching)
        ├── skills.ts                (skill loader, extracted from current index.ts)
        ├── tools-simple.ts          (registers single front-door tool)
        └── tools-pro.ts             (registers 14 modular tools)
```

## Implementation Steps

### Step 1: Scaffold the repo
- Create `/Volumes/Samsung_T5/divergent-agents/` directory structure
- Copy all 15 `skills/*/SKILL.md` files from original repo
- Copy `.gitignore`, `LICENSE`
- `git init`

### Step 2: Build `mcp-server/src/skills.ts`
Extract skill-loading logic from current `index.ts` (lines 14-67):
- `Skill` interface
- `parseFrontmatter()` function
- `loadSkills()` function (loads all skills)
- Add new `loadSkill(skillsDir, dirName)` function (loads one skill by directory name)
- Export all

### Step 3: Build `mcp-server/src/tools-simple.ts`
- Loads only the Router skill via `loadSkill(skillsDir, "router")`
- Registers one tool: `divergent_think`
- Broad trigger description covering ideation, brainstorming, reframing, stuck problems
- Returns `router.body + userInput` (same pattern as current server)
- Export: `registerSimpleTool(server, skillsDir)`

### Step 4: Build `mcp-server/src/tools-pro.ts`
- Config array mapping clean tool names to skill directories:

| Tool Name | Skill Directory |
|-----------|----------------|
| `diagnose_problem` | `wrong-problem-detector` |
| `generate_diverse` | `guilford-engine` |
| `generate_personas` | `persona-divergence-engine` |
| `think_wrong` | `think-wrong` |
| `audit_diversity` | `anti-homogeneity-check` |
| `map_blind_spots` | `blind-spot-scan` |
| `extract_desire` | `strip-down` |
| `generate_fast` | `short-think` |
| `explore_range` | `wild-to-mild` |
| `generate_bad` | `bad-on-purpose` |
| `generate_constrained` | `macgyver-mode` |
| `inject_random` | `random-injection` |
| `ask_questions` | `dumb-questions-engine` |
| `humanize_text` | `de-slop` |

- Iterates config array, loads each skill, registers with execution instruction in description
- Export: `registerProTools(server, skillsDir)`

### Step 5: Build `mcp-server/src/index.ts`
- `MODE` env var: `simple` (default), `pro`, or `all`
- `createServer()` calls `registerSimpleTool` and/or `registerProTools` based on MODE
- Carry over full transport logic from current server (lines 128-309):
  - stdio for local
  - HTTP with StreamableHTTPServerTransport for remote
  - Session management, CORS, health check, stale session recovery
- Update server name to `"divergent-agents"`

### Step 6: Create `mcp-server/package.json` and `tsconfig.json`
- Copy from current server, update package name to `divergent-agents-mcp`
- Same dependencies: `@modelcontextprotocol/sdk ^1.12.0`, `zod ^3.25.0`

### Step 7: Create `railway.json`
- Same Nixpacks pattern as current repo
- Adjust paths for new repo structure

### Step 8: Write `agents/product.md`
Product Manager domain agent system prompt (~800 words):
- **Identity:** Product thinking partner
- **Tool-situation mapping:** if-then blocks mapping user situations to specific pro-mode tool names
- **Workflow guidance:** how to chain tools (audit -> generate into gaps, diagnose -> extract_desire -> generate)
- **Voice:** user-needs framing, "what problem does this solve?", concrete next steps

### Step 9: Write `README.md`
- What this is, quick start for both modes
- Setup instructions for Claude.ai, ChatGPT, Claude Desktop
- How to use with a domain agent Project

### Step 10: Test locally
- `npm run build`
- Test `MODE=simple` via stdio (verify 1 tool registered)
- Test `MODE=pro` via stdio (verify 14 tools registered)
- Test `MODE=all` via stdio (verify 15 tools registered)

## Key Design Decisions

1. **Copy skills, don't symlink** — symlinks break in Docker/Railway. Skills are small (~49KB total). Repos can diverge.
2. **One server, MODE env var** — simpler than two servers. Same codebase, different tool sets.
3. **No router in pro mode** — orchestration belongs in the agent system prompt, not a competing tool.
4. **No fill_gaps tool** — gap-filling is routing logic. Agent prompt handles: "after audit_diversity finds gaps, call generate_diverse targeted at the gap."
5. **Skills still return full protocols** — the "LLM executes the protocol" pattern works. Don't change what's working.

## Verification

1. Build succeeds: `cd mcp-server && npm run build`
2. Simple mode: run with `MODE=simple`, connect via Claude Desktop, verify one `divergent_think` tool appears
3. Pro mode: run with `MODE=pro`, connect via Claude Desktop, verify all 14 tools appear with correct names
4. Functional test: in simple mode, ask "help me brainstorm ways to reduce user churn" — verify Router protocol executes
5. Functional test: in pro mode, call `audit_diversity` with a set of ideas — verify Anti-Homogeneity Check executes
6. Agent test: create a Claude Project with `agents/product.md` as instructions + pro mode MCP, verify it chains tools appropriately
