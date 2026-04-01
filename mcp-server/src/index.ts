#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import * as path from "path";
import { loadSkills } from "./skills.js";
import { registerSimpleTool } from "./tools-simple.js";
import { registerProTools } from "./tools-pro.js";
import { registerComposableTools } from "./tools-composable.js";
import { DOMAINS, DomainConfig } from "./domains/index.js";

// ---------------------------------------------------------------------------
// MODE: "simple" (default) | "pro" | "composable" | "all"
// ---------------------------------------------------------------------------

type Mode = "simple" | "pro" | "composable" | "all";

function getMode(): Mode {
  const raw = (process.env.MODE || "simple").toLowerCase();
  if (raw === "simple" || raw === "pro" || raw === "composable" || raw === "all") return raw;
  console.error(`Unknown MODE "${raw}", falling back to "simple"`);
  return "simple";
}

// ---------------------------------------------------------------------------
// Parse ?agents= query param into domain configs
// ---------------------------------------------------------------------------

function parseDomainAgents(agentsParam: string | null): DomainConfig[] {
  if (!agentsParam) return [];
  if (agentsParam === "all") return Object.values(DOMAINS);

  return agentsParam
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter((id) => {
      if (!DOMAINS[id]) {
        console.error(`Unknown domain agent: "${id}" — skipping`);
        return false;
      }
      return true;
    })
    .map((id) => DOMAINS[id]);
}

// ---------------------------------------------------------------------------
// Create and configure the MCP server
// ---------------------------------------------------------------------------

function createServer(skillsDir: string, domains: DomainConfig[] = []): McpServer {
  const mode = getMode();

  const server = new McpServer({
    name: "divergent-agents",
    version: "1.0.0",
  });

  // If domain agents are requested, use composable mode with domain injection.
  // Each domain registers the 14 core tools (with its personality) + its front-door tool.
  if (domains.length > 0) {
    // For single domain: inject personality into core tools + register front-door
    // For multiple domains: register core tools without personality (neutral),
    // then register each domain's front-door tool. The front-door injects personality
    // when the LLM routes to it.
    if (domains.length === 1) {
      registerComposableTools(server, skillsDir, domains[0]);
    } else {
      // Core tools stay neutral — no single domain's personality baked in
      registerComposableTools(server, skillsDir);
      // Register each domain's front-door agent tool
      for (const domain of domains) {
        registerDomainFrontDoor(server, domain);
      }
    }
    console.error(
      `Server configured with domain agents: ${domains.map((d) => d.id).join(", ")}`
    );
    return server;
  }

  // Standard mode-based registration (no domain agents)
  if (mode === "simple" || mode === "all") {
    registerSimpleTool(server, skillsDir);
  }

  if (mode === "pro") {
    registerProTools(server, skillsDir);
  }

  if (mode === "composable" || mode === "all") {
    registerComposableTools(server, skillsDir);
  }

  console.error(`Server configured in "${mode}" mode`);
  return server;
}

// ---------------------------------------------------------------------------
// Register a domain's front-door agent tool (for multi-domain mode)
// ---------------------------------------------------------------------------

import { z } from "zod";

function registerDomainFrontDoor(server: McpServer, domain: DomainConfig): void {
  const agentToolName = `${domain.id}_agent`;

  server.tool(
    agentToolName,
    domain.agentToolDescription,
    {
      objective: z
        .string()
        .describe("What the user is trying to accomplish"),
      context: z
        .string()
        .optional()
        .describe("Additional context, constraints, or background"),
    },
    async ({ objective, context }) => {
      console.error(
        `[${new Date().toISOString()}] tool_call: ${agentToolName} (front-door)`
      );

      let assembled = `## ${domain.name}\n\n`;
      assembled += `${domain.personality}\n\n---\n\n`;
      assembled += `${domain.flows}\n\n---\n\n`;
      assembled += `## How Tools Work\n\n`;
      assembled += `Each tool returns a creative protocol. Execute the protocol and present results naturally. `;
      assembled += `When chaining tools, pass the JSON output from one tool as \`prior_output\` to the next. `;
      assembled += `The user never sees raw JSON — translate everything into natural language.\n\n`;
      assembled += `---\n\n`;

      const userInput = context
        ? `**Objective:** ${objective}\n\n**Context:** ${context}`
        : `**Objective:** ${objective}`;
      assembled += userInput;
      assembled += `\n\nBased on the objective above, decide which flow and tool to start with. Call that tool now.`;

      return {
        content: [{ type: "text" as const, text: assembled }],
      };
    }
  );

  console.error(`Registered front-door agent tool: ${agentToolName}`);
}

// ---------------------------------------------------------------------------
// Transport: stdio (local) or HTTP (remote)
// ---------------------------------------------------------------------------

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const skillsDir = path.join(repoRoot, "skills");
  const transport_mode = process.env.TRANSPORT || "stdio";
  const port = parseInt(process.env.PORT || "3000", 10);

  if (transport_mode === "http") {
    const { createServer: createHttpServer } = await import("node:http");
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    const { isInitializeRequest } = await import(
      "@modelcontextprotocol/sdk/types.js"
    );
    const { randomUUID } = await import("node:crypto");

    const sessions: Record<
      string,
      {
        transport: InstanceType<typeof StreamableHTTPServerTransport>;
        server: McpServer;
      }
    > = {};

    const httpServer = createHttpServer(async (req, res) => {
      // Parse URL once — use pathname for routing, searchParams for config
      const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname;

      // CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, mcp-session-id"
      );
      res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Favicon
      if (pathname === "/favicon.ico") {
        const faviconPath = path.join(
          repoRoot,
          "public",
          "images",
          "favicon-64x64-div-think-tools.png"
        );
        if (fs.existsSync(faviconPath)) {
          const icon = fs.readFileSync(faviconPath);
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          });
          res.end(icon);
        } else {
          res.writeHead(404);
          res.end();
        }
        return;
      }

      // Health check
      if (pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        const skillCount = loadSkills(skillsDir).length;
        res.end(
          JSON.stringify({
            status: "ok",
            mode: getMode(),
            tools: skillCount,
          })
        );
        return;
      }

      // Root — return 200 for connectivity checks
      if (pathname === "/" || pathname === "") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", mcp_endpoint: "/mcp", mode: getMode() }));
        return;
      }

      // Handle /mcp and /mcp/<agents> endpoints
      // Path-based routing: /mcp/product → same as /mcp?agents=product
      // Path-based routing: /mcp/product,strategy → same as /mcp?agents=product,strategy
      const mcpMatch = pathname.match(/^\/mcp(?:\/(.+))?$/);
      if (!mcpMatch) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      // If agents are in the path, merge with query param (path takes precedence)
      const pathAgents = mcpMatch[1] || null;
      if (pathAgents && !parsedUrl.searchParams.has("agents")) {
        parsedUrl.searchParams.set("agents", pathAgents);
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (req.method === "GET") {
        console.error(
          `[${new Date().toISOString()}] GET /mcp sessionId=${sessionId || "none"} sessionExists=${!!(sessionId && sessions[sessionId])} activeSessions=${Object.keys(sessions).length}`
        );
        if (sessionId && sessions[sessionId]) {
          await sessions[sessionId].transport.handleRequest(req, res);
        } else if (!sessionId) {
          // No session — likely a health/connectivity check from an MCP client
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok", protocol: "mcp", mode: getMode() }));
        } else {
          res.writeHead(400);
          res.end("Invalid session");
        }
        return;
      }

      if (req.method === "DELETE") {
        if (sessionId && sessions[sessionId]) {
          await sessions[sessionId].transport.handleRequest(req, res);
          delete sessions[sessionId];
        } else {
          res.writeHead(400);
          res.end("Invalid session");
        }
        return;
      }

      if (req.method === "POST") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }
        let body: any;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) {
          console.error(
            `[${new Date().toISOString()}] JSON parse error:`,
            e
          );
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }

        console.error(
          `[${new Date().toISOString()}] POST /mcp sessionId=${sessionId || "none"} method=${body?.method} isInit=${!sessionId && isInitializeRequest(body)} activeSessions=${Object.keys(sessions).length}`
        );

        // Existing session
        if (sessionId && sessions[sessionId]) {
          await sessions[sessionId].transport.handleRequest(req, res, body);
          return;
        }

        // Stale session
        if (sessionId && !sessions[sessionId]) {
          console.error(
            `[${new Date().toISOString()}] stale_session: ${sessionId} — requesting re-initialize`
          );
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32001,
                message: "Session expired. Please reconnect.",
              },
              id: body?.id || null,
            })
          );
          return;
        }

        // New session
        if (!sessionId && isInitializeRequest(body)) {
          // Parse domain agents from query param at session init time
          const domains = parseDomainAgents(
            parsedUrl.searchParams.get("agents")
          );

          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id: string) => {
              sessions[id] = { transport, server };
              console.error(
                `[${new Date().toISOString()}] session_start: ${id}${domains.length ? ` agents=${domains.map((d) => d.id).join(",")}` : ""}`
              );
            },
          });

          transport.onclose = () => {
            if (transport.sessionId) {
              delete sessions[transport.sessionId];
              console.error(
                `[${new Date().toISOString()}] session_end: ${transport.sessionId}`
              );
            }
          };

          const server = createServer(skillsDir, domains);
          await server.connect(transport);
          await transport.handleRequest(req, res, body);
          return;
        }

        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message:
                "Invalid request — send an initialize request without a session ID to start",
            },
            id: null,
          })
        );
        return;
      }

      res.writeHead(405);
      res.end("Method not allowed");
    });

    httpServer.listen(port, () => {
      console.error(
        `Divergent Agents MCP server running on http://0.0.0.0:${port}/mcp`
      );
    });
  } else {
    // Local mode: stdio transport
    const server = createServer(skillsDir);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Divergent Agents MCP server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
