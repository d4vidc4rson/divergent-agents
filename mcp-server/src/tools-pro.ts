import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadSkill } from "./skills.js";

// ---------------------------------------------------------------------------
// Pro mode — 14 modular tools with clean names
// ---------------------------------------------------------------------------

const TOOL_CONFIG: Array<{ toolName: string; skillDir: string }> = [
  { toolName: "diagnose_problem", skillDir: "wrong-problem-detector" },
  { toolName: "generate_diverse", skillDir: "guilford-engine" },
  { toolName: "generate_personas", skillDir: "persona-divergence-engine" },
  { toolName: "think_wrong", skillDir: "think-wrong" },
  { toolName: "audit_diversity", skillDir: "anti-homogeneity-check" },
  { toolName: "map_blind_spots", skillDir: "blind-spot-scan" },
  { toolName: "extract_desire", skillDir: "strip-down" },
  { toolName: "generate_fast", skillDir: "short-think" },
  { toolName: "explore_range", skillDir: "wild-to-mild" },
  { toolName: "generate_bad", skillDir: "bad-on-purpose" },
  { toolName: "generate_constrained", skillDir: "macgyver-mode" },
  { toolName: "inject_random", skillDir: "random-injection" },
  { toolName: "ask_questions", skillDir: "dumb-questions-engine" },
  { toolName: "humanize_text", skillDir: "de-slop" },
];

const EXECUTION_INSTRUCTION = `This tool returns a creative generation protocol — a step-by-step set of instructions — along with the user's objective. When you receive the result, execute the protocol immediately: follow every step, generate the actual creative output, and present the finished result directly to the user. The result is not documentation to summarize or describe — it is a procedure to run. Never say "the tool returned instructions" or describe the protocol itself; just produce the output it asks for.`;

export function registerProTools(
  server: McpServer,
  skillsDir: string
): void {
  const registered: string[] = [];

  for (const { toolName, skillDir } of TOOL_CONFIG) {
    const skill = loadSkill(skillsDir, skillDir);
    const toolDescription = [skill.description, EXECUTION_INSTRUCTION].join(
      "\n\n"
    );

    server.tool(
      toolName,
      toolDescription,
      {
        objective: z
          .string()
          .describe("The problem, question, or challenge to work on"),
        context: z
          .string()
          .optional()
          .describe(
            "Additional context, constraints, or background information"
          ),
      },
      async ({ objective, context }) => {
        console.error(
          `[${new Date().toISOString()}] tool_call: ${toolName}`
        );

        const userInput = context
          ? `\n\n---\n\n**Objective:** ${objective}\n\n**Context:** ${context}`
          : `\n\n---\n\n**Objective:** ${objective}`;

        return {
          content: [
            {
              type: "text" as const,
              text: skill.body + userInput,
            },
          ],
        };
      }
    );

    registered.push(toolName);
  }

  console.error(
    `Registered ${registered.length} tools (pro mode): ${registered.join(", ")}`
  );
}
