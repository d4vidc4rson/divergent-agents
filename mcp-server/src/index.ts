#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import * as path from "path";
import { loadSkills } from "./skills.js";
import { registerSimpleTool } from "./tools-simple.js";
import { registerProTools } from "./tools-pro.js";

// ---------------------------------------------------------------------------
// MODE: "simple" (default) | "pro" | "all"
// ---------------------------------------------------------------------------

type Mode = "simple" | "pro" | "all";

function getMode(): Mode {
  const raw = (process.env.MODE || "simple").toLowerCase();
  if (raw === "simple" || raw === "pro" || raw === "all") return raw;
  console.error(`Unknown MODE "${raw}", falling back to "simple"`);
  return "simple";
}

// ---------------------------------------------------------------------------
// Create and configure the MCP server
// ---------------------------------------------------------------------------

function createServer(skillsDir: string): McpServer {
  const mode = getMode();

  const server = new McpServer({
    name: "divergent-agents",
    version: "1.0.0",
  });

  if (mode === "simple" || mode === "all") {
    registerSimpleTool(server, skillsDir);
  }

  if (mode === "pro" || mode === "all") {
    registerProTools(server, skillsDir);
  }

  console.error(`Server configured in "${mode}" mode`);
  return server;
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
      if (req.url === "/favicon.ico") {
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
      if (req.url === "/health") {
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

      // Only handle /mcp endpoint
      if (req.url !== "/mcp") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (req.method === "GET") {
        console.error(
          `[${new Date().toISOString()}] GET /mcp sessionId=${sessionId || "none"} sessionExists=${!!(sessionId && sessions[sessionId])} activeSessions=${Object.keys(sessions).length}`
        );
        if (sessionId && sessions[sessionId]) {
          await sessions[sessionId].transport.handleRequest(req, res);
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
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id: string) => {
              sessions[id] = { transport, server };
              console.error(
                `[${new Date().toISOString()}] session_start: ${id}`
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

          const server = createServer(skillsDir);
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
