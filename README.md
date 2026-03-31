# Divergent Agents

Domain-specific AI agents powered by structured creativity tools. Stop getting the same ideas as everyone else.

This repo provides an MCP server with two modes:

- **Simple mode** — one `divergent_think` tool that automatically routes to the right thinking technique. Drop it into any MCP client and go.
- **Pro mode** — 14 modular tools (`diagnose_problem`, `generate_diverse`, `audit_diversity`, etc.) designed to be orchestrated by domain agent system prompts.

## Quick start

### Local (stdio)

```bash
cd mcp-server
npm install
npm run build

# Simple mode (default) — 1 tool
MODE=simple node dist/index.js

# Pro mode — 14 tools
MODE=pro node dist/index.js

# All tools — 15 tools (simple + pro)
MODE=all node dist/index.js
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "divergent-agents": {
      "command": "node",
      "args": ["/path/to/divergent-agents/mcp-server/dist/index.js"],
      "env": {
        "MODE": "simple"
      }
    }
  }
}
```

### Remote (HTTP)

```bash
cd mcp-server
TRANSPORT=http PORT=3000 MODE=simple node dist/index.js
```

Connect any MCP client to `http://your-host:3000/mcp`.

### Claude.ai (remote MCP)

Use the hosted URL as a remote MCP server in Claude.ai settings. Set `MODE=simple` for general use, or `MODE=pro` with a domain agent Project.

## Modes

| Mode | Tools | Use case |
|------|-------|----------|
| `simple` | 1 (`divergent_think`) | General use in any MCP client — the router picks the right technique |
| `pro` | 14 modular tools | Use with a domain agent system prompt in a Claude Project |
| `all` | 15 (both) | Development/testing |

## Pro mode tools

| Tool | What it does |
|------|-------------|
| `diagnose_problem` | Check if you're solving the right problem |
| `generate_diverse` | Generate genuinely different ideas using Guilford's framework |
| `generate_personas` | Ideas from radically different constructed personas |
| `think_wrong` | Push toward counterintuitive, non-obvious approaches |
| `audit_diversity` | Score whether your ideas are actually different |
| `map_blind_spots` | Find what you forgot to think about |
| `extract_desire` | Strip briefs to raw human desire before ideating |
| `generate_fast` | Rapid gut-level ideas, no deliberation |
| `explore_range` | Ideas across the full moonshot-to-Monday spectrum |
| `generate_bad` | Deliberately terrible ideas that unlock hidden value |
| `generate_constrained` | Solutions using only resources already available |
| `inject_random` | Genuine randomness to break exhausted patterns |
| `ask_questions` | Generate questions, not answers |
| `humanize_text` | Transform AI-generated text into human-sounding copy |

## Domain agents

Domain agents are system prompts that orchestrate pro-mode tools for specific roles. Paste them into Claude Project Instructions (or equivalent).

**Available agents:**
- [`agents/product.md`](agents/product.md) — Product Manager thinking partner

### Using a domain agent

1. Deploy or run the MCP server in `pro` mode
2. Create a new Claude Project
3. Add the MCP server as a remote tool
4. Paste the agent system prompt (e.g., `agents/product.md`) into Project Instructions
5. Start working — the agent knows when and how to use each tool

## Deployment

### Railway

```bash
# Push to Railway — uses railway.json for build config
railway up
```

Set environment variables:
- `TRANSPORT=http`
- `MODE=simple` (or `pro`)
- `PORT` is set automatically by Railway

## License

MIT
