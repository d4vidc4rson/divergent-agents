import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadSkillV2 } from "./skills.js";

// ---------------------------------------------------------------------------
// Composable mode — 14 tools with structured JSON output + prior_output chaining
// ---------------------------------------------------------------------------

const BASE_INSTRUCTION =
  `This tool returns a creative methodology and a required output schema. ` +
  `Execute the methodology internally. Produce a JSON object matching the schema ` +
  `for internal use (tool chaining) — do NOT display raw JSON to the user.`;

// Per-tool presentation instructions
const PRESENTATION: Record<string, string> = {
  diagnose_problem:
    `Present the main reframe as a bold question. List 2-3 alternative angles briefly. ` +
    `Ask the user which reframe resonates before proceeding. ` +
    `Do not generate solutions — this tool only reframes the problem.`,

  generate_diverse:
    `Present ideas grouped by theme/cluster. Lead each group with the strongest idea. ` +
    `Show feasibility tags (now/soon/stretch/moonshot) inline. ` +
    `After the ideas, name the "default answer" — what everyone else would say — ` +
    `so the user sees what they're choosing against. End with "Want me to push deeper on any of these?"`,

  generate_personas:
    `Present each persona's ideas under the persona name (1-2 line persona description). ` +
    `After all personas, highlight the "singularity" — the rare idea only one persona generated ` +
    `that has real potential. End with collision points: where personas fundamentally disagree.`,

  think_wrong:
    `Present the counterintuitive position as a confident argument — not a list, not hedged. ` +
    `Name what the consensus says, then make the case for why the opposite might be true. ` +
    `Include the expert pushback honestly. Let the user decide if the position has merit.`,

  audit_diversity:
    `Lead with the grade (A/B/C/D) and a one-sentence verdict. ` +
    `Name the clusters and how many ideas landed in each. ` +
    `Then name the gaps — dimensions the ideas don't touch at all. ` +
    `End with a recommendation: "Want me to generate ideas targeting these gaps?"`,

  map_blind_spots:
    `Present blind spots as a prioritized list, most critical first. ` +
    `For each blind spot, name the dimension and what's missing in plain language. ` +
    `End with: "Which of these should we address first?"`,

  extract_desire:
    `Present the desire statement as a single bold sentence — the raw human want. ` +
    `Below it, show who the person actually is (not the business role, the human situation). ` +
    `Ask the user: "Does this capture it, or is the real desire something else?"`,

  generate_fast:
    `Present ideas as a rapid-fire numbered list. No commentary, no grouping, no feasibility tags. ` +
    `Just the ideas, fast. End with: "Any of these worth developing further?"`,

  explore_range:
    `Present ideas organized by altitude: Monday Morning → This Quarter → Stretch → Moonshot. ` +
    `Make the tradeoffs explicit at each level — what you gain in ambition, what you lose in certainty. ` +
    `End with: "Where on this spectrum do you want to play?"`,

  generate_bad:
    `Present the terrible ideas with a light touch — they should make the user laugh or wince. ` +
    `Then pivot: "But here's what's buried in those bad ideas..." and present the extracted value. ` +
    `Show the "5% version" — the kernel of each bad idea that's actually viable.`,

  generate_constrained:
    `Start with the inventory — what the user already has. ` +
    `Then show ideas that combine existing resources in unexpected ways. ` +
    `For each idea, name which resources it uses. ` +
    `End with: "All of these use only what you already have — zero new spend."`,

  inject_random:
    `Name the random word and the principles extracted from it. ` +
    `Then show how each principle transfers to the user's problem. ` +
    `The connection should feel surprising but logical in hindsight. ` +
    `Don't apologize for the randomness — own it.`,

  ask_questions:
    `Present questions grouped by type. Star the 3-5 "dangerous" questions — ` +
    `the ones that would make a domain expert uncomfortable. ` +
    `Do not answer the questions. End with: "Which of these do you want to explore?"`,

  humanize_text:
    `Show the transformed text directly — no before/after comparison unless the user asks. ` +
    `After the text, briefly note what changed (e.g., "Removed hedge words, broke up long sentences, ` +
    `added a specific detail in paragraph 2"). Keep the meta-commentary to 1-2 sentences.`,
};

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
    const presentation = PRESENTATION[toolName] || "";
    const toolDescription = [
      skill.description,
      BASE_INSTRUCTION,
      presentation,
    ].join("\n\n");

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
          assembled += `\nProduce a JSON object matching this schema for internal use (tool chaining). Do NOT display the JSON to the user.\n`;
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
