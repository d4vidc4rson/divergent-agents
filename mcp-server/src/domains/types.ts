// ---------------------------------------------------------------------------
// Domain config — personality + orchestration injected into tool responses
// ---------------------------------------------------------------------------

export interface DomainConfig {
  /** Short identifier used in URLs and MODE values (e.g., "product") */
  id: string;

  /** Display name (e.g., "Product Thinking Partner") */
  name: string;

  /** Tool description for the domain's front-door agent tool */
  agentToolDescription: string;

  /**
   * Personality and voice injected into every tool response.
   * This is what makes the LLM "become" the domain agent.
   */
  personality: string;

  /**
   * Per-tool chaining hints. After a tool runs, these tell the LLM
   * what to do next in this domain's context.
   * Key = tool name, value = chaining instruction.
   */
  chainingHints: Record<string, string>;

  /**
   * Per-tool presentation overrides. If set, these replace the default
   * PRESENTATION instructions from tools-composable for this domain.
   * Key = tool name, value = presentation instruction.
   * If not set for a tool, the default presentation is used.
   */
  presentationOverrides?: Record<string, string>;

  /**
   * Standard flows — returned by the front-door agent tool to guide
   * the LLM on which tools to chain for common scenarios.
   */
  flows: string;
}
