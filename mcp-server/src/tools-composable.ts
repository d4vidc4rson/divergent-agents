import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadSkillV2 } from "./skills.js";

// ---------------------------------------------------------------------------
// Composable mode — 14 tools with structured JSON output + prior_output chaining
// ---------------------------------------------------------------------------

const COMPOSABLE_INSTRUCTION =
  `This tool returns a creative methodology and a required output schema. ` +
  `Execute the methodology, then produce output as valid JSON matching the schema. ` +
  `Wrap the JSON in a markdown code block. ` +
  `After the JSON, add a brief natural-language summary for the user.`;

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

export function registerComposableTools(
  server: McpServer,
  skillsDir: string
): void {
  for (const { toolName, skillDir } of TOOL_CONFIG) {
    const skill = loadSkillV2(skillsDir, skillDir);
    const hasSchema = Object.keys(skill.schema).length > 0;
    const toolDescription = [skill.description, COMPOSABLE_INSTRUCTION].join(
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
        prior_output: z
          .string()
          .optional()
          .describe(
            "JSON output from a previous tool call. For audit tools: pass ideas. " +
              "For generation tools: pass gaps or desire statements."
          ),
      },
      async ({ objective, context, prior_output }) => {
        console.error(
          `[${new Date().toISOString()}] tool_call: ${toolName} (composable) prior_output=${!!prior_output}`
        );

        let assembled = skill.protocol;

        // Append output schema if available
        if (hasSchema) {
          assembled += `\n\n---\n\n## Required Output Schema\n\n`;
          assembled +=
            "```json\n" + JSON.stringify(skill.schema, null, 2) + "\n```\n";
          assembled += `\nProduce a JSON object matching this schema, wrapped in a markdown code block.\n`;
        }

        // Inject prior output as context
        if (prior_output) {
          assembled += `\n\n---\n\n## Context From Previous Tool\n\n`;
          assembled += "```json\n" + prior_output + "\n```\n";
          assembled += `\nUse this as input. Reference idea IDs where applicable.\n`;
        }

        // Append user input
        const userInput = context
          ? `\n\n---\n\n**Objective:** ${objective}\n\n**Context:** ${context}`
          : `\n\n---\n\n**Objective:** ${objective}`;
        assembled += userInput;

        return {
          content: [
            {
              type: "text" as const,
              text: assembled,
            },
          ],
        };
      }
    );

    console.error(`Registered composable tool: ${toolName}`);
  }
}
