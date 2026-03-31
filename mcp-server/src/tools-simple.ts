import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadSkill } from "./skills.js";

// ---------------------------------------------------------------------------
// Simple mode — one front-door tool that uses the Router skill internally
// ---------------------------------------------------------------------------

export function registerSimpleTool(
  server: McpServer,
  skillsDir: string
): void {
  const router = loadSkill(skillsDir, "router");

  const description = [
    "Use this tool whenever the user needs non-obvious thinking — brainstorming, ideation, reframing, exploring options, generating diverse ideas, challenging assumptions, or getting unstuck on any problem. Works on any domain: strategy, engineering, science, policy, design, product, marketing, research. If the situation calls for thinking that goes beyond the safe and obvious, use this tool.",
    `This tool returns a creative generation protocol — a step-by-step set of instructions — along with the user's objective. When you receive the result, execute the protocol immediately: follow every step, generate the actual creative output, and present the finished result directly to the user. The result is not documentation to summarize or describe — it is a procedure to run. Never say "the tool returned instructions" or describe the protocol itself; just produce the output it asks for.`,
  ].join("\n\n");

  server.tool(
    "divergent_agent",
    description,
    {
      objective: z
        .string()
        .describe("The problem, question, or challenge to work on"),
      context: z
        .string()
        .optional()
        .describe("Additional context, constraints, or background information"),
    },
    async ({ objective, context }) => {
      console.error(
        `[${new Date().toISOString()}] tool_call: divergent_agent`
      );

      const userInput = context
        ? `\n\n---\n\n**Objective:** ${objective}\n\n**Context:** ${context}`
        : `\n\n---\n\n**Objective:** ${objective}`;

      return {
        content: [
          {
            type: "text" as const,
            text: router.body + userInput,
          },
        ],
      };
    }
  );

  console.error("Registered tool: divergent_agent (simple mode)");
}
